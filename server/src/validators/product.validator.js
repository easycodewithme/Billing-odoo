const Joi = require('joi');

const createSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Product name is required',
    'string.empty': 'Product name is required',
  }),
  productType: Joi.string().optional().allow('', null),
  salesPrice: Joi.number().min(0).required().messages({
    'any.required': 'Sales price is required',
    'number.min': 'Sales price must be 0 or greater',
  }),
  costPrice: Joi.number().min(0).optional().allow(null),
  description: Joi.string().optional().allow('', null),
});

const updateSchema = Joi.object({
  name: Joi.string().optional(),
  productType: Joi.string().optional().allow('', null),
  salesPrice: Joi.number().min(0).optional(),
  costPrice: Joi.number().min(0).optional().allow(null),
  description: Joi.string().optional().allow('', null),
});

const variantSchema = Joi.object({
  attribute: Joi.string().required().messages({
    'any.required': 'Variant attribute is required',
    'string.empty': 'Variant attribute is required',
  }),
  value: Joi.string().required().messages({
    'any.required': 'Variant value is required',
    'string.empty': 'Variant value is required',
  }),
  extraPrice: Joi.number().min(0).optional().default(0),
});

module.exports = {
  createSchema,
  updateSchema,
  variantSchema,
};
