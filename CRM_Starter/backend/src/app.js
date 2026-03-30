const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/leads', require('./routes/leadRoutes'));
app.use('/api/members', require('./routes/memberRoutes'));
app.use('/api/plans', require('./routes/planRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.get('/health', (req, res) => res.json({ status: 'UP' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;
