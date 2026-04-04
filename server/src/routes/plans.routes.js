const { Router } = require('express');
const plansController = require('../controllers/plans.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validators/plan.validator');

const router = Router();

router.get('/', authenticate, plansController.getAll);
router.get('/:id', authenticate, plansController.getById);
router.post('/', authenticate, authorize('admin', 'internal_user'), validate(createSchema), plansController.create);
router.put('/:id', authenticate, authorize('admin', 'internal_user'), validate(updateSchema), plansController.update);
router.delete('/:id', authenticate, authorize('admin'), plansController.remove);

module.exports = router;
