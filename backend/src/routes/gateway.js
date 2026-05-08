/**
 * Payment Gateway routes — generic Razorpay orders for member payments, renewals, etc.
 */
const express = require('express');
const router = express.Router();
const db = require('../db');
const { authMiddleware: authenticate } = require('../middleware/auth');
const razorpay = require('../services/razorpay');

// POST /api/gateway/create-order
router.post('/create-order', authenticate, async (req, res) => {
  const { amount, purpose = 'payment', reference_id, notes = {} } = req.body;
  if (!amount || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    const order = await razorpay.createOrder({
      amount: parseFloat(amount),
      currency: 'INR',
      receipt: `pay_${Date.now()}`,
      notes: { purpose, reference_id: reference_id || '', ...notes },
    });

    await db.query(
      `INSERT INTO gateway_transactions (order_id, amount, purpose, reference_id, status)
       VALUES ($1,$2,$3,$4,'created')
       ON CONFLICT (order_id) DO NOTHING`,
      [order.id, parseFloat(amount), purpose, reference_id || null]
    );

    res.json({ order, key_id: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error('Gateway create-order error:', err.message);
    res.status(500).json({ error: err.message || 'Failed to create order' });
  }
});

// POST /api/gateway/verify
router.post('/verify', authenticate, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing payment fields' });
  }

  const isValid = razorpay.verifyPaymentSignature({
    order_id: razorpay_order_id,
    payment_id: razorpay_payment_id,
    signature: razorpay_signature,
  });
  if (!isValid) return res.status(400).json({ error: 'Payment verification failed' });

  try {
    await db.query(
      `UPDATE gateway_transactions
       SET status='captured', payment_id=$1, signature=$2, updated_at=NOW()
       WHERE order_id=$3`,
      [razorpay_payment_id, razorpay_signature, razorpay_order_id]
    );
    res.json({ success: true, payment_id: razorpay_payment_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

// GET /api/gateway/transactions
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const { limit = 50, purpose } = req.query;
    const conditions = purpose ? `WHERE purpose = $2` : '';
    const params = purpose ? [parseInt(limit), purpose] : [parseInt(limit)];
    const result = await db.query(
      `SELECT * FROM gateway_transactions ${conditions} ORDER BY created_at DESC LIMIT $1`,
      params
    );
    res.json({ transactions: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router;
