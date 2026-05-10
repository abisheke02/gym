const express = require('express');
const db = require('../db');
const memberService = require('../services/member');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, memberSchemas } = require('../middleware/validation');

const router = express.Router();

// Get all members with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, branch_id, plan_id, search, limit, include_inactive } = req.query;

    const filters = {
      status,
      branch_id,
      plan_id,
      search,
      limit: limit ? parseInt(limit) : 100,
      include_inactive: include_inactive === 'true',
    };

    // Non-owners are always scoped to their branch
    if (['sales', 'accountant'].includes(req.user.role) && req.user.branch_id) {
      filters.branch_id = req.user.branch_id;
    }
    // Only owners/managers can query deleted members
    if (filters.include_inactive && !['owner', 'manager'].includes(req.user.role)) {
      filters.include_inactive = false;
    }

    const members = await memberService.getMembers(filters);
    res.json({ members });
  } catch (error) {
    console.error('Get members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
});

// Get member by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const member = await memberService.getMemberById(req.params.id);
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json({ member });
  } catch (error) {
    console.error('Get member error:', error);
    res.status(500).json({ error: 'Failed to get member' });
  }
});

// Create member
router.post('/', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), validate(memberSchemas.create), async (req, res) => {
  try {
    const member = await memberService.createMember(req.body, req.user.id);
    res.status(201).json({
      message: 'Member created successfully',
      member: member.member
    });
  } catch (error) {
    console.error('Create member error:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// Update member
router.put('/:id', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), validate(memberSchemas.update), async (req, res) => {
  try {
    const member = await memberService.updateMember(req.params.id, req.body);
    res.json({
      message: 'Member updated successfully',
      member
    });
  } catch (error) {
    console.error('Update member error:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// Check-in member
router.post('/:id/checkin', authMiddleware, async (req, res) => {
  try {
    const member = await memberService.checkIn(req.params.id);
    res.json({
      message: 'Member checked in',
      member
    });
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check in member' });
  }
});

// Get inactive members (no check-in for 5+ days, excludes soft-deleted)
router.get('/inactive/list', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, phone, last_check_in, status, branch_id
      FROM members
      WHERE is_active = true
        AND status = 'active'
        AND (last_check_in IS NULL OR last_check_in < NOW() - INTERVAL '5 days')
      ORDER BY last_check_in ASC NULLS FIRST
      LIMIT 100
    `);
    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get inactive members error:', error);
    res.status(500).json({ error: 'Failed to get inactive members' });
  }
});

// Get expiring members (excludes soft-deleted)
router.get('/expiring/list', authMiddleware, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const result = await db.query(
      `SELECT id, name, phone, plan_end_date, plan_name, branch_id
       FROM members
       WHERE is_active = true
         AND status = 'active'
         AND plan_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + ($1 || ' days')::INTERVAL
       ORDER BY plan_end_date ASC
       LIMIT 100`,
      [days]
    );
    res.json({ members: result.rows });
  } catch (error) {
    console.error('Get expiring members error:', error);
    res.status(500).json({ error: 'Failed to get expiring members' });
  }
});

// Renew member
router.post('/:id/renew', authMiddleware, rbacMiddleware('owner', 'manager', 'sales', 'accountant'), async (req, res) => {
  try {
    const { plan_id, amount, payment_mode, transaction_id, discount_amount, notes } = req.body;
    
    const result = await memberService.renewMember(req.params.id, plan_id, {
      amount,
      payment_mode,
      transaction_id,
      discount_amount,
      notes
    }, req.user.id);

    res.json({
      message: 'Member renewed successfully',
      member: result.member
    });
  } catch (error) {
    console.error('Renew member error:', error);
    res.status(500).json({ error: 'Failed to renew member' });
  }
});

// Delete member (soft delete)
router.delete('/:id', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE members SET is_active = false, status = 'cancelled', updated_at = NOW()
       WHERE id = $1 AND is_active = true RETURNING id, name`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: `Member ${result.rows[0].name} deleted successfully` });
  } catch (error) {
    console.error('Delete member error:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

// Get member stats
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const { branch_id } = req.query;
    const stats = await memberService.getMemberStats(branch_id || req.user.branch_id);
    res.json({ stats });
  } catch (error) {
    console.error('Get member stats error:', error);
    res.status(500).json({ error: 'Failed to get member stats' });
  }
});

module.exports = router;

