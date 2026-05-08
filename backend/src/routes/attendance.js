/**
 * Attendance routes — proper check-in/check-out with date-wise history.
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware: authenticate } = require('../middleware/auth');

// POST /api/attendance/checkin
router.post('/checkin', authenticate, async (req, res) => {
  const { member_id, branch_id } = req.body;
  if (!member_id) return res.status(400).json({ error: 'member_id required' });

  try {
    // Check if already checked in today without checkout
    const existing = await db.query(
      `SELECT id FROM attendance
       WHERE member_id = $1 AND date = CURRENT_DATE AND check_out IS NULL`,
      [member_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already checked in today. Check out first.' });
    }

    const result = await db.query(
      `INSERT INTO attendance (member_id, branch_id, check_in, date)
       VALUES ($1, $2, NOW(), CURRENT_DATE) RETURNING *`,
      [member_id, branch_id || null]
    );

    // Update member last_check_in
    await db.query(
      `UPDATE members SET last_check_in = NOW() WHERE id = $1`,
      [member_id]
    );

    res.status(201).json({ attendance: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Check-in failed' });
  }
});

// POST /api/attendance/checkout
router.post('/checkout', authenticate, async (req, res) => {
  const { member_id } = req.body;
  if (!member_id) return res.status(400).json({ error: 'member_id required' });

  try {
    const result = await db.query(
      `UPDATE attendance SET check_out = NOW()
       WHERE member_id = $1 AND date = CURRENT_DATE AND check_out IS NULL
       RETURNING *`,
      [member_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No active check-in found for today' });
    }
    res.json({ attendance: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: 'Check-out failed' });
  }
});

// GET /api/attendance — list with filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { date, branch_id, member_id, limit = 100 } = req.query;
    const conditions = [];
    const params = [];

    if (date) {
      params.push(date);
      conditions.push(`a.date = $${params.length}`);
    } else {
      // default to today
      conditions.push(`a.date = CURRENT_DATE`);
    }
    if (branch_id) {
      params.push(branch_id);
      conditions.push(`a.branch_id = $${params.length}`);
    }
    if (member_id) {
      params.push(member_id);
      conditions.push(`a.member_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(parseInt(limit));

    const result = await db.query(
      `SELECT a.*, m.name AS member_name, m.phone, b.name AS branch_name
       FROM attendance a
       LEFT JOIN members m ON m.id = a.member_id
       LEFT JOIN branches b ON b.id = a.branch_id
       ${where}
       ORDER BY a.check_in DESC
       LIMIT $${params.length}`,
      params
    );
    res.json({ attendance: result.rows, count: result.rows.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/stats — daily/monthly stats
router.get('/stats', authenticate, async (req, res) => {
  try {
    const { branch_id } = req.query;
    const params = branch_id ? [branch_id] : [];
    const branchFilter = branch_id ? `AND branch_id = $1` : '';

    const [todayRes, monthRes, weekRes] = await Promise.all([
      db.query(`SELECT COUNT(*) AS count FROM attendance WHERE date = CURRENT_DATE ${branchFilter}`, params),
      db.query(`SELECT COUNT(*) AS count FROM attendance WHERE date >= DATE_TRUNC('month', CURRENT_DATE) ${branchFilter}`, params),
      db.query(`SELECT COUNT(*) AS count FROM attendance WHERE date >= CURRENT_DATE - INTERVAL '7 days' ${branchFilter}`, params),
    ]);

    res.json({
      today: parseInt(todayRes.rows[0].count),
      this_week: parseInt(weekRes.rows[0].count),
      this_month: parseInt(monthRes.rows[0].count),
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/attendance/member/:id — member history
router.get('/member/:id', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, b.name AS branch_name
       FROM attendance a
       LEFT JOIN branches b ON b.id = a.branch_id
       WHERE a.member_id = $1
       ORDER BY a.check_in DESC LIMIT 60`,
      [req.params.id]
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch member attendance' });
  }
});

module.exports = router;
