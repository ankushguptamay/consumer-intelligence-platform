'use strict';

const { ValidationError, UniqueConstraintError, ForeignKeyConstraintError, DatabaseError } = require('sequelize');
const config = require('../config');
const logger = require('../utils/logger');
const { AppError } = require('../utils/apiResponse');

const notFoundHandler = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let details = err.details || undefined;

  if (err instanceof UniqueConstraintError) {
    statusCode = 409;
    message = 'Resource already exists with one of the unique fields';
    details = err.errors?.map((e) => ({ field: e.path, value: e.value }));
  } else if (err instanceof ForeignKeyConstraintError) {
    statusCode = 400;
    message = 'Invalid reference: related record does not exist';
  } else if (err instanceof ValidationError) {
    statusCode = 400;
    message = 'Validation failed';
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err instanceof DatabaseError && statusCode === 500) {
    // Avoid leaking SQL details in production
    message = 'Database error';
  }

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(`[${statusCode}] ${message}`);
  }

  const body = { success: false, message };
  if (details) body.details = details;
  if (config.env !== 'production' && err.stack && statusCode >= 500) {
    body.stack = err.stack;
  }
  res.status(statusCode).json(body);
};

module.exports = { errorHandler, notFoundHandler };
