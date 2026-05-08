const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');
const config = require('../config');
const { authMiddleware, rbacMiddleware } = require('../middleware/auth');
const { validate, authSchemas } = require('../middleware/validation');

const sendResetEmail = async (email, resetUrl) => {
  if (!config.smtp.host || !config.smtp.user) {
    console.log(`[DEV] Password reset link for ${email}: ${resetUrl}`);
    return;
  }
  try {
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      auth: { user: config.smtp.user, pass: config.smtp.pass },
    });
    await transporter.sendMail({
      from: config.smtp.from,
      to: email,
      subject: 'IRONMAN FITNESS — Password Reset',
      html: `<p>Click the link below to reset your password. It expires in 1 hour.</p>
             <a href="${resetUrl}">${resetUrl}</a>
             <p>If you did not request this, ignore this email.</p>`,
    });
  } catch (err) {
    console.error('Failed to send reset email:', err.message);
  }
};

const router = express.Router();

// Login
router.post('/login', validate(authSchemas.login), async (req, res) => {
  try {
    let { email, password } = req.body;
    email = email.trim();

    const result = await db.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
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

    if (!password || !config.adminPassword) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    // Timing-safe comparison prevents timing attacks on env-var secrets
    let isValid = false;
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(password),
        Buffer.from(config.adminPassword)
      );
    } catch {
      // Buffers of different lengths — always invalid
      isValid = false;
    }

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid admin password' });
    }

    const token = jwt.sign(
      { role: 'admin' },
      config.jwt.secret,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { role: 'admin', full_name: 'Administrator' }
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
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
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
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1)',
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

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const result = await db.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND is_active = true',
      [email.trim()]
    );

    // Always respond success to prevent email enumeration
    res.json({ message: 'If this email is registered, a reset link has been sent.' });

    if (result.rows.length === 0) return;

    const userId = result.rows[0].id;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate previous tokens for this user
    await db.query(
      'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
      [userId]
    );

    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userId, token, expiresAt]
    );

    const resetUrl = `${config.frontendUrl}/reset-password?token=${token}`;
    await sendResetEmail(email.trim(), resetUrl);
  } catch (error) {
    console.error('Forgot password error:', error);
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const result = await db.query(
      `SELECT prt.user_id FROM password_reset_tokens prt
       WHERE prt.token = $1 AND prt.used = false AND prt.expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset link' });
    }

    const userId = result.rows[0].user_id;
    const passwordHash = await bcrypt.hash(password, 12);

    await db.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [passwordHash, userId]
    );

    await db.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    );

    res.json({ message: 'Password reset successfully. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
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

