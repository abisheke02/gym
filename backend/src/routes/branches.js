const express = require('express');
const db = require('../db');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, branchSchemas } = require('../middleware/validation');

const router = express.Router();

// Get all branches
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, 
        u.full_name as manager_name,
        (SELECT COUNT(*) FROM members m WHERE m.branch_id = b.id AND m.status = 'active') as active_members,
        (SELECT COUNT(*) FROM users u2 WHERE u2.branch_id = b.id AND u2.is_active = true) as staff_count
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      WHERE b.is_active = true
      ORDER BY b.name
    `);

    res.json({ branches: result.rows });
  } catch (error) {
    console.error('Get branches error:', error);
    res.status(500).json({ error: 'Failed to get branches' });
  }
});

// Get branch by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT b.*, 
        u.full_name as manager_name,
        (SELECT COUNT(*) FROM members m WHERE m.branch_id = b.id AND m.status = 'active') as active_members
      FROM branches b
      LEFT JOIN users u ON b.manager_id = u.id
      WHERE b.id = $1
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({ branch: result.rows[0] });
  } catch (error) {
    console.error('Get branch error:', error);
    res.status(500).json({ error: 'Failed to get branch' });
  }
});

// Create branch (Owner only)
router.post('/', authMiddleware, rbacMiddleware('owner'), validate(branchSchemas.create), async (req, res) => {
  try {
    const { name, address, phone, manager_id } = req.body;

    const result = await db.query(`
      INSERT INTO branches (name, address, phone, manager_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, address, phone, manager_id]);

    // Update user's branch if manager assigned
    if (manager_id) {
      await db.query(
        'UPDATE users SET branch_id = $1 WHERE id = $2',
        [result.rows[0].id, manager_id]
      );
    }

    res.status(201).json({
      message: 'Branch created successfully',
      branch: result.rows[0]
    });
  } catch (error) {
    console.error('Create branch error:', error);
    res.status(500).json({ error: 'Failed to create branch' });
  }
});

// Update branch (Owner only)
router.put('/:id', authMiddleware, rbacMiddleware('owner'), validate(branchSchemas.update), async (req, res) => {
  try {
    const { name, address, phone, manager_id, is_active } = req.body;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      fields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (address !== undefined) {
      fields.push(`address = $${paramIndex++}`);
      values.push(address);
    }
    if (phone) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (manager_id !== undefined) {
      fields.push(`manager_id = $${paramIndex++}`);
      values.push(manager_id);
    }
    if (is_active !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }

    fields.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await db.query(`
      UPDATE branches 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({
      message: 'Branch updated successfully',
      branch: result.rows[0]
    });
  } catch (error) {
    console.error('Update branch error:', error);
    res.status(500).json({ error: 'Failed to update branch' });
  }
});

// Delete branch (Owner only)
router.delete('/:id', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    // Soft delete - just mark as inactive
    const result = await db.query(`
      UPDATE branches 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Branch not found' });
    }

    res.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Delete branch error:', error);
    res.status(500).json({ error: 'Failed to delete branch' });
  }
});

module.exports = router;

