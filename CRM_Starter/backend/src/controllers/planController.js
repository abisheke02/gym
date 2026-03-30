const db = require('../db/pool');

exports.createPlan = async (req, res) => {
  const { name, duration_months, price, description } = req.body;
  try {
    const result = await db.query(
      'INSERT INTO plans (name, duration_months, price, description) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, duration_months, price, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getPlans = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM plans WHERE is_active = true ORDER BY price ASC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
