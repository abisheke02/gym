const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // Get user from database
    const result = await db.query(
      'SELECT id, email, full_name, role, branch_id, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({ error: 'User account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

// Role-based access control
const rbacMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Access denied. Insufficient permissions.',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Branch access control (managers can only see their branch)
const branchAccessMiddleware = async (req, res, next) => {
  try {
    const { branchId } = req.params;
    
    // Owner can access all branches
    if (req.user.role === 'owner') {
      return next();
    }

    // Managers can only access their branch
    if (req.user.role === 'manager' && branchId) {
      if (req.user.branch_id !== branchId) {
        return res.status(403).json({ error: 'Access denied to this branch' });
      }
    }

    // Sales and accountant can only access their branch data
    if (['sales', 'accountant', 'receptionist'].includes(req.user.role)) {
      req.branchFilter = req.user.branch_id;
    }

    next();
  } catch (error) {
    console.error('Branch access middleware error:', error);
    return res.status(500).json({ error: 'Access control error' });
  }
};

module.exports = {
  authMiddleware,
  rbacMiddleware,
  branchAccessMiddleware
};

