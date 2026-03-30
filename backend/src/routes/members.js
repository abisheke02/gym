const express = require('express');
const db = require('../db');
const memberService = require('../services/member');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, memberSchemas } = require('../middleware/validation');

const router = express.Router();

// Get all members with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, branch_id, plan_id, search, limit } = req.query;
    
    const filters = {
      status,
      branch_id,
      plan_id,
      search,
      limit: limit ? parseInt(limit) : 100
    };

    // Apply branch filter based on role
    if (['sales', 'accountant'].includes(req.user.role) && req.user.branch_id) {
      filters.branch_id = req.user.branch_id;
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

// Get inactive members
router.get('/inactive/list', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const members = await memberService.getInactiveMembers();
    res.json({ members });
  } catch (error) {
    console.error('Get inactive members error:', error);
    res.status(500).json({ error: 'Failed to get inactive members' });
  }
});

// Get expiring members
router.get('/expiring/list', authMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    const members = await memberService.getExpiringMembers(days ? parseInt(days) : 7);
    res.json({ members });
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

