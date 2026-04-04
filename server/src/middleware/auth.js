const prisma = require('../utils/prisma');
const authService = require('../services/auth.service');
const config = require('../config/env');

/**
 * Authentication middleware.
 * Extracts the accessToken from cookies, verifies it,
 * loads the user from the database, and attaches to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    let decoded;
    try {
      decoded = authService.verifyToken(token, config.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = authenticate;
module.exports.authenticate = authenticate;
