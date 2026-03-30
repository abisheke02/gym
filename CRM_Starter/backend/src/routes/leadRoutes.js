const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');
const { validateLead } = require('../middleware/validate');

const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, validateLead, leadController.createLead);
router.get('/', authMiddleware, leadController.getLeads);

module.exports = router;
