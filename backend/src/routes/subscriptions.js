/**
 * Software Subscription routes
 * Gym owners pay to use this SaaS platform (Monthly / Half-Yearly / Yearly).
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware: authenticate, rbacMiddleware: authorize } = require('../middleware/auth');
const razorpay = require('../services/razorpay');

const PLANS = {
  monthly:     { label: 'Monthly',     amount: 999,   months: 1,  savings: null },
  half_yearly: { label: 'Half Yearly', amount: 4999,  months: 6,  savings: 'Save 17%' },
  yearly:      { label: 'Yearly',      amount: 8999,  months: 12, savings: 'Save 25%' },
};

// GET /api/subscriptions/plans — public plan listing
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// GET /api/subscriptions/current — active subscription
router.get('/current', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM software_subscriptions
       WHERE status = 'active' AND end_date >= CURRENT_DATE
       ORDER BY created_at DESC LIMIT 1`
    );
    res.json({ subscription: result.rows[0] || null, plans: PLANS });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// GET /api/subscriptions/history
router.get('/history', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM software_subscriptions ORDER BY created_at DESC LIMIT 30'
    );
    res.json({ history: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// POST /api/subscriptions/create-order — create Razorpay order
router.post('/create-order', authenticate, authorize('owner'), async (req, res) => {
  const { plan_type } = req.body;
  const plan = PLANS[plan_type];
  if (!plan) return res.status(400).json({ error: 'Invalid plan type' });

  try {
    const order = await razorpay.createOrder({
      amount: plan.amount,
      currency: 'INR',
      receipt: `sub_${Date.now()}`,
      notes: { plan_type, plan_label: plan.label },
    });
    res.json({ order, plan, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Razorpay order error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create payment order' });
  }
});

// POST /api/subscriptions/verify-payment — verify + activate
router.post('/verify-payment', authenticate, authorize('owner'), async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan_type } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  const isValid = razorpay.verifyPaymentSignature({
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!isValid) return res.status(400).json({ error: 'Invalid payment signature' });

  const plan = PLANS[plan_type];
  if (!plan) return res.status(400).json({ error: 'Invalid plan type' });

  const startDate = new Date();
  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + plan.months);

  try {
    // Expire existing active subscriptions
    await db.query(
      `UPDATE software_subscriptions SET status = 'expired' WHERE status = 'active'`
    );

    const result = await db.query(
      `INSERT INTO software_subscriptions
         (plan_type, amount, start_date, end_date, payment_id, order_id, razorpay_signature, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *`,
      [plan_type, plan.amount, startDate, endDate, razorpay_payment_id, razorpay_order_id, razorpay_signature]
    );

    // Log gateway transaction
    await db.query(
      `INSERT INTO gateway_transactions (order_id, payment_id, amount, status, purpose, signature)
       VALUES ($1,$2,$3,'captured','subscription',$4)
       ON CONFLICT (order_id) DO UPDATE SET payment_id=$2, status='captured', signature=$4, updated_at=NOW()`,
      [razorpay_order_id, razorpay_payment_id, plan.amount, razorpay_signature]
    );

    res.json({ success: true, subscription: result.rows[0] });
  } catch (err) {
    console.error('Subscription activation error:', err);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
});

module.exports = router;
