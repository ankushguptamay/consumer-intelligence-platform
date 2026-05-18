'use strict';

const app = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const { sequelize } = require('./models');

let server;

const start = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');

    server = app.listen(config.port, () => {
      logger.info(`Server listening on port ${config.port} (${config.env})`);
      logger.info(`API base path: ${config.apiPrefix}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);
    process.exit(1);
  }
};

const shutdown = (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  if (server) {
    server.close(async () => {
      try {
        await sequelize.close();
        logger.info('Database connection closed');
      } catch (e) {
        logger.error('Error closing database:', e);
      }
      process.exit(0);
    });

    // Force-exit if not closed within 10s
    setTimeout(() => {
      logger.error('Forcing shutdown after timeout');
      process.exit(1);
    }, 10000).unref();
  } else {
    process.exit(0);
  }
};

['SIGINT', 'SIGTERM'].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  shutdown('UNCAUGHT_EXCEPTION');
});

start();
