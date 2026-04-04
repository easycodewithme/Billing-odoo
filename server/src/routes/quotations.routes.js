const { Router } = require('express');
const quotationsController = require('../controllers/quotations.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');

const router = Router();

router.get('/quotation-templates', authenticate, authorize('admin', 'internal_user'), quotationsController.getAll);
router.get('/quotation-templates/:id', authenticate, authorize('admin', 'internal_user'), quotationsController.getById);
router.post('/quotation-templates', authenticate, authorize('admin', 'internal_user'), quotationsController.create);
router.put('/quotation-templates/:id', authenticate, authorize('admin', 'internal_user'), quotationsController.update);
router.delete('/quotation-templates/:id', authenticate, authorize('admin'), quotationsController.remove);

module.exports = router;
