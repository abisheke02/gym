const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const scheduler = require('./services/scheduler');

// Import routes
const authRoutes = require('./routes/auth');
const branchRoutes = require('./routes/branches');
const leadRoutes = require('./routes/leads');
const memberRoutes = require('./routes/members');
const planRoutes = require('./routes/plans');
const trainerRoutes = require('./routes/trainers');
const financeRoutes = require('./routes/finance');
const webhookRoutes = require('./routes/webhooks');
const subscriptionRoutes = require('./routes/subscriptions');
const gatewayRoutes = require('./routes/gateway');
const attendanceRoutes = require('./routes/attendance');
const messagingRoutes = require('./routes/messaging');

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [config.frontendUrl, 'http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { error: 'Too many requests, please try again later' }
});

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10, // 10 requests per minute for auth
  message: { error: 'Too many auth attempts, please try again later' }
});

app.use('/api/', limiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api', financeRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/gateway', gatewayRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messaging', messagingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server only when run directly (not when imported by tests)
if (require.main === module) {
  const PORT = config.port;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔═══════════════════════════════════════════════════╗
║                                                   ║
║   IRONMAN FITNESS Gym CRM Server                  ║
║   Running on port ${PORT}                          ║
║   Environment: ${config.nodeEnv}                      ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
    `);
    try {
      scheduler.init();
    } catch (err) {
      console.error('⚠️ Scheduler failed to initialize:', err.message);
    }
  });
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  scheduler.stop();
  process.exit(0);
});

module.exports = app;
