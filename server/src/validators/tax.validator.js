const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Tax name is required',
    'string.empty': 'Tax name is required',
  }),
  rate: Joi.number().min(0).max(100).required().messages({
    'any.required': 'Tax rate is required',
    'number.min': 'Tax rate must be at least 0',
    'number.max': 'Tax rate cannot exceed 100',
  }),
  type: Joi.string().required().messages({
    'any.required': 'Tax type is required',
    'string.empty': 'Tax type is required',
  }),
  description: Joi.string().optional().allow('', null),
});

const updateSchema = Joi.object({
  name: Joi.string().optional(),
  rate: Joi.number().min(0).max(100).optional(),
  type: Joi.string().optional(),
  description: Joi.string().optional().allow('', null),
});

module.exports = {
  createSchema,
  updateSchema,
};
