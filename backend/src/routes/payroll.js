const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');

// GET /api/payroll — list all payroll records
router.get('/', authMiddleware, rbacMiddleware('owner', 'manager', 'accountant'), async (req, res) => {
  try {
    const { month, user_id } = req.query;
    const params = [];
    const conditions = [];

    if (month) {
      params.push(month);
      conditions.push(`p.salary_month = $${params.length}`);
    }
    if (user_id) {
      params.push(user_id);
      conditions.push(`p.user_id = $${params.length}`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(`
      SELECT p.*, u.full_name, u.role, u.phone,
             rb.full_name AS recorded_by_name
      FROM payroll p
      JOIN users u ON u.id = p.user_id
      LEFT JOIN users rb ON rb.id = p.recorded_by
      ${where}
      ORDER BY p.salary_month DESC, u.full_name
    `, params);

    // Monthly summary
    const summary = await db.query(`
      SELECT salary_month,
             COUNT(*) AS staff_count,
             SUM(amount) AS total_paid
      FROM payroll
      GROUP BY salary_month
      ORDER BY salary_month DESC
      LIMIT 12
    `);

    res.json({ payroll: result.rows, summary: summary.rows });
  } catch (err) {
    console.error('Get payroll error:', err);
    res.status(500).json({ error: 'Failed to fetch payroll' });
  }
});

// GET /api/payroll/staff-list — all staff with their salary info
router.get('/staff-list', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const result = await db.query(`
      SELECT u.id, u.full_name, u.role, u.phone, u.email,
             COALESCE(SUM(p.amount) FILTER (WHERE p.salary_month = $1), 0) AS paid_this_month,
             MAX(p.payment_date) FILTER (WHERE p.salary_month = $1) AS last_payment_date
      FROM users u
      LEFT JOIN payroll p ON p.user_id = u.id
      WHERE u.role != 'owner' AND u.is_active = true
      GROUP BY u.id
      ORDER BY u.full_name
    `, [currentMonth]);
    res.json({ staff: result.rows, month: currentMonth });
  } catch (err) {
    console.error('Get staff list error:', err);
    res.status(500).json({ error: 'Failed to fetch staff list' });
  }
});

// POST /api/payroll — record a salary payment
router.post('/', authMiddleware, rbacMiddleware('owner', 'manager', 'accountant'), async (req, res) => {
  try {
    const { user_id, amount, salary_month, payment_date, payment_mode, notes } = req.body;

    if (!user_id || !amount || !salary_month) {
      return res.status(400).json({ error: 'user_id, amount and salary_month are required' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Verify the user exists and is not an owner
    const userCheck = await db.query(
      'SELECT id, full_name, role FROM users WHERE id = $1 AND role != $2 AND is_active = true',
      [user_id, 'owner']
    );
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Staff member not found' });
    }

    const result = await db.query(`
      INSERT INTO payroll (user_id, amount, salary_month, payment_date, payment_mode, notes, recorded_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [
      user_id, amount,
      salary_month,
      payment_date || new Date().toISOString().split('T')[0],
      payment_mode || 'cash',
      notes || null,
      req.user.id
    ]);

    res.status(201).json({
      message: `Salary paid to ${userCheck.rows[0].full_name}`,
      payroll: result.rows[0]
    });
  } catch (err) {
    console.error('Create payroll error:', err);
    res.status(500).json({ error: 'Failed to record payroll' });
  }
});

// DELETE /api/payroll/:id — delete a payroll record
router.delete('/:id', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM payroll WHERE id = $1 RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    res.json({ message: 'Payroll record deleted' });
  } catch (err) {
    console.error('Delete payroll error:', err);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

module.exports = router;
