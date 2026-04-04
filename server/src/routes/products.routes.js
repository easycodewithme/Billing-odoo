const { Router } = require('express');
const productsController = require('../controllers/products.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const {
  createSchema,
  updateSchema,
  variantSchema,
} = require('../validators/product.validator');

const router = Router();

router.get('/', authenticate, productsController.getAll);
router.get('/:id', authenticate, productsController.getById);
router.post('/', authenticate, authorize('admin', 'internal_user'), validate(createSchema), productsController.create);
router.put('/:id', authenticate, authorize('admin', 'internal_user'), validate(updateSchema), productsController.update);
router.delete('/:id', authenticate, authorize('admin'), productsController.remove);

// Variant routes
router.post('/:id/variants', authenticate, authorize('admin', 'internal_user'), validate(variantSchema), productsController.addVariant);
router.put('/:id/variants/:variantId', authenticate, authorize('admin', 'internal_user'), validate(variantSchema), productsController.updateVariant);
router.delete('/:id/variants/:variantId', authenticate, authorize('admin', 'internal_user'), productsController.removeVariant);

module.exports = router;
