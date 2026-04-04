/**
 * Standardized API response helpers.
 */

/**
 * Send a success response.
 * @param {object} res - Express response object
 * @param {*} data - Response data
 * @param {string} message - Success message
 * @param {number} statusCode - HTTP status code (default 200)
 */
const success = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send an error response.
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code (default 500)
 * @param {Array|null} errors - Detailed validation errors
 */
const error = (res, message = 'Internal server error', statusCode = 500, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send a paginated response.
 * @param {object} res - Express response object
 * @param {Array} data - Array of records
 * @param {number} total - Total count of records
 * @param {number} page - Current page number
 * @param {number} limit - Records per page
 */
const paginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  });
};

module.exports = {
  success,
  error,
  paginated,
};
