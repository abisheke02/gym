const db = require('../db');

class FinanceService {
  // Get daily collections
  async getDailyCollections(branchId = null, date = new Date()) {
    try {
      if (!(date instanceof Date) || isNaN(date)) {
        date = new Date();
      }
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
        WHERE p.created_at::date = $1
      `;
      
      const params = [date.toISOString().split('T')[0]];
      let paramIndex = 2;

      if (branchId) {
        query += ` AND p.branch_id = $${paramIndex++}`;
        params.push(branchId);
      }

      query += ` ORDER BY p.created_at DESC`;

      const result = await db.query(query, params);

      // Calculate totals
      const total = result.rows.reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const cash = result.rows.filter(p => p.payment_mode === 'cash').reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const upi = result.rows.filter(p => p.payment_mode === 'upi').reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const card = result.rows.filter(p => p.payment_mode === 'card').reduce((sum, p) => sum + parseFloat(p.amount), 0);
      const online = result.rows.filter(p => p.payment_mode === 'online').reduce((sum, p) => sum + parseFloat(p.amount), 0);

      return {
        date: date.toISOString().split('T')[0],
        transactions: result.rows,
        summary: {
          total,
          cash,
          upi,
          card,
          online,
          transaction_count: result.rows.length
        }
      };
    } catch (error) {
      console.error('Get daily collections error:', error);
      throw error;
    }
  }

  // Get monthly revenue
  async getMonthlyRevenue(branchId = null, year = new Date().getFullYear(), month = new Date().getMonth() + 1) {
    try {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);

      let query = `
        SELECT DATE(p.created_at) as date,
          SUM(p.amount) as daily_total,
          COUNT(*) as transaction_count
        FROM payments p
        WHERE p.created_at >= $1 AND p.created_at <= $2
      `;
      
      const params = [startDate, endDate];
      let paramIndex = 3;

      if (branchId) {
        query += ` AND p.branch_id = $${paramIndex++}`;
        params.push(branchId);
      }

      query += ` GROUP BY DATE(p.created_at) ORDER BY date`;

      const result = await db.query(query, params);

      // Get total for month
      const totalResult = await db.query(`
        SELECT SUM(amount) as total, COUNT(*) as count
        FROM payments
        WHERE created_at >= $1 AND created_at <= $2
        ${branchId ? 'AND branch_id = $3' : ''}
      `, branchId ? [startDate, endDate, branchId] : [startDate, endDate]);

      return {
        month: `${year}-${String(month).padStart(2, '0')}`,
        dailyBreakdown: result.rows,
        total: parseFloat(totalResult.rows[0].total || 0),
        transactionCount: parseInt(totalResult.rows[0].count || 0)
      };
    } catch (error) {
      console.error('Get monthly revenue error:', error);
      throw error;
    }
  }

  // Get branch P&L
  async getBranchPL(branchId = null, startDate, endDate) {
    try {
      // Revenue (Payments)
      const revenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total_revenue
        FROM payments
        WHERE created_at >= $1 AND created_at <= $2
        ${branchId ? 'AND branch_id = $3' : ''}
      `, branchId ? [startDate, endDate, branchId] : [startDate, endDate]);

      // Expenses by category
      const expensesResult = await db.query(`
        SELECT category, SUM(amount) as total
        FROM expenses
        WHERE expense_date >= $1 AND expense_date <= $2
        ${branchId ? 'AND branch_id = $3' : ''}
        GROUP BY category
      `, branchId ? [startDate, endDate, branchId] : [startDate, endDate]);

      const totalExpenses = expensesResult.rows.reduce((sum, e) => sum + parseFloat(e.total), 0);
      const totalRevenue = parseFloat(revenueResult.rows[0].total_revenue);
      const netIncome = totalRevenue - totalExpenses;

      const expensesByCategory = {};
      expensesResult.rows.forEach(e => {
        expensesByCategory[e.category] = parseFloat(e.total);
      });

      return {
        period: { startDate, endDate },
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome,
        profitMargin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0,
        expensesByCategory,
        isProfit: netIncome >= 0
      };
    } catch (error) {
      console.error('Get branch P&L error:', error);
      throw error;
    }
  }

  // Get net income (all branches)
  async getNetIncome(startDate, endDate) {
    try {
      // Total revenue
      const revenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at >= $1 AND created_at <= $2
      `, [startDate, endDate]);

      // Total expenses
      const expenseResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE expense_date >= $1 AND expense_date <= $2
      `, [startDate, endDate]);

      const totalRevenue = parseFloat(revenueResult.rows[0].total);
      const totalExpenses = parseFloat(expenseResult.rows[0].total);
      const netIncome = totalRevenue - totalExpenses;

      // Get branch-wise breakdown
      const branchBreakdown = await db.query(`
        SELECT b.id, b.name,
          COALESCE((SELECT SUM(amount) FROM payments p WHERE p.branch_id = b.id AND p.created_at >= $1 AND p.created_at <= $2), 0) as revenue,
          COALESCE((SELECT SUM(amount) FROM expenses e WHERE e.branch_id = b.id AND e.expense_date >= $1 AND e.expense_date <= $2), 0) as expenses
        FROM branches b
        WHERE b.is_active = true
      `, [startDate, endDate]);

      return {
        period: { startDate, endDate },
        grossIncome: totalRevenue,
        totalExpenses,
        netIncome,
        profitMargin: totalRevenue > 0 ? ((netIncome / totalRevenue) * 100).toFixed(2) : 0,
        branchWise: branchBreakdown.rows.map(b => ({
          branchId: b.id,
          branchName: b.name,
          revenue: parseFloat(b.revenue),
          expenses: parseFloat(b.expenses),
          netIncome: parseFloat(b.revenue) - parseFloat(b.expenses)
        }))
      };
    } catch (error) {
      console.error('Get net income error:', error);
      throw error;
    }
  }

  // Get cashflow
  async getCashflow(branchId = null, startDate, endDate) {
    try {
      // Opening balance (payments before start date)
      const openingResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at < $1
        ${branchId ? 'AND branch_id = $2' : ''}
      `, branchId ? [startDate, branchId] : [startDate]);

      // Cash inflows (payments in period)
      const inflowsResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at >= $1 AND created_at <= $2
        ${branchId ? 'AND branch_id = $3' : ''}
      `, branchId ? [startDate, endDate, branchId] : [startDate, endDate]);

      // Cash outflows (expenses in period)
      const outflowsResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE expense_date >= $1 AND expense_date <= $2
        ${branchId ? 'AND branch_id = $3' : ''}
      `, branchId ? [startDate, endDate, branchId] : [startDate, endDate]);

      const openingBalance = parseFloat(openingResult.rows[0].total);
      const inflows = parseFloat(inflowsResult.rows[0].total);
      const outflows = parseFloat(outflowsResult.rows[0].total);
      const closingBalance = openingBalance + inflows - outflows;

      return {
        period: { startDate, endDate },
        openingBalance,
        inflows,
        outflows,
        closingBalance,
        netCashflow: inflows - outflows
      };
    } catch (error) {
      console.error('Get cashflow error:', error);
      throw error;
    }
  }

  // Get ROI on ads
  async getAdROI(startDate, endDate) {
    try {
      // Get ad expenses
      const adExpensesResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE category = 'ads' AND expense_date >= $1 AND expense_date <= $2
      `, [startDate, endDate]);

      // Get revenue in same period
      const revenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at >= $1 AND created_at <= $2
      `, [startDate, endDate]);

      const adSpend = parseFloat(adExpensesResult.rows[0].total);
      const revenue = parseFloat(revenueResult.rows[0].total);
      const roi = adSpend > 0 ? ((revenue - adSpend) / adSpend * 100) : 0;

      return {
        period: { startDate, endDate },
        adSpend,
        revenue,
        roi: roi.toFixed(2),
        isProfitable: revenue >= adSpend
      };
    } catch (error) {
      console.error('Get ad ROI error:', error);
      throw error;
    }
  }

  // Record payment
  async recordPayment(paymentData, userId) {
    try {
      const result = await db.query(`
        INSERT INTO payments (member_id, amount, payment_mode, transaction_id, discount_amount, notes, recorded_by, branch_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [
        paymentData.member_id,
        paymentData.amount,
        paymentData.payment_mode,
        paymentData.transaction_id,
        paymentData.discount_amount || 0,
        paymentData.notes,
        userId,
        paymentData.branch_id
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Record payment error:', error);
      throw error;
    }
  }

  // Record expense
  async recordExpense(expenseData, userId) {
    try {
      const result = await db.query(`
        INSERT INTO expenses (branch_id, category, amount, description, expense_date, recorded_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [
        expenseData.branch_id,
        expenseData.category,
        expenseData.amount,
        expenseData.description,
        expenseData.expense_date,
        userId
      ]);

      return result.rows[0];
    } catch (error) {
      console.error('Record expense error:', error);
      throw error;
    }
  }

  // Get expenses
  async getExpenses(branchId = null, startDate, endDate) {
    try {
      let query = `
        SELECT e.*, 
          b.name as branch_name,
          u.full_name as recorded_by_name
        FROM expenses e
        LEFT JOIN branches b ON e.branch_id = b.id
        LEFT JOIN users u ON e.recorded_by = u.id
        WHERE e.expense_date >= $1 AND e.expense_date <= $2
      `;
      
      const params = [startDate, endDate];
      let paramIndex = 3;

      if (branchId) {
        query += ` AND e.branch_id = $${paramIndex++}`;
        params.push(branchId);
      }

      query += ` ORDER BY e.expense_date DESC`;

      const result = await db.query(query, params);

      // Calculate totals by category
      const byCategory = {};
      let total = 0;
      result.rows.forEach(e => {
        if (!byCategory[e.category]) {
          byCategory[e.category] = 0;
        }
        byCategory[e.category] += parseFloat(e.amount);
        total += parseFloat(e.amount);
      });

      return {
        expenses: result.rows,
        total,
        byCategory
      };
    } catch (error) {
      console.error('Get expenses error:', error);
      throw error;
    }
  }

  // Get dashboard summary
  async getDashboardSummary(branchId = null) {
    try {
      // Today's revenue
      const todayRevenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at::date = CURRENT_DATE
        ${branchId ? 'AND branch_id = $1' : ''}
      `, branchId ? [branchId] : []);

      // This week's revenue
      const weekRevenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
        ${branchId ? 'AND branch_id = $1' : ''}
      `, branchId ? [branchId] : []);

      // This month's revenue (MTD)
      const monthRevenueResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
        ${branchId ? 'AND branch_id = $1' : ''}
      `, branchId ? [branchId] : []);

      // Today's expenses
      const todayExpensesResult = await db.query(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM expenses
        WHERE expense_date = CURRENT_DATE
        ${branchId ? 'AND branch_id = $1' : ''}
      `, branchId ? [branchId] : []);

      // Active members
      const activeMembersResult = await db.query(`
        SELECT COUNT(*) as count
        FROM members
        WHERE status = 'active'
        ${branchId ? 'AND branch_id = $1' : ''}
      `, branchId ? [branchId] : []);

      // Today's leads
      const todayLeadsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE created_at::date = CURRENT_DATE
      `);

      // New leads this week
      const weekLeadsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `);

      // New leads this month
      const monthLeadsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE)
      `);

      // Leads awaiting follow-up
      const followUpsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE follow_up_schedule <= NOW()
          AND status NOT IN ('joined', 'lost')
      `);

      // SLA breached leads
      const slaBreachedResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE sla_breached = true
          AND status NOT IN ('joined', 'lost')
      `);

      // Expiring members (next 7 days)
      const expiringResult = await db.query(`
        SELECT COUNT(*) as count
        FROM members
        WHERE status = 'active'
          AND plan_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      `);

      // Weekly chart data (last 7 days)
      const weeklyDataResult = await db.query(`
        WITH days AS (
          SELECT generate_series(
            CURRENT_DATE - INTERVAL '6 days',
            CURRENT_DATE,
            INTERVAL '1 day'
          )::date as day
        )
        SELECT 
          TO_CHAR(d.day, 'Dy') as name,
          COALESCE((SELECT SUM(amount) FROM payments p WHERE p.created_at::date = d.day ${branchId ? 'AND p.branch_id = $1' : ''}), 0) as revenue,
          COALESCE((SELECT COUNT(*) FROM leads l WHERE l.created_at::date = d.day), 0) as leads
        FROM days d
        ORDER BY d.day
      `, branchId ? [branchId] : []);

      return {
        todayRevenue: parseFloat(todayRevenueResult.rows[0].total),
        weekRevenue: parseFloat(weekRevenueResult.rows[0].total),
        monthRevenue: parseFloat(monthRevenueResult.rows[0].total),
        todayExpenses: parseFloat(todayExpensesResult.rows[0].total),
        todayNet: parseFloat(todayRevenueResult.rows[0].total) - parseFloat(todayExpensesResult.rows[0].total),
        activeMembers: parseInt(activeMembersResult.rows[0].count),
        todayLeads: parseInt(todayLeadsResult.rows[0].count),
        weekLeads: parseInt(weekLeadsResult.rows[0].count),
        monthLeads: parseInt(monthLeadsResult.rows[0].count),
        followUpsDue: parseInt(followUpsResult.rows[0].count),
        slaBreached: parseInt(slaBreachedResult.rows[0].count),
        expiringMembers: parseInt(expiringResult.rows[0].count),
        weeklyChartData: weeklyDataResult.rows.map(row => ({
          ...row,
          revenue: parseFloat(row.revenue),
          leads: parseInt(row.leads)
        }))
      };
    } catch (error) {
      console.error('Get dashboard summary error:', error);
      throw error;
    }
  }

  // Get receptionist summary (No financial data)
  async getReceptionistSummary(branchId = null) {
    try {
      // Active members
      const activeMembersResult = await db.query(`
        SELECT COUNT(*) as count
        FROM members
        WHERE status = 'active'
        ${branchId ? 'AND branch_id = $1' : ''}
      `, branchId ? [branchId] : []);

      // Today's leads
      const todayLeadsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE created_at::date = CURRENT_DATE
      `);

      // New leads this week
      const weekLeadsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
      `);

      // Leads awaiting follow-up
      const followUpsResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE follow_up_schedule <= NOW()
          AND status NOT IN ('joined', 'lost')
      `);

      // SLA breached leads
      const slaBreachedResult = await db.query(`
        SELECT COUNT(*) as count
        FROM leads
        WHERE sla_breached = true
          AND status NOT IN ('joined', 'lost')
      `);

      // Expiring members (next 7 days)
      const expiringResult = await db.query(`
        SELECT COUNT(*) as count
        FROM members
        WHERE status = 'active'
          AND plan_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'
      `);

      return {
        activeMembers: parseInt(activeMembersResult.rows[0].count),
        todayLeads: parseInt(todayLeadsResult.rows[0].count),
        weekLeads: parseInt(weekLeadsResult.rows[0].count),
        followUpsDue: parseInt(followUpsResult.rows[0].count),
        slaBreached: parseInt(slaBreachedResult.rows[0].count),
        expiringMembers: parseInt(expiringResult.rows[0].count)
      };
    } catch (error) {
      console.error('Get receptionist summary error:', error);
      throw error;
    }
  }

  // Get KPIs
  async getKPIs(branchId = null) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Lead conversion rate
      const leadsResult = await db.query(`
        SELECT 
          COUNT(*) as total_leads,
          COUNT(CASE WHEN status = 'joined' THEN 1 END) as converted_leads
        FROM leads
        WHERE created_at >= $1
      `, [sixtyDaysAgo]);

      const leadConversionRate = leadsResult.rows[0].total_leads > 0 
        ? ((leadsResult.rows[0].converted_leads / leadsResult.rows[0].total_leads) * 100).toFixed(2)
        : 0;

      // Member retention rate
      const retentionResult = await db.query(`
        SELECT 
          COUNT(*) as expiring_members,
          COUNT(CASE WHEN status = 'active' AND plan_end_date < CURRENT_DATE THEN 1 END) as renewed
        FROM members
        WHERE plan_end_date >= CURRENT_DATE - INTERVAL '30 days'
      `);

      const retentionRate = retentionResult.rows[0].expiring_members > 0
        ? ((retentionResult.rows[0].renewed / retentionResult.rows[0].expiring_members) * 100).toFixed(2)
        : 0;

      // Revenue per member
      const rpmResult = await db.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COUNT(DISTINCT member_id) as member_count
        FROM payments
        WHERE created_at >= $1
      `, [thirtyDaysAgo]);

      const revenuePerMember = rpmResult.rows[0].member_count > 0
        ? (rpmResult.rows[0].total_revenue / rpmResult.rows[0].member_count).toFixed(2)
        : 0;

      // Average response time (simplified - actual would track first contact)
      const responseTimeResult = await db.query(`
        SELECT AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_minutes
        FROM leads
        WHERE status != 'new' AND created_at >= $1
      `, [thirtyDaysAgo]);

      const avgResponseTime = parseFloat(responseTimeResult.rows[0].avg_minutes || 0).toFixed(1);

      // Expense ratio
      const expenseRatioResult = await db.query(`
        SELECT 
          (SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE expense_date >= $1) as total_expenses,
          (SELECT COALESCE(SUM(amount), 0) FROM payments WHERE created_at >= $1) as total_revenue
      `, [thirtyDaysAgo]);

      const expenseRatio = expenseRatioResult.rows[0].total_revenue > 0
        ? ((expenseRatioResult.rows[0].total_expenses / expenseRatioResult.rows[0].total_revenue) * 100).toFixed(2)
        : 0;

      // Net profit margin
      const netProfitMargin = expenseRatioResult.rows[0].total_revenue > 0
        ? (((expenseRatioResult.rows[0].total_revenue - expenseRatioResult.rows[0].total_expenses) / expenseRatioResult.rows[0].total_revenue) * 100).toFixed(2)
        : 0;

      return {
        leadConversionRate,
        retentionRate,
        revenuePerMember,
        avgResponseTime,
        expenseRatio,
        netProfitMargin
      };
    } catch (error) {
      console.error('Get KPIs error:', error);
      throw error;
    }
  }
}

module.exports = new FinanceService();

