const { Router } = require('express');
const discountsController = require('../controllers/discounts.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validators/discount.validator');

const router = Router();

router.get('/', authenticate, authorize('admin', 'internal_user'), discountsController.getAll);
router.get('/:id', authenticate, authorize('admin', 'internal_user'), discountsController.getById);
router.post('/', authenticate, authorize('admin', 'internal_user'), validate(createSchema), discountsController.create);
router.put('/:id', authenticate, authorize('admin', 'internal_user'), validate(updateSchema), discountsController.update);
router.delete('/:id', authenticate, authorize('admin'), discountsController.remove);

// Product attachment routes
router.post('/:id/products', authenticate, authorize('admin', 'internal_user'), discountsController.attachProduct);
router.delete('/:id/products/:productId', authenticate, authorize('admin', 'internal_user'), discountsController.detachProduct);

// Subscription attachment routes
router.post('/:id/subscriptions', authenticate, authorize('admin', 'internal_user'), discountsController.attachSubscription);
router.delete('/:id/subscriptions/:subscriptionId', authenticate, authorize('admin', 'internal_user'), discountsController.detachSubscription);

module.exports = router;
