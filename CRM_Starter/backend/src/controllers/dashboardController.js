const db = require('../db/pool');

exports.getStats = async (req, res) => {
  try {
    const leadsCount = await db.query("SELECT COUNT(*) FROM leads");
    const activeMembers = await db.query("SELECT COUNT(*) FROM members WHERE status = 'active'");
    const totalRevenue = await db.query("SELECT SUM(amount) FROM payments");
    const recentLeads = await db.query("SELECT * FROM leads ORDER BY created_at DESC LIMIT 5");

    res.json({
      summary: {
        totalLeads: leadsCount.rows[0].count,
        activeMembers: activeMembers.rows[0].count,
        totalRevenue: totalRevenue.rows[0].sum || 0
      },
      recentLeads: recentLeads.rows[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
