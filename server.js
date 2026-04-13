require('dotenv').config();
const express  = require('express');
const mongoose = require('mongoose');
const cors     = require('cors');

// ── Route imports ─────────────────────────────────────────────────────────────
const authRoutes        = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const rewardsRoutes     = require('./routes/rewards');
const insightsRoutes    = require('./routes/insights');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());                          // allow requests from the frontend
app.use(express.json());                  // parse JSON bodies
app.use(express.urlencoded({ extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/rewards',      rewardsRoutes);
app.use('/api/insights',     insightsRoutes);

// ── Health-check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    app:     'Datrix API',
    version: '1.0.0',
    status:  'running',
    endpoints: [
      'POST /api/auth/register',
      'POST /api/transactions/add',
      'GET  /api/transactions?userId=<id>',
      'GET  /api/rewards?userId=<id>',
      'POST /api/insights',
    ],
  });
});

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found.` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong on the server.' });
});

// ── Connect to MongoDB then start server ──────────────────────────────────────
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Datrix API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
