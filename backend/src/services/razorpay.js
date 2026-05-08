/**
 * Razorpay integration using axios + Node built-in crypto.
 * No extra npm package needed.
 */
const crypto = require('crypto');
const axios = require('axios');

const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

const rzpAuth = () => ({ username: KEY_ID, password: KEY_SECRET });

/**
 * Create a Razorpay order.
 * @param {object} opts - { amount (INR), currency, receipt, notes }
 */
async function createOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error('Razorpay credentials not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET)');
  }
  const response = await axios.post(
    'https://api.razorpay.com/v1/orders',
    { amount: Math.round(amount * 100), currency, receipt, notes },
    { auth: rzpAuth() }
  );
  return response.data;
}

/**
 * Verify Razorpay payment signature.
 * Returns true if the signature is valid.
 */
function verifyPaymentSignature({ order_id, payment_id, signature }) {
  if (!KEY_SECRET) return false;
  const body = `${order_id}|${payment_id}`;
  const expected = crypto
    .createHmac('sha256', KEY_SECRET)
    .update(body)
    .digest('hex');
  return expected === signature;
}

/**
 * Fetch payment details from Razorpay.
 */
async function fetchPayment(paymentId) {
  const response = await axios.get(
    `https://api.razorpay.com/v1/payments/${paymentId}`,
    { auth: rzpAuth() }
  );
  return response.data;
}

module.exports = { createOrder, verifyPaymentSignature, fetchPayment };
