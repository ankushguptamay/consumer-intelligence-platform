'use strict';

const authService = require('../services/auth.service');
const { sendResponse } = require('../utils/apiResponse');

// Pull request metadata for audit logging. Truncate user-agent to fit column.
const requestMeta = (req) => ({
  ip: req.ip,
  userAgent: (req.headers['user-agent'] || '').slice(0, 255),
});

const login = async (req, res, next) => {
  try {
    const result = await authService.login(req.body, requestMeta(req));
    return sendResponse(res, 200, result, 'Login successful');
  } catch (err) {
    return next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const result = await authService.logout(req.admin.id, req.body, requestMeta(req));
    return sendResponse(res, 200, result, 'Logout successful');
  } catch (err) {
    return next(err);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const result = await authService.changePassword(req.admin.id, req.body);
    return sendResponse(res, 200, result, 'Password changed. Please log in again.');
  } catch (err) {
    return next(err);
  }
};

module.exports = { login, logout, changePassword };
