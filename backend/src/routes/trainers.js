const express = require('express');
const db = require('../db');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all trainers (branch-aware)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { branch_id } = req.query;
    
    let query = `
      SELECT t.*, b.name as branch_name,
        (SELECT COUNT(*) FROM members m WHERE m.pt_trainer_id = t.id) as current_clients
      FROM trainers t
      LEFT JOIN branches b ON t.branch_id = b.id
      WHERE t.is_active = true
    `;
    
    const params = [];
    if (branch_id) {
      query += ` AND t.branch_id = $1`;
      params.push(branch_id);
    }
    
    query += ` ORDER BY t.name`;
    
    const result = await db.query(query, params);
    res.json({ trainers: result.rows });
  } catch (error) {
    console.error('Get trainers error:', error);
    res.status(500).json({ error: 'Failed to get trainers' });
  }
});

// Create trainer (Owner only)
router.post('/', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const { name, phone, email, specialization, salary, branch_id } = req.body;
    
    const result = await db.query(`
      INSERT INTO trainers (name, phone, email, specialization, salary, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [name, phone, email, specialization, salary, branch_id]);
    
    res.status(201).json({
      message: 'Trainer created successfully',
      trainer: result.rows[0]
    });
  } catch (error) {
    console.error('Create trainer error:', error);
    res.status(500).json({ error: 'Failed to create trainer' });
  }
});

// Update trainer (Owner/Manager)
router.put('/:id', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const { name, phone, email, specialization, salary, branch_id, is_active } = req.body;
    
    const result = await db.query(`
      UPDATE trainers 
      SET name = COALESCE($1, name),
          phone = COALESCE($2, phone),
          email = COALESCE($3, email),
          specialization = COALESCE($4, specialization),
          salary = COALESCE($5, salary),
          branch_id = COALESCE($6, branch_id),
          is_active = COALESCE($7, is_active),
          updated_at = NOW()
      WHERE id = $8
      RETURNING *
    `, [name, phone, email, specialization, salary, branch_id, is_active, req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    res.json({
      message: 'Trainer updated successfully',
      trainer: result.rows[0]
    });
  } catch (error) {
    console.error('Update trainer error:', error);
    res.status(500).json({ error: 'Failed to update trainer' });
  }
});

// Delete trainer (Soft delete)
router.delete('/:id', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const result = await db.query(`
      UPDATE trainers SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING *
    `, [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    res.json({ message: 'Trainer removed successfully' });
  } catch (error) {
    console.error('Delete trainer error:', error);
    res.status(500).json({ error: 'Failed to delete trainer' });
  }
});

module.exports = router;
