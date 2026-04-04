const fs = require('fs');
const path = require('path');
const { success, error } = require('../utils/apiResponse');
const { UPLOAD_DIR } = require('../config/multer');

/**
 * POST /upload/:category
 * Handle single file upload. Returns the file path.
 */
const upload = async (req, res) => {
  try {
    if (!req.file) {
      return error(res, 'No file uploaded', 400);
    }

    const { category } = req.params;
    const filePath = `/uploads/${category}/${req.file.filename}`;

    return success(
      res,
      {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: filePath,
      },
      'File uploaded successfully',
      201
    );
  } catch (err) {
    console.error('Upload error:', err);
    return error(res, 'Failed to upload file');
  }
};

/**
 * DELETE /upload/:category/:filename
 * Delete a file from disk.
 */
const remove = async (req, res) => {
  try {
    const { category, filename } = req.params;
    const filePath = path.join(UPLOAD_DIR, category, filename);

    if (!fs.existsSync(filePath)) {
      return error(res, 'File not found', 404);
    }

    fs.unlinkSync(filePath);

    return success(res, null, 'File deleted successfully');
  } catch (err) {
    console.error('Delete file error:', err);
    return error(res, 'Failed to delete file');
  }
};

module.exports = {
  upload,
  remove,
};
