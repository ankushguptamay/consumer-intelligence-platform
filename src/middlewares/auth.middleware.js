'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config');
const { Admin } = require('../models');
const { AppError } = require('../utils/apiResponse');

/**
 * Verifies the access token and attaches the admin to the request.
 *
 * Note: The access token (short-lived JWT) is stateless; revocation is
 * handled at the refresh-token layer. On logout, the refresh token is
 * deleted from DB which prevents new access tokens from being minted.
 * Access tokens are short-lived (15 min default) so the blast radius
 * of this design is small.
 */
const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) {
      throw new AppError('Authorization header missing or malformed', 401);
    }
    const token = header.slice(7).trim();

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwtSecret);
    } catch (e) {
      throw new AppError('Invalid or expired access token', 401);
    }

    if (decoded.type !== 'access') {
      throw new AppError('Wrong token type', 401);
    }

    const admin = await Admin.findByPk(decoded.sub);
    if (!admin || !admin.is_active) {
      throw new AppError('Admin not found or inactive', 401);
    }

    req.admin = admin;
    req.tokenPayload = decoded;
    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = { authenticate };
