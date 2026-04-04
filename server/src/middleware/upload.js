const { createUpload } = require('../config/multer');

/**
 * Middleware factory that handles a single file upload.
 * Reads the category from req.params.category to configure the storage destination.
 *
 * @param {string} fieldName - The form field name for the file
 * @returns {Function} Express middleware
 */
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const category = req.params.category || 'general';
    const multerInstance = createUpload(category);
    const handler = multerInstance.single(fieldName);

    handler(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload failed',
        });
      }
      next();
    });
  };
};

module.exports = { uploadSingle };
