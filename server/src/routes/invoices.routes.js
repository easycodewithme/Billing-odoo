const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const invoicesController = require('../controllers/invoices.controller');

const router = Router();

// GET / - list invoices (auth required)
router.get('/', authenticate, invoicesController.getAll);

// GET /:id - get invoice details (auth required)
router.get('/:id', authenticate, invoicesController.getById);

// POST /generate/:subscriptionId - generate invoice from subscription (admin, internal_user)
router.post(
  '/generate/:subscriptionId',
  authenticate,
  authorize('admin', 'internal_user'),
  invoicesController.generate
);

// PATCH /:id/confirm - confirm a draft invoice (admin, internal_user)
router.patch(
  '/:id/confirm',
  authenticate,
  authorize('admin', 'internal_user'),
  invoicesController.confirm
);

// PATCH /:id/cancel - cancel an invoice (admin only)
router.patch(
  '/:id/cancel',
  authenticate,
  authorize('admin'),
  invoicesController.cancel
);

// POST /:id/send - send an invoice (admin, internal_user)
router.post(
  '/:id/send',
  authenticate,
  authorize('admin', 'internal_user'),
  invoicesController.sendInvoice
);

// GET /:id/pdf - download invoice PDF (auth required)
router.get('/:id/pdf', authenticate, invoicesController.downloadPDF);

module.exports = router;
