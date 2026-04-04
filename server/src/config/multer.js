const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Build a multer storage engine for the given category sub-folder.
 */
const createStorage = (category) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_DIR, category);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      const uniqueName = `${crypto.randomUUID()}${ext}`;
      cb(null, uniqueName);
    },
  });
};

/**
 * File filter to accept common image and document types.
 */
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('File type not allowed'), false);
  }
};

/**
 * Create a multer instance for a specific upload category.
 * @param {string} category - Subfolder name (e.g. 'avatars', 'documents')
 * @returns {multer.Multer}
 */
const createUpload = (category) => {
  return multer({
    storage: createStorage(category),
    fileFilter,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
    },
  });
};

module.exports = { createUpload, UPLOAD_DIR };
