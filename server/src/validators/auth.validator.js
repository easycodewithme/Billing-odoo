const Joi = require('joi');

// Password must be longer than 8 characters and contain at least one uppercase,
// one lowercase, and one special character.
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;
const passwordMessage =
  'Password must be longer than 8 characters and contain uppercase, lowercase, and special character';

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Password is required',
  }),
});

const signupSchema = Joi.object({
  fullName: Joi.string().min(2).required().messages({
    'string.min': 'Full name must be at least 2 characters',
    'any.required': 'Full name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(9).pattern(passwordRegex).required().messages({
    'string.min': 'Password must be longer than 8 characters',
    'string.pattern.base': passwordMessage,
    'any.required': 'Password is required',
  }),
  phone: Joi.string().optional().allow('', null),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'any.required': 'Reset token is required',
  }),
  newPassword: Joi.string().min(9).pattern(passwordRegex).required().messages({
    'string.min': 'Password must be longer than 8 characters',
    'string.pattern.base': passwordMessage,
    'any.required': 'New password is required',
  }),
});

module.exports = {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
};
