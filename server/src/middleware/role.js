/**
 * Authorization middleware factory.
 * Returns middleware that checks whether the authenticated user's role
 * is among the allowed roles.
 *
 * Usage: authorize('admin', 'manager')
 *
 * @param  {...string} roles - Allowed roles
 * @returns {Function} Express middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You do not have permission to perform this action' });
    }

    next();
  };
};

module.exports = authorize;
module.exports.authorize = authorize;
