const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, paymentController.recordPayment);
router.get('/', authMiddleware, paymentController.getPayments);

module.exports = router;
