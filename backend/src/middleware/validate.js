const { sendError } = require('../utils/response');

/**
 * Middleware factory: Validates req.body against a Zod schema.
 * @param {ZodSchema} schema - Zod schema to validate against
 */
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    const errors = result.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return sendError(res, 422, 'Validation failed.', errors);
  }

  // Replace req.body with the parsed (sanitised) data
  req.body = result.data;
  next();
};

module.exports = validate;
