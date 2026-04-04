const { Router } = require('express');
const taxesController = require('../controllers/taxes.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validators/tax.validator');

const router = Router();

router.get('/', authenticate, authorize('admin', 'internal_user'), taxesController.getAll);
router.post('/', authenticate, authorize('admin'), validate(createSchema), taxesController.create);
router.put('/:id', authenticate, authorize('admin', 'internal_user'), validate(updateSchema), taxesController.update);
router.delete('/:id', authenticate, authorize('admin'), taxesController.remove);

module.exports = router;
