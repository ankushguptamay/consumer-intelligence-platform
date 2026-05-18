'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const config = require('./config');
const routes = require('./routes');
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');

const app = express();

// Trust first proxy (so rate-limit and IP detection work behind a load balancer)
app.set('trust proxy', 1);

// --- Security headers ---
app.use(
  helmet({
    contentSecurityPolicy: false, // API only; CSP not relevant
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// --- CORS ---
app.use(
  cors({
    origin: config.corsOrigin === '*' ? true : config.corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// --- Body parsers ---
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// --- Compression & logging ---
app.use(compression());
if (config.env !== 'test') {
  app.use(
    morgan(config.env === 'development' ? 'dev' : 'combined', {
      stream: { write: (msg) => logger.info(msg.trim()) },
    })
  );
}

// --- Global rate limiter (per-route limiters layered on top) ---
const globalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later' },
});
app.use(globalLimiter);

// --- Root + API routes ---
app.get('/', (req, res) => {
  res.json({
    success: true,
    name: 'Consumer Intelligence Platform API',
    version: '1.0.0',
    docs: `${config.apiPrefix}/health`,
  });
});

app.use(config.apiPrefix, routes);

// --- Error handling ---
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
