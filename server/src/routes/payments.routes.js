const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const paymentsController = require('../controllers/payments.controller');
const { manualPaymentSchema } = require('../validators/payment.validator');

const router = Router();

// GET / - list payments (auth required)
router.get('/', authenticate, paymentsController.getAll);

// GET /:id - get payment details (auth required)
router.get('/:id', authenticate, paymentsController.getById);

// POST /manual - record manual payment (admin, internal_user)
router.post(
  '/manual',
  authenticate,
  authorize('admin', 'internal_user'),
  validate(manualPaymentSchema),
  paymentsController.recordManual
);

// POST /checkout/:invoiceId - create Stripe checkout (auth required)
router.post('/checkout/:invoiceId', authenticate, paymentsController.createCheckout);

module.exports = router;
