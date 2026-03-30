const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const config = require('../config');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');

const router = express.Router();

// Login
router.post('/login', validate(authSchemas.login), async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await db.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    // Get branch info if user has one
    let branch = null;
    if (user.branch_id) {
      const branchResult = await db.query(
        'SELECT id, name, address, phone FROM branches WHERE id = $1',
        [user.branch_id]
      );
      branch = branchResult.rows[0];
    }

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        branch_id: user.branch_id,
        branch
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Admin Login
router.post('/admin-login', async (req, res) => {
  try {
    const { password } = req.body;

    if (password !== config.adminPassword) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    // Generate JWT for admin
    const token = jwt.sign(
      { role: 'admin' },
      config.jwt.secret,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        role: 'admin',
        full_name: 'Administrator'
      }
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Admin login failed' });
  }
});

// Register new user (Owner only)
router.post('/register', authMiddleware, rbacMiddleware('owner'), validate(authSchemas.register), async (req, res) => {
  try {
    const { email, password, full_name, phone, role, branch_id } = req.body;

    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Insert user
    const result = await db.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role, branch_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, email, full_name, phone, role, branch_id, created_at
    `, [email, passwordHash, full_name, phone, role || 'sales', branch_id]);

    res.status(201).json({
      message: 'User registered successfully',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Public Sign Up 
router.post('/signup', validate(authSchemas.register), async (req, res) => {
  try {
    const { email, password, full_name, phone, role } = req.body;

    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Give them "manager" access by default if they sign up via the public page,
    // or respect the requested role if valid.
    const assignedRole = role || 'manager';

    const result = await db.query(`
      INSERT INTO users (email, password_hash, full_name, phone, role)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, full_name, role
    `, [email, passwordHash, full_name, phone, assignedRole]);

    res.status(201).json({
      message: 'Account created successfully! You can now sign in.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Sign up failed' });
  }
});

// Get current user
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.full_name, u.phone, u.role, u.branch_id, u.created_at,
        b.name as branch_name
      FROM users u
      LEFT JOIN branches b ON u.branch_id = b.id
      WHERE u.id = $1
    `, [req.user.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Change password
router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const result = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [req.user.id]
    );

    const isValid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!isValid) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 12);
    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [newHash, req.user.id]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Admin Sync (Simulated or triggered)
router.post('/admin/sync', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    // In a real scenario, this would trigger a Sanity webhook or content fetch
    console.log('Admin triggered sync at', new Date().toISOString());
    res.json({ message: 'Sync started successfully', timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

// Get users for Admin Panel
router.get('/admin/users', authMiddleware, rbacMiddleware('owner'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT u.id, u.email, u.full_name, u.role, u.is_active, u.created_at, b.name as branch_name 
      FROM users u 
      LEFT JOIN branches b ON u.branch_id = b.id
      ORDER BY u.created_at DESC
    `);
    res.json({ users: result.rows });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

module.exports = router;

