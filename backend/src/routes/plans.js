const express = require('express');
const db = require('../db');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, planSchemas } = require('../middleware/validation');

const router = express.Router();

// Get all plans
router.get('/', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT p.*, 
        (SELECT COUNT(*) FROM members m WHERE m.plan_id = p.id AND m.status = 'active') as active_members
      FROM plans p
      WHERE p.is_active = true
      ORDER BY p.duration_months
    `);
    res.json({ plans: result.rows });
  } catch (error) {
    console.error('Get plans error:', error);
    res.status(500).json({ error: 'Failed to get plans' });
  }
});

// Get plan by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM plans WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ plan: result.rows[0] });
  } catch (error) {
    console.error('Get plan error:', error);
    res.status(500).json({ error: 'Failed to get plan' });
  }
});

// Create plan (Owner only)
router.post('/', authMiddleware, rbacMiddleware('owner'), validate(planSchemas.create), async (req, res) => {
  try {
    const { name, duration_months, price, description } = req.body;

    const result = await db.query(`
      INSERT INTO plans (name, duration_months, price, description)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [name, duration_months, price, description]);

    res.status(201).json({
      message: 'Plan created successfully',
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Create plan error:', error);
    res.status(500).json({ error: 'Failed to create plan' });
  }
});

// Update plan (Owner only)
router.put('/:id', authMiddleware, rbacMiddleware('owner'), validate(planSchemas.update), async (req, res) => {
  try {
    const { name, duration_months, price, description, is_active } = req.body;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (duration_months) { fields.push(`duration_months = $${paramIndex++}`); values.push(duration_months); }
    if (price) { fields.push(`price = $${paramIndex++}`); values.push(price); }
    if (description !== undefined) { fields.push(`description = $${paramIndex++}`); values.push(description); }
    if (is_active !== undefined) { fields.push(`is_active = $${paramIndex++}`); values.push(is_active); }

    values.push(req.params.id);

    const result = await db.query(`
      UPDATE plans 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({
      message: 'Plan updated successfully',
      plan: result.rows[0]
    });
  } catch (error) {
    console.error('Update plan error:', error);
    res.status(500).json({ error: 'Failed to update plan' });
  }
});

// Delete plan (Owner only)
router.delete('/:id', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    // Soft delete - just mark as inactive
    const result = await db.query(`
      UPDATE plans 
      SET is_active = false
      WHERE id = $1
      RETURNING *
    `, [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('Delete plan error:', error);
    res.status(500).json({ error: 'Failed to delete plan' });
  }
});

module.exports = router;

