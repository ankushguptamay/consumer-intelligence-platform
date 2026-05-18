'use strict';

const { AppError } = require('../utils/apiResponse');

const validate = (schema, source = 'body') => (req, res, next) => {
  const data = req[source];
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const details = error.details.map((d) => ({
      message: d.message,
      path: d.path.join('.'),
    }));
    return next(new AppError('Validation failed', 400, details));
  }
  req[source] = value;
  return next();
};

module.exports = { validate };
