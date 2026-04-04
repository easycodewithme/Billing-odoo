const { Router } = require('express');
const usersController = require('../controllers/users.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { validate } = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validators/user.validator');

const router = Router();

router.get('/', authenticate, authorize('admin', 'internal_user'), usersController.getAll);
router.get('/:id', authenticate, authorize('admin', 'internal_user'), usersController.getById);
router.post('/', authenticate, authorize('admin'), validate(createSchema), usersController.create);
router.put('/:id', authenticate, validate(updateSchema), usersController.update);
router.patch('/:id/deactivate', authenticate, authorize('admin'), usersController.deactivate);
router.patch('/:id/activate', authenticate, authorize('admin'), usersController.activate);

module.exports = router;
