const express = require('express');
const router = express.Router();
const db = require('../db');
const whatsappService = require('../services/whatsapp');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');

// GET /api/messaging/history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = await db.query(
      `SELECT wm.id, wm.message_text, wm.status, wm.created_at,
              m.name AS member_name, m.phone
       FROM whatsapp_messages wm
       LEFT JOIN members m ON m.id = wm.member_id
       WHERE wm.direction = 'outbound'
       ORDER BY wm.created_at DESC
       LIMIT $1`,
      [parseInt(limit)]
    );
    res.json({ history: result.rows });
  } catch (err) {
    console.error('Messaging history error:', err);
    res.status(500).json({ error: 'Failed to fetch message history' });
  }
});

// POST /api/messaging/send-bulk
router.post('/send-bulk', authMiddleware, rbacMiddleware('owner', 'manager'), async (req, res) => {
  try {
    const { target, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

    let query = '';
    switch (target) {
      case 'active_members':
        query = `SELECT id, phone, name FROM members WHERE status = 'active' AND is_active = true AND phone IS NOT NULL`;
        break;
      case 'expired_members':
        query = `SELECT id, phone, name FROM members WHERE status = 'expired' AND is_active = true AND phone IS NOT NULL`;
        break;
      case 'expiring_soon':
        query = `SELECT id, phone, name FROM members WHERE status = 'active' AND is_active = true AND phone IS NOT NULL
                 AND plan_end_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`;
        break;
      case 'birthday_today':
        query = `SELECT id, phone, name FROM members WHERE is_active = true AND phone IS NOT NULL
                 AND EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
                 AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM CURRENT_DATE)`;
        break;
      default: // all_members
        query = `SELECT id, phone, name FROM members WHERE is_active = true AND phone IS NOT NULL`;
    }

    const members = await db.query(query);
    if (members.rows.length === 0) {
      return res.json({ sent: 0, failed: 0, message: 'No recipients found for this target' });
    }

    let sent = 0;
    let failed = 0;

    for (const member of members.rows) {
      const result = await whatsappService.sendMessage(member.phone, message, null, member.id);
      if (result.success) sent++;
      else failed++;
    }

    res.json({ sent, failed, total: members.rows.length });
  } catch (err) {
    console.error('Bulk messaging error:', err);
    res.status(500).json({ error: 'Failed to send bulk messages' });
  }
});

module.exports = router;
