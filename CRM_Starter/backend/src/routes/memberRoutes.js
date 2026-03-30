const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { authMiddleware } = require('../middleware/auth');

router.post('/', authMiddleware, memberController.createMember);
router.get('/', authMiddleware, memberController.getMembers);

module.exports = router;
