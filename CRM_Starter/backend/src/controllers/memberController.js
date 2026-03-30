const db = require('../db/pool');

exports.createMember = async (req, res) => {
  const { name, phone, email, gender, age, address, branch_id, plan_id, joining_date, plan_start_date, plan_end_date } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO members (name, phone, email, gender, age, address, branch_id, plan_id, joining_date, plan_start_date, plan_end_date) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [name, phone, email, gender, age, address, branch_id, plan_id, joining_date, plan_start_date, plan_end_date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMembers = async (req, res) => {
  const { branch_id, status } = req.query;
  try {
    let query = 'SELECT m.*, p.name as plan_name FROM members m LEFT JOIN plans p ON m.plan_id = p.id WHERE 1=1';
    const params = [];

    if (branch_id) {
      params.push(branch_id);
      query += ` AND m.branch_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND m.status = $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
