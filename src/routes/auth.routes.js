'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const auth = require('../controllers/auth.controller');
const { authenticate } = require('../middlewares/auth.middleware');
const { validate } = require('../middlewares/validate.middleware');
const schemas = require('../validators/schemas');

const router = express.Router();

const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many auth requests, please try again later' },
});

// Public
router.post('/login', authLimiter, validate(schemas.login), auth.login);

// Authenticated
router.post('/logout', authenticate, validate(schemas.logout), auth.logout);
router.post(
  '/change-password',
  authenticate,
  validate(schemas.changePassword),
  auth.changePassword
);

module.exports = router;
