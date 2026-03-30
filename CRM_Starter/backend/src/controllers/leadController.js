const db = require('../db/pool');

exports.createLead = async (req, res) => {
  const { name, phone, email, status, source, branch_id, notes } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO leads (name, phone, email, status, source, branch_id, notes) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [name, phone, email, status || 'new', source, branch_id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getLeads = async (req, res) => {
  const { search, status } = req.query;
  try {
    let query = 'SELECT * FROM leads WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (name ILIKE $${params.length} OR phone ILIKE $${params.length})`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
