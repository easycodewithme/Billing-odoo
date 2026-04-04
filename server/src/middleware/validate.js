/**
 * Validation middleware factory.
 * Returns middleware that validates req.body against the provided Joi schema.
 *
 * Usage: validate(loginSchema)
 *
 * @param {import('joi').ObjectSchema} schema - Joi validation schema
 * @returns {Function} Express middleware
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, ''),
      }));

      return res.status(400).json({
        message: 'Validation failed',
        errors,
      });
    }

    next();
  };
};

module.exports = validate;
module.exports.validate = validate;
