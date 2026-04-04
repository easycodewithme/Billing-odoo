const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} = require('../validators/auth.validator');

const router = Router();

router.post('/signup', validate(signupSchema), authController.signup);
router.post('/login', validate(loginSchema), authController.login);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.get('/me', authenticate, authController.me);

module.exports = router;
