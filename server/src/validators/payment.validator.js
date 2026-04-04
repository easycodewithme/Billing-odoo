const Joi = require('joi');

const manualPaymentSchema = Joi.object({
  invoiceId: Joi.string().uuid().required().messages({
    'string.guid': 'Invoice ID must be a valid UUID',
    'any.required': 'Invoice ID is required',
  }),
  method: Joi.string()
    .valid('cash', 'bank_transfer', 'other')
    .required()
    .messages({
      'any.only': 'Payment method must be one of: cash, bank_transfer, other',
      'any.required': 'Payment method is required',
    }),
  amount: Joi.number().greater(0).required().messages({
    'number.base': 'Amount must be a number',
    'number.greater': 'Amount must be greater than 0',
    'any.required': 'Amount is required',
  }),
  reference: Joi.string().messages({
    'string.base': 'Reference must be a string',
  }),
  notes: Joi.string().allow('').messages({
    'string.base': 'Notes must be a string',
  }),
});

module.exports = {
  manualPaymentSchema,
};
