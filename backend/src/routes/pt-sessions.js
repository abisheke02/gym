const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');

// GET /api/pt-sessions/member/:id — all sessions for a member
router.get('/member/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT ps.*, t.name AS trainer_name, u.full_name AS recorded_by_name
      FROM pt_sessions ps
      LEFT JOIN trainers t ON t.id = ps.trainer_id
      LEFT JOIN users u ON u.id = ps.recorded_by
      WHERE ps.member_id = $1
      ORDER BY ps.session_date DESC, ps.created_at DESC
    `, [req.params.id]);

    // Also get PT summary from member
    const memberRes = await db.query(
      'SELECT pt_sessions_total, pt_sessions_completed, pt_trainer_id FROM members WHERE id = $1',
      [req.params.id]
    );

    res.json({
      sessions: result.rows,
      summary: memberRes.rows[0] || { pt_sessions_total: 0, pt_sessions_completed: 0 },
    });
  } catch (err) {
    console.error('Get PT sessions error:', err);
    res.status(500).json({ error: 'Failed to fetch PT sessions' });
  }
});

// POST /api/pt-sessions — log a session
router.post('/', authMiddleware, rbacMiddleware('owner', 'manager', 'sales', 'receptionist'), async (req, res) => {
  try {
    const { member_id, trainer_id, session_date, duration_minutes, notes } = req.body;

    if (!member_id) return res.status(400).json({ error: 'member_id is required' });

    // Check member exists and has PT
    const memberRes = await db.query(
      'SELECT id, name, pt_sessions_total, pt_sessions_completed FROM members WHERE id = $1 AND is_active = true',
      [member_id]
    );
    if (memberRes.rows.length === 0) return res.status(404).json({ error: 'Member not found' });

    const member = memberRes.rows[0];

    const result = await db.query(`
      INSERT INTO pt_sessions (member_id, trainer_id, session_date, duration_minutes, notes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      member_id,
      trainer_id || null,
      session_date || new Date().toISOString().split('T')[0],
      duration_minutes || 60,
      notes || null,
      req.user.id,
    ]);

    // Increment pt_sessions_completed on the member
    await db.query(
      'UPDATE members SET pt_sessions_completed = pt_sessions_completed + 1, updated_at = NOW() WHERE id = $1',
      [member_id]
    );

    res.status(201).json({
      message: `Session logged for ${member.name}`,
      session: result.rows[0],
      sessions_completed: (member.pt_sessions_completed || 0) + 1,
    });
  } catch (err) {
    console.error('Log PT session error:', err);
    res.status(500).json({ error: 'Failed to log session' });
  }
});

// DELETE /api/pt-sessions/:id — remove a session
router.delete('/:id', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const session = await db.query('SELECT member_id FROM pt_sessions WHERE id = $1', [req.params.id]);
    if (session.rows.length === 0) return res.status(404).json({ error: 'Session not found' });

    await db.query('DELETE FROM pt_sessions WHERE id = $1', [req.params.id]);

    // Decrement pt_sessions_completed (floor at 0)
    await db.query(
      'UPDATE members SET pt_sessions_completed = GREATEST(pt_sessions_completed - 1, 0), updated_at = NOW() WHERE id = $1',
      [session.rows[0].member_id]
    );

    res.json({ message: 'Session deleted' });
  } catch (err) {
    console.error('Delete PT session error:', err);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;
