const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Plan name is required',
    'string.empty': 'Plan name is required',
  }),
  price: Joi.number().greater(0).required().messages({
    'any.required': 'Price is required',
    'number.greater': 'Price must be greater than 0',
  }),
  billingPeriod: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly')
    .required()
    .messages({
      'any.required': 'Billing period is required',
      'any.only': 'Billing period must be one of: daily, weekly, monthly, yearly',
    }),
  minQuantity: Joi.number().integer().min(1).optional().default(1),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  autoClose: Joi.boolean().optional(),
  closable: Joi.boolean().optional(),
  pausable: Joi.boolean().optional(),
  renewable: Joi.boolean().optional(),
});

const updateSchema = Joi.object({
  name: Joi.string().optional(),
  price: Joi.number().greater(0).optional(),
  billingPeriod: Joi.string()
    .valid('daily', 'weekly', 'monthly', 'yearly')
    .optional(),
  minQuantity: Joi.number().integer().min(1).optional(),
  startDate: Joi.date().optional().allow(null),
  endDate: Joi.date().optional().allow(null),
  autoClose: Joi.boolean().optional(),
  closable: Joi.boolean().optional(),
  pausable: Joi.boolean().optional(),
  renewable: Joi.boolean().optional(),
});

module.exports = {
  createSchema,
  updateSchema,
};
