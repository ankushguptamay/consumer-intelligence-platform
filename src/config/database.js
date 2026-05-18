'use strict';

require('dotenv').config();

const config = {
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'consumer_intelligence',
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  dialect: process.env.DB_DIALECT || 'mysql',
  define: {
    underscored: true,
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci',
  },
  logging: false,
};

module.exports = {
  development: config,
  test: { ...config, database: config.database + '_test' },
  production: config,
};
