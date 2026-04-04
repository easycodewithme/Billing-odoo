const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config/env');

const SALT_ROUNDS = 10;

/**
 * Hash a plaintext password using bcrypt.
 * @param {string} password
 * @returns {Promise<string>} hashed password
 */
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
};

/**
 * Compare a plaintext password against a bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Generate a short-lived access token.
 * Payload contains id, email, and role.
 * @param {{ id: string, email: string, role: string }} user
 * @returns {string} signed JWT
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.JWT_SECRET,
    { expiresIn: config.JWT_ACCESS_EXPIRY }
  );
};

/**
 * Generate a long-lived refresh token.
 * Payload contains only the user id.
 * @param {{ id: string }} user
 * @returns {string} signed JWT
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user.id },
    config.JWT_REFRESH_SECRET,
    { expiresIn: config.JWT_REFRESH_EXPIRY }
  );
};

/**
 * Verify a JWT and return the decoded payload.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @param {string} secret
 * @returns {object} decoded payload
 */
const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};

module.exports = {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
};
