const ApiError = require('../utils/ApiError');

const validate = (schema) => (req, res, next) => {
  try {
    const dataToValidate = {};
    if (schema.body) dataToValidate.body = req.body;
    if (schema.query) dataToValidate.query = req.query;
    if (schema.params) dataToValidate.params = req.params;

    // If schema is just a Zod schema for body
    if (schema._def) {
      req.body = schema.parse(req.body);
      return next();
    }

    if (schema.body) {
      req.body = schema.body.parse(req.body);
    }
    if (schema.query) {
      req.query = schema.query.parse(req.query);
    }
    if (schema.params) {
      req.params = schema.params.parse(req.params);
    }

    next();
  } catch (err) {
    if (err.errors) {
      const formattedErrors = err.errors.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));
      return next(new ApiError(400, formattedErrors[0]?.message || 'Validation Error', formattedErrors));
    }
    next(err);
  }
};

module.exports = validate;
