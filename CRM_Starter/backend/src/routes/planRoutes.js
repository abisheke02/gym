const express = require('express');
const router = express.Router();
const planController = require('../controllers/planController');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, rbacMiddleware('owner', 'manager'), planController.createPlan);
router.get('/', authMiddleware, planController.getPlans);

module.exports = router;
