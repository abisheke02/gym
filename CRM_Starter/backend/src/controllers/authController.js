const db = require('../db/pool');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.register = async (req, res) => {
  const { email, password, full_name, role_name } = req.body;
  try {
    const password_hash = await bcrypt.hash(password, 12);
    const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [role_name || 'staff']);
    const role_id = roleResult.rows[0].id;

    const result = await db.query(
      'INSERT INTO users (email, password_hash, full_name, role_id) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name',
      [email, password_hash, full_name, role_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await db.query(
      'SELECT u.*, r.name as role FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) return res.status(400).json({ error: 'Invalid email or password.' });

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) return res.status(400).json({ error: 'Invalid email or password.' });

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '1d' }
    );

    res.json({ token, user: { id: user.id, email: user.email, role: user.role, full_name: user.full_name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
