const Joi = require('joi');

const generateSchema = Joi.object({
  subscriptionId: Joi.string().uuid().required().messages({
    'string.guid': 'Subscription ID must be a valid UUID',
    'any.required': 'Subscription ID is required',
  }),
});

module.exports = {
  generateSchema,
};
