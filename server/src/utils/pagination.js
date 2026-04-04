/**
 * Extract pagination parameters from query string.
 *
 * @param {object} query - Express req.query
 * @returns {{ skip: number, take: number, page: number, limit: number }}
 */
const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

module.exports = { getPagination };
