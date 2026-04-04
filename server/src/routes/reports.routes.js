const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const reportsController = require('../controllers/reports.controller');

const router = Router();

// GET /dashboard-stats - key metrics (admin, internal_user)
router.get(
  '/dashboard-stats',
  authenticate,
  authorize('admin', 'internal_user'),
  reportsController.dashboardStats
);

// GET /revenue - monthly revenue for last 12 months (admin, internal_user)
router.get(
  '/revenue',
  authenticate,
  authorize('admin', 'internal_user'),
  reportsController.revenueReport
);

// GET /subscriptions - subscription stats and trends (admin, internal_user)
router.get(
  '/subscriptions',
  authenticate,
  authorize('admin', 'internal_user'),
  reportsController.subscriptionReport
);

// GET /payments - payment totals and method breakdown (admin, internal_user)
router.get(
  '/payments',
  authenticate,
  authorize('admin', 'internal_user'),
  reportsController.paymentReport
);

// GET /overdue-invoices - list overdue invoices (admin, internal_user)
router.get(
  '/overdue-invoices',
  authenticate,
  authorize('admin', 'internal_user'),
  reportsController.overdueInvoices
);

module.exports = router;
