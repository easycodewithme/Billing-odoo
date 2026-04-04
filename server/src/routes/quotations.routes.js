const { Router } = require('express');
const quotationsController = require('../controllers/quotations.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = Router();

router.get('/', authenticate, authorize('admin', 'internal_user'), quotationsController.getAll);
router.get('/:id', authenticate, authorize('admin', 'internal_user'), quotationsController.getById);
router.post('/', authenticate, authorize('admin', 'internal_user'), quotationsController.create);
router.put('/:id', authenticate, authorize('admin', 'internal_user'), quotationsController.update);
router.delete('/:id', authenticate, authorize('admin'), quotationsController.remove);

module.exports = router;
