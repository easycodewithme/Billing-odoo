const { Router } = require('express');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const subscriptionsController = require('../controllers/subscriptions.controller');
const {
  createSchema,
  updateSchema,
  statusSchema,
  orderLineSchema,
} = require('../validators/subscription.validator');

const router = Router();

// GET / - list subscriptions (auth required)
router.get('/', authenticate, subscriptionsController.getAll);

// GET /:id - get subscription details (auth required)
router.get('/:id', authenticate, subscriptionsController.getById);

// POST / - create subscription (admin, internal_user)
router.post(
  '/',
  authenticate,
  authorize('admin', 'internal_user'),
  validate(createSchema),
  subscriptionsController.create
);

// PUT /:id - update subscription (admin, internal_user)
router.put(
  '/:id',
  authenticate,
  authorize('admin', 'internal_user'),
  validate(updateSchema),
  subscriptionsController.update
);

// PATCH /:id/status - change subscription status (admin, internal_user)
router.patch(
  '/:id/status',
  authenticate,
  authorize('admin', 'internal_user'),
  validate(statusSchema),
  subscriptionsController.updateStatus
);

// POST /:id/apply-template - apply template to subscription (admin, internal_user)
router.post(
  '/:id/apply-template',
  authenticate,
  authorize('admin', 'internal_user'),
  subscriptionsController.applyTemplate
);

// POST /:id/order-lines - add order line (admin, internal_user)
router.post(
  '/:id/order-lines',
  authenticate,
  authorize('admin', 'internal_user'),
  validate(orderLineSchema),
  subscriptionsController.addOrderLine
);

// PUT /:id/order-lines/:lineId - update order line (admin, internal_user)
router.put(
  '/:id/order-lines/:lineId',
  authenticate,
  authorize('admin', 'internal_user'),
  validate(orderLineSchema),
  subscriptionsController.updateOrderLine
);

// DELETE /:id/order-lines/:lineId - remove order line (admin, internal_user)
router.delete(
  '/:id/order-lines/:lineId',
  authenticate,
  authorize('admin', 'internal_user'),
  subscriptionsController.removeOrderLine
);

// POST /:id/renew - renew a closed subscription (all authenticated users, ownership checked in controller)
router.post('/:id/renew', authenticate, subscriptionsController.renew);

// POST /:id/upsell - create upsell subscription (admin, internal_user)
router.post('/:id/upsell', authenticate, authorize('admin', 'internal_user'), subscriptionsController.upsell);

// POST /:id/portal-action - portal user close/pause/resume own subscription
router.post('/:id/portal-action', authenticate, subscriptionsController.portalAction);

module.exports = router;
