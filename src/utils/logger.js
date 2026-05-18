'use strict';

const winston = require('winston');
const config = require('../config');

const logger = winston.createLogger({
  level: config.logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    config.env === 'production'
      ? winston.format.json()
      : winston.format.printf(({ timestamp, level, message, stack }) => {
          return `${timestamp} [${level.toUpperCase()}] ${stack || message}`;
        })
  ),
  transports: [new winston.transports.Console()],
});

module.exports = logger;
