const express = require('express');
const db = require('../db');
const leadService = require('../services/lead');
const whatsappService = require('../services/whatsapp');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, leadSchemas } = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for temporary file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `leads-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /csv|xlsx|xls/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only .csv and .xlsx files are allowed!'));
  }
});

const router = express.Router();

// Get all leads with filters
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, branch_id, assigned_to, source_id, sla_breached, limit } = req.query;
    
    const filters = {
      status,
      branch_id,
      assigned_to,
      source_id,
      sla_breached: sla_breached === 'true' ? true : sla_breached === 'false' ? false : undefined,
      limit: limit ? parseInt(limit) : 100
    };

    const leads = await leadService.getLeads(filters);
    res.json({ leads });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ error: 'Failed to get leads' });
  }
});

// Get follow-ups due
router.get('/followups', authMiddleware, async (req, res) => {
  try {
    const followUps = await leadService.getFollowUpsDue();
    res.json({ followUps });
  } catch (error) {
    console.error('Get follow-ups error:', error);
    res.status(500).json({ error: 'Failed to get follow-ups' });
  }
});

// Get lead by ID
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const lead = await leadService.getLeadById(req.params.id);
    
    if (!lead) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({ lead });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ error: 'Failed to get lead' });
  }
});

// Create lead manually
router.post('/', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), validate(leadSchemas.create), async (req, res) => {
  try {
    const lead = await leadService.createLead(req.body, req.user.id);
    res.status(201).json({
      message: 'Lead created successfully',
      lead: lead.lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

// Update lead
router.put('/:id', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), validate(leadSchemas.update), async (req, res) => {
  try {
    const { name, phone, email, gender, age, address, source_id, branch_id, assigned_to, status, notes } = req.body;

    const fields = [];
    const values = [];
    let paramIndex = 1;

    if (name) { fields.push(`name = $${paramIndex++}`); values.push(name); }
    if (phone) { fields.push(`phone = $${paramIndex++}`); values.push(phone); }
    if (email !== undefined) { fields.push(`email = $${paramIndex++}`); values.push(email); }
    if (gender) { fields.push(`gender = $${paramIndex++}`); values.push(gender); }
    if (age) { fields.push(`age = $${paramIndex++}`); values.push(age); }
    if (address !== undefined) { fields.push(`address = $${paramIndex++}`); values.push(address); }
    if (source_id) { fields.push(`source_id = $${paramIndex++}`); values.push(source_id); }
    if (branch_id) { fields.push(`branch_id = $${paramIndex++}`); values.push(branch_id); }
    if (assigned_to) { fields.push(`assigned_to = $${paramIndex++}`); values.push(assigned_to); }
    if (status) { fields.push(`status = $${paramIndex++}`); values.push(status); }
    if (notes !== undefined) { fields.push(`notes = $${paramIndex++}`); values.push(notes); }

    fields.push(`updated_at = NOW()`);
    values.push(req.params.id);

    const result = await db.query(`
      UPDATE leads 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      message: 'Lead updated successfully',
      lead: result.rows[0]
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Update lead status
router.patch('/:id/status', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['new', 'contacted', 'visited', 'trial', 'joined', 'lost'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const lead = await leadService.updateLeadStatus(req.params.id, status, req.user.id);
    res.json({
      message: 'Lead status updated',
      lead
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({ error: 'Failed to update lead status' });
  }
});

// Assign lead to staff
router.post('/:id/assign', authMiddleware, rbacMiddleware('owner', 'manager'), validate(leadSchemas.assign), async (req, res) => {
  try {
    const lead = await leadService.assignLead(req.params.id, req.body.assigned_to, req.user.id);
    res.json({
      message: 'Lead assigned successfully',
      lead
    });
  } catch (error) {
    console.error('Assign lead error:', error);
    res.status(500).json({ error: 'Failed to assign lead' });
  }
});

// Schedule follow-up
router.post('/:id/followup', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), validate(leadSchemas.followup), async (req, res) => {
  try {
    const { follow_up_schedule, notes } = req.body;
    const lead = await leadService.scheduleFollowUp(req.params.id, new Date(follow_up_schedule), notes, req.user.id);
    res.json({
      message: 'Follow-up scheduled',
      lead
    });
  } catch (error) {
    console.error('Schedule follow-up error:', error);
    res.status(500).json({ error: 'Failed to schedule follow-up' });
  }
});

// Send WhatsApp message
router.post('/:id/whatsapp', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), validate(leadSchemas.whatsapp), async (req, res) => {
  try {
    const leadResult = await db.query('SELECT phone FROM leads WHERE id = $1', [req.params.id]);
    
    if (leadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const result = await whatsappService.sendMessage(
      leadResult.rows[0].phone,
      req.body.message,
      req.params.id
    );

    res.json({
      message: 'WhatsApp message sent',
      result
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

// Convert lead to member
router.post('/:id/convert', authMiddleware, rbacMiddleware('owner', 'manager', 'sales'), async (req, res) => {
  try {
    const { branch_id, plan_id, plan_start_date, plan_end_date, joining_date, amount, payment_mode, membership_id } = req.body;
    
    const result = await leadService.convertToMember(req.params.id, {
      branch_id,
      plan_id,
      amount,
      payment_mode,
      membership_id,
      plan_start_date: new Date(plan_start_date),
      plan_end_date: new Date(plan_end_date),
      joining_date: new Date(joining_date || new Date())
    }, req.user.id);

    res.json({
      message: 'Lead converted to member',
      member: result.member
    });
  } catch (error) {
    console.error('Convert lead error:', error);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

// Get lead sources
router.get('/meta/sources', authMiddleware, async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM lead_sources WHERE is_active = true ORDER BY name');
    res.json({ sources: result.rows });
  } catch (error) {
    console.error('Get sources error:', error);
    res.status(500).json({ error: 'Failed to get sources' });
  }
});

// Bulk upload leads
router.post('/bulk-upload', authMiddleware, rbacMiddleware('owner', 'manager'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { branch_id } = req.body;
    const results = await leadService.bulkUploadLeads(req.file, req.user.id, branch_id);

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      message: 'Bulk upload completed',
      results
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    // Cleanup on error if file exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to process bulk upload' });
  }
});

module.exports = router;

