const express = require('express');
const crypto = require('crypto');
const config = require('../config');
const leadService = require('../services/lead');

const router = express.Router();

// Meta webhook verification (GET request)
router.get('/meta-lead', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.meta.verifyToken) {
    console.log('✅ Webhook verified');
    res.status(200).send(challenge);
  } else {
    console.log('❌ Webhook verification failed');
    res.sendStatus(403);
  }
});

// Meta lead ads webhook (POST request)
router.post('/meta-lead', async (req, res) => {
  try {
    // Verify webhook signature (optional but recommended)
    const signature = req.headers['x-hub-signature-256'];
    if (signature && config.meta.appSecret) {
      const hash = 'sha256=' + crypto
        .createHmac('sha256', config.meta.appSecret)
        .update(JSON.stringify(req.body))
        .digest('hex');
      
      if (signature !== hash) {
        console.error('❌ Invalid webhook signature');
        return res.sendStatus(403);
      }
    }

    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const leadData = changes?.value;

    if (!leadData || !leadData.leadgen_id) {
      console.log('No lead data found');
      return res.status(200).send('OK');
    }

    console.log('📥 Received Meta lead:', leadData.leadgen_id);

    // Extract lead data from Meta webhook
    // Note: Meta provides a leadgen_id, we need to query the lead details
    // For now, we'll create a basic lead structure
    // In production, you'd call Meta Graph API to get full lead details
    
    const leadFormData = leadData.field_data || [];
    
    // Extract common fields
    const getFieldValue = (name) => {
      const field = leadFormData.find(f => f.name === name);
      return field?.values?.[0] || '';
    };

    const leadInfo = {
      name: getFieldValue('full_name') || getFieldValue('name') || 'Unknown',
      phone: getFieldValue('phone_number') || getFieldValue('phone') || '',
      email: getFieldValue('email') || '',
      gender: getFieldValue('gender') || '',
      source_id: (await getDefaultLeadSource('meta_ads')),
      notes: `Source: Meta Lead Ads (ID: ${leadData.leadgen_id})`
    };

    // Validate phone number
    if (!leadInfo.phone) {
      console.error('❌ No phone number in lead data');
      return res.status(200).send('OK');
    }

    // Format phone number (ensure it has country code)
    if (leadInfo.phone.length === 10) {
      leadInfo.phone = '91' + leadInfo.phone;
    }

    // Create lead in system
    const result = await leadService.createLead(leadInfo);
    
    console.log('✅ Lead created from Meta:', result.lead.id);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).send('Error processing webhook');
  }
});

// Helper to get default lead source ID
async function getDefaultLeadSource(type) {
  const db = require('../db');
  const result = await db.query(
    'SELECT id FROM lead_sources WHERE type = $1 AND is_active = true LIMIT 1',
    [type]
  );
  return result.rows[0]?.id || null;
}

// Health check webhook for testing
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;

