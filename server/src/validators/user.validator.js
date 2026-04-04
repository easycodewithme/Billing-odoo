const Joi = require('joi');

const createSchema = Joi.object({
  fullName: Joi.string().min(2).required().messages({
    'any.required': 'Full name is required',
    'string.min': 'Full name must be at least 2 characters',
    'string.empty': 'Full name is required',
  }),
  email: Joi.string().email().required().messages({
    'any.required': 'Email is required',
    'string.email': 'Please provide a valid email address',
  }),
  password: Joi.string().min(8).required().messages({
    'any.required': 'Password is required',
    'string.min': 'Password must be at least 8 characters',
  }),
  role: Joi.string().valid('internal_user').optional().default('internal_user').messages({
    'any.only': 'Role must be internal_user',
  }),
  phone: Joi.string().optional().allow('', null),
});

const updateSchema = Joi.object({
  fullName: Joi.string().min(2).optional(),
  phone: Joi.string().optional().allow('', null),
  avatar: Joi.string().optional().allow('', null),
});

module.exports = {
  createSchema,
  updateSchema,
};
