'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { Admin, RefreshToken, LoginRecord } = require('../models');
const { AppError } = require('../utils/apiResponse');

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');
const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

const signAccessToken = (admin) =>
  jwt.sign({ sub: admin.id, email: admin.email, type: 'access' }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

// "7d" / "15m" -> Date
const expiryDate = (expr) => {
  const m = /^(\d+)\s*([smhd])$/.exec(String(expr).trim());
  if (!m) return new Date(Date.now() + 7 * 86400000);
  const n = parseInt(m[1], 10);
  const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
  return new Date(Date.now() + n * mult);
};

const login = async ({ email, password }, requestMeta = {}) => {
  const ip = requestMeta.ip || null;
  const userAgent = requestMeta.userAgent || null;

  const admin = await Admin.scope('withPassword').findOne({ where: { email } });

  // Email did not match any admin -> generic bad-credentials, admin_id is NULL
  if (!admin) {
    await LoginRecord.create({
      admin_id: null,
      email,
      status: 'FAILED_BAD_CREDENTIALS',
      ip_address: ip,
      user_agent: userAgent,
    });
    throw new AppError('Invalid credentials', 401);
  }

  // Admin exists but is deactivated
  if (!admin.is_active) {
    await LoginRecord.create({
      admin_id: admin.id,
      email,
      status: 'FAILED_INACTIVE',
      ip_address: ip,
      user_agent: userAgent,
    });
    throw new AppError('Account is inactive', 403);
  }

  // Wrong password
  const ok = await admin.verifyPassword(password);
  if (!ok) {
    await LoginRecord.create({
      admin_id: admin.id,
      email,
      status: 'FAILED_BAD_CREDENTIALS',
      ip_address: ip,
      user_agent: userAgent,
    });
    throw new AppError('Invalid credentials', 401);
  }

  // Success - issue tokens
  const refreshTokenPlain = generateRefreshToken();
  const refreshExpiresAt = expiryDate(config.jwtRefreshExpiresIn);

  await RefreshToken.create({
    admin_id: admin.id,
    token_hash: hashToken(refreshTokenPlain),
    issued_at: new Date(),
    expires_at: refreshExpiresAt,
    ip_address: ip,
    user_agent: userAgent,
  });

  await LoginRecord.create({
    admin_id: admin.id,
    email,
    status: 'SUCCESS',
    ip_address: ip,
    user_agent: userAgent,
  });

  // Update admin.last_login_at
  admin.last_login_at = new Date();
  await admin.save();

  const safeAdmin = await Admin.findByPk(admin.id);
  return {
    admin: safeAdmin,
    access_token: signAccessToken(admin),
    refresh_token: refreshTokenPlain,
    refresh_token_expires_at: refreshExpiresAt,
    token_type: 'Bearer',
  };
};

const logout = async (adminId, { refresh_token, all_devices = false } = {}, requestMeta = {}) => {
  const ip = requestMeta.ip || null;
  const userAgent = requestMeta.userAgent || null;

  if (all_devices) {
    const [count] = await RefreshToken.update(
      { revoked_at: new Date() },
      { where: { admin_id: adminId, revoked_at: null } }
    );
    await LoginRecord.create({
      admin_id: adminId,
      email: '(logout-all)',
      status: 'LOGOUT',
      ip_address: ip,
      user_agent: userAgent,
    });
    return { revoked_count: count, all_devices: true };
  }

  if (refresh_token) {
    const tokenRow = await RefreshToken.findOne({
      where: { admin_id: adminId, token_hash: hashToken(refresh_token), revoked_at: null },
    });
    if (tokenRow) {
      tokenRow.revoked_at = new Date();
      await tokenRow.save();
    }
  }

  await LoginRecord.create({
    admin_id: adminId,
    email: '(logout)',
    status: 'LOGOUT',
    ip_address: ip,
    user_agent: userAgent,
  });
  return { revoked_count: refresh_token ? 1 : 0, all_devices: false };
};

const changePassword = async (adminId, { current_password, new_password }) => {
  const admin = await Admin.scope('withPassword').findByPk(adminId);
  if (!admin) throw new AppError('Admin not found', 404);

  const ok = await admin.verifyPassword(current_password);
  if (!ok) throw new AppError('Current password is incorrect', 401);

  if (current_password === new_password) {
    throw new AppError('New password must be different from current password', 400);
  }

  admin.password_hash = new_password;
  await admin.save();

  // Revoke every active session so all devices need to log in again
  const [revokedCount] = await RefreshToken.update(
    { revoked_at: new Date() },
    { where: { admin_id: adminId, revoked_at: null } }
  );

  return { success: true, sessions_revoked: revokedCount };
};

module.exports = { login, logout, changePassword };
