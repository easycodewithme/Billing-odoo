const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Discount name is required',
    'string.empty': 'Discount name is required',
  }),
  type: Joi.string().valid('fixed', 'percentage').required().messages({
    'any.required': 'Discount type is required',
    'any.only': 'Discount type must be either fixed or percentage',
  }),
  value: Joi.number().greater(0).required().messages({
    'any.required': 'Discount value is required',
    'number.greater': 'Discount value must be greater than 0',
  }),
  minPurchase: Joi.number().min(0).optional().default(0),
  minQuantity: Joi.number().integer().min(0).optional().default(0),
  startDate: Joi.date().required().messages({
    'any.required': 'Start date is required',
  }),
  endDate: Joi.date().required().messages({
    'any.required': 'End date is required',
  }),
  limitUsage: Joi.number().integer().optional().allow(null),
});

const updateSchema = Joi.object({
  name: Joi.string().optional(),
  type: Joi.string().valid('fixed', 'percentage').optional(),
  value: Joi.number().greater(0).optional(),
  minPurchase: Joi.number().min(0).optional(),
  minQuantity: Joi.number().integer().min(0).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  limitUsage: Joi.number().integer().optional().allow(null),
});

module.exports = {
  createSchema,
  updateSchema,
};
