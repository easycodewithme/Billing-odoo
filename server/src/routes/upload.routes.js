const { Router } = require('express');
const uploadController = require('../controllers/upload.controller');
const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/role');
const { uploadSingle } = require('../middleware/upload');

const router = Router();

router.post('/:category', authenticate, authorize('admin', 'internal_user'), uploadSingle('file'), uploadController.upload);
router.delete('/:category/:filename', authenticate, authorize('admin'), uploadController.remove);

module.exports = router;
