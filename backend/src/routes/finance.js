const express = require('express');
const db = require('../db');
const financeService = require('../services/finance');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, paymentSchemas, expenseSchemas } = require('../middleware/validation');

const router = express.Router();

// === PAYMENTS ===

// Get payments
router.get('/payments', authMiddleware, rbacMiddleware('owner', 'manager', 'accountant'), async (req, res) => {
  try {
    const { branch_id, member_id, start_date, end_date, limit } = req.query;
    
    let query = `
      SELECT p.*, 
        m.name as member_name,
        m.phone as member_phone,
        b.name as branch_name,
        u.full_name as recorded_by_name
      FROM payments p
      LEFT JOIN members m ON p.member_id = m.id
      LEFT JOIN branches b ON p.branch_id = b.id
      LEFT JOIN users u ON p.recorded_by = u.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramIndex = 1;

    if (branch_id) {
      query += ` AND p.branch_id = $${paramIndex++}`;
      params.push(branch_id);
    }

    if (member_id) {
      query += ` AND p.member_id = $${paramIndex++}`;
      params.push(member_id);
    }

    if (start_date) {
      query += ` AND p.created_at >= $${paramIndex++}`;
      params.push(start_date);
    }

    if (end_date) {
      query += ` AND p.created_at <= $${paramIndex++}`;
      params.push(end_date);
    }

    query += ` ORDER BY p.created_at DESC`;

    if (limit) {
      query += ` LIMIT $${paramIndex++}`;
      params.push(parseInt(limit));
    }

    const result = await db.query(query, params);
    res.json({ payments: result.rows });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ error: 'Failed to get payments' });
  }
});

// Record payment
router.post('/payments', authMiddleware, rbacMiddleware('owner', 'manager', 'accountant'), validate(paymentSchemas.create), async (req, res) => {
  try {
    const payment = await financeService.recordPayment(req.body, req.user.id);
    res.status(201).json({
      message: 'Payment recorded successfully',
      payment
    });
  } catch (error) {
    console.error('Record payment error:', error);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// === EXPENSES ===

// Get expenses
router.get('/expenses', authMiddleware, rbacMiddleware('owner', 'manager', 'accountant'), async (req, res) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const data = await financeService.getExpenses(branch_id, start_date, end_date);
    res.json(data);
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ error: 'Failed to get expenses' });
  }
});

// Record expense
router.post('/expenses', authMiddleware, rbacMiddleware('owner', 'manager', 'accountant'), validate(expenseSchemas.create), async (req, res) => {
  try {
    const expense = await financeService.recordExpense(req.body, req.user.id);
    res.status(201).json({
      message: 'Expense recorded successfully',
      expense
    });
  } catch (error) {
    console.error('Record expense error:', error);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

// === REPORTS ===

// Daily collections
router.get('/reports/daily-collection', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const { branch_id, date } = req.query;
    const data = await financeService.getDailyCollections(branch_id, date ? new Date(date) : new Date());
    res.json(data);
  } catch (error) {
    console.error('Get daily collection error:', error);
    res.status(500).json({ error: 'Failed to get daily collection' });
  }
});

// Monthly revenue
router.get('/reports/monthly-revenue', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const { branch_id, year, month } = req.query;
    const data = await financeService.getMonthlyRevenue(branch_id, parseInt(year), parseInt(month));
    res.json(data);
  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({ error: 'Failed to get monthly revenue' });
  }
});

// Branch P&L
router.get('/reports/branch-pnl', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const data = await financeService.getBranchPL(branch_id, start_date, end_date);
    res.json(data);
  } catch (error) {
    console.error('Get branch P&L error:', error);
    res.status(500).json({ error: 'Failed to get branch P&L' });
  }
});

// Net income
router.get('/reports/net-income', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const data = await financeService.getNetIncome(start_date, end_date);
    res.json(data);
  } catch (error) {
    console.error('Get net income error:', error);
    res.status(500).json({ error: 'Failed to get net income' });
  }
});

// Cashflow
router.get('/reports/cashflow', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const { branch_id, start_date, end_date } = req.query;
    const data = await financeService.getCashflow(branch_id, start_date, end_date);
    res.json(data);
  } catch (error) {
    console.error('Get cashflow error:', error);
    res.status(500).json({ error: 'Failed to get cashflow' });
  }
});

// ROI on ads
router.get('/reports/roi-ads', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const data = await financeService.getAdROI(start_date, end_date);
    res.json(data);
  } catch (error) {
    console.error('Get ad ROI error:', error);
    res.status(500).json({ error: 'Failed to get ad ROI' });
  }
});

// === DASHBOARD ===

// Receptionist summary (No financial data)
router.get('/dashboard/receptionist-summary', authMiddleware, async (req, res) => {
  try {
    const { branch_id } = req.query;
    const data = await financeService.getReceptionistSummary(branch_id || req.user.branch_id);
    res.json(data);
  } catch (error) {
    console.error('Get receptionist summary error:', error);
    res.status(500).json({ error: 'Failed to get receptionist summary' });
  }
});

// Dashboard summary
router.get('/dashboard/summary', authMiddleware, rbacMiddleware('owner', 'manager', 'accountant'), async (req, res) => {
  try {
    const { branch_id } = req.query;
    const data = await financeService.getDashboardSummary(branch_id || req.user.branch_id);
    res.json(data);
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    res.status(500).json({ error: 'Failed to get dashboard summary' });
  }
});

// Weekly lead flow — last 7 days daily count
router.get('/dashboard/weekly-leads', authMiddleware, async (req, res) => {
  try {
    const { branch_id } = req.query;
    const params = [];
    let branchClause = '';
    if (branch_id || req.user.branch_id) {
      params.push(branch_id || req.user.branch_id);
      branchClause = `AND branch_id = $1`;
    }
    const result = await db.query(
      `SELECT
         TO_CHAR(d.day, 'Dy') AS name,
         COALESCE(COUNT(l.id), 0)::int AS leads
       FROM generate_series(
         CURRENT_DATE - INTERVAL '6 days',
         CURRENT_DATE,
         '1 day'::interval
       ) AS d(day)
       LEFT JOIN leads l
         ON l.created_at::date = d.day::date ${branchClause}
       GROUP BY d.day
       ORDER BY d.day`,
      params
    );
    res.json({ weekly: result.rows });
  } catch (error) {
    console.error('Weekly leads error:', error);
    res.status(500).json({ error: 'Failed to get weekly leads' });
  }
});

// KPIs
router.get('/dashboard/kpis', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const { branch_id } = req.query;
    const data = await financeService.getKPIs(branch_id);
    res.json(data);
  } catch (error) {
    console.error('Get KPIs error:', error);
    res.status(500).json({ error: 'Failed to get KPIs' });
  }
});

module.exports = router;

