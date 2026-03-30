const db = require('../db/pool');

exports.recordPayment = async (req, res) => {
  const { member_id, amount, payment_mode, transaction_id, branch_id } = req.body;
  try {
    const result = await db.query(
      `INSERT INTO payments (member_id, amount, payment_mode, transaction_id, recorded_by, branch_id) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [member_id, amount, payment_mode, transaction_id, req.user.id, branch_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPayments = async (req, res) => {
  const { branch_id, member_id } = req.query;
  try {
    let query = 'SELECT p.*, m.name as member_name FROM payments p JOIN members m ON p.member_id = m.id WHERE 1=1';
    const params = [];

    if (branch_id) {
      params.push(branch_id);
      query += ` AND p.branch_id = $${params.length}`;
    }

    if (member_id) {
      params.push(member_id);
      query += ` AND p.member_id = $${params.length}`;
    }

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
