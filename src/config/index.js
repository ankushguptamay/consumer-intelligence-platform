'use strict';

require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  apiPrefix: process.env.API_PREFIX || '/api/v1',

  // Database
  dbHost: process.env.DB_HOST || '127.0.0.1',
  dbPort: parseInt(process.env.DB_PORT, 10) || 3306,
  dbUser: process.env.DB_USERNAME || 'root',
  dbPassword: process.env.DB_PASSWORD || '',
  dbName: process.env.DB_NAME || 'consumer_intelligence',
  dbDialect: process.env.DB_DIALECT || 'mysql',

  // JWT (access token only; refresh tokens are crypto-random, not JWTs)
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // Security
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12,
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10) || 10,

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || '*',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Business rules
  dormantDaysThreshold: parseInt(process.env.DORMANT_DAYS_THRESHOLD, 10) || 60,
  highValueSpendThreshold: parseInt(process.env.HIGH_VALUE_SPEND_THRESHOLD, 10) || 50000,
  crossBrandMinBrands: parseInt(process.env.CROSS_BRAND_MIN_BRANDS, 10) || 2,
};
