const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const path = require('path');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security & logging
app.use(helmet());

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later' },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { success: false, message: 'Too many login attempts, please try again later' },
});

app.use('/api', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

app.use(morgan('dev'));
app.use(cookieParser());

// CORS
app.use(cors({
  origin: config.CLIENT_URL,
  credentials: true,
}));

// Stripe webhook route needs raw body - must be before express.json()
app.use('/api/webhooks/stripe', express.raw({ type: 'application/json' }));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Routes
const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products.routes');
const planRoutes = require('./routes/plans.routes');
const subscriptionRoutes = require('./routes/subscriptions.routes');
const invoiceRoutes = require('./routes/invoices.routes');
const paymentRoutes = require('./routes/payments.routes');
const discountRoutes = require('./routes/discounts.routes');
const taxRoutes = require('./routes/taxes.routes');
const userRoutes = require('./routes/users.routes');
const reportRoutes = require('./routes/reports.routes');
const uploadRoutes = require('./routes/upload.routes');
const webhookRoutes = require('./routes/webhook.routes');
const quotationRoutes = require('./routes/quotations.routes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/taxes', taxRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/quotation-templates', quotationRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
