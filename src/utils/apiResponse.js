'use strict';

class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.details = details;
  }
}

const sendResponse = (res, statusCode, data, message = 'Success', meta) => {
  const body = { success: statusCode < 400, message, data };
  if (meta) body.meta = meta;
  return res.status(statusCode).json(body);
};

module.exports = { AppError, sendResponse };
