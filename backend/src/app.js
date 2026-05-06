require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// CORS: supports local dev + deployed Vercel origin(s).
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true); // non-browser / same-origin

      const isExplicitlyAllowed = allowedOrigins.includes(origin);
      const isVercelApp = /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
      const isLocalDev = /^http:\/\/localhost:(5173|3000)$/i.test(origin);

      if (isExplicitlyAllowed || isVercelApp || isLocalDev) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`
🚀 Event Ticketing API running on port ${PORT}
📡 Health: /health
🌍 Env: ${process.env.NODE_ENV || 'development'}
  `);
});

module.exports = app;
