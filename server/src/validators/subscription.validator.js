const Joi = require('joi');

const createSchema = Joi.object({
  customerId: Joi.string().uuid().required().messages({
    'string.guid': 'Customer ID must be a valid UUID',
    'any.required': 'Customer ID is required',
  }),
  planId: Joi.string().uuid().required().messages({
    'string.guid': 'Plan ID must be a valid UUID',
    'any.required': 'Plan ID is required',
  }),
  startDate: Joi.date().messages({
    'date.base': 'Start date must be a valid date',
  }),
  expirationDate: Joi.date().messages({
    'date.base': 'Expiration date must be a valid date',
  }),
  paymentTerms: Joi.string().messages({
    'string.base': 'Payment terms must be a string',
  }),
  notes: Joi.string().allow('').messages({
    'string.base': 'Notes must be a string',
  }),
});

const updateSchema = Joi.object({
  planId: Joi.string().uuid().messages({
    'string.guid': 'Plan ID must be a valid UUID',
  }),
  startDate: Joi.date().messages({
    'date.base': 'Start date must be a valid date',
  }),
  expirationDate: Joi.date().messages({
    'date.base': 'Expiration date must be a valid date',
  }),
  paymentTerms: Joi.string().messages({
    'string.base': 'Payment terms must be a string',
  }),
  notes: Joi.string().allow('').messages({
    'string.base': 'Notes must be a string',
  }),
});

const statusSchema = Joi.object({
  status: Joi.string()
    .valid('draft', 'quotation', 'confirmed', 'active', 'paused', 'closed')
    .required()
    .messages({
      'any.only': 'Status must be one of: draft, quotation, confirmed, active, paused, closed',
      'any.required': 'Status is required',
    }),
  reason: Joi.string().allow('').messages({
    'string.base': 'Reason must be a string',
  }),
});

const orderLineSchema = Joi.object({
  productId: Joi.string().uuid().required().messages({
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required',
  }),
  variantId: Joi.string().uuid().optional().messages({
    'string.guid': 'Variant ID must be a valid UUID',
  }),
  quantity: Joi.number().integer().min(1).required().messages({
    'number.base': 'Quantity must be a number',
    'number.integer': 'Quantity must be an integer',
    'number.min': 'Quantity must be at least 1',
    'any.required': 'Quantity is required',
  }),
  unitPrice: Joi.number().min(0).required().messages({
    'number.base': 'Unit price must be a number',
    'number.min': 'Unit price must be at least 0',
    'any.required': 'Unit price is required',
  }),
  taxId: Joi.string().uuid().optional().messages({
    'string.guid': 'Tax ID must be a valid UUID',
  }),
  discountId: Joi.string().uuid().optional().messages({
    'string.guid': 'Discount ID must be a valid UUID',
  }),
});

module.exports = {
  createSchema,
  updateSchema,
  statusSchema,
  orderLineSchema,
};
