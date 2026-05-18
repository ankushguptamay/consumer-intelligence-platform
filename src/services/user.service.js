'use strict';

/**
 * Unified consumer profile management.
 *
 * upsertUser:
 *   - Looks up an existing user by email OR phone.
 *   - If both keys resolve to different users -> 409 conflict.
 *   - Otherwise creates or updates the matching row.
 *   - Optionally creates a user_brand_association record.
 */

const { Op } = require('sequelize');
const {
  sequelize,
  User,
  Brand,
  UserBrandAssociation,
  Event,
  Segment,
  PropensityScore,
} = require('../models');
const { AppError } = require('../utils/apiResponse');

const upsertUser = async (payload) => {
  const { email, phone, brand_id, ...rest } = payload;

  return sequelize.transaction(async (t) => {
    // Find existing users matching email OR phone
    const orConds = [email && { email }, phone && { phone }].filter(Boolean);
    const candidates = orConds.length
      ? await User.findAll({ where: { [Op.or]: orConds }, transaction: t })
      : [];

    const uniqueIds = [...new Set(candidates.map((c) => c.id))];
    if (uniqueIds.length > 1) {
      throw new AppError('Conflicting identity keys match multiple existing users', 409, {
        conflicting_user_ids: uniqueIds,
      });
    }

    let user = candidates[0] || null;

    if (!user) {
      user = await User.create({ email, phone, ...rest }, { transaction: t });
    } else {
      // Merge non-empty fields
      const updates = {};
      Object.entries({ email, phone, ...rest }).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') updates[k] = v;
      });
      if (Object.keys(updates).length) await user.update(updates, { transaction: t });
    }

    // Optional brand registration in the same call
    if (brand_id) {
      const brand = await Brand.findByPk(brand_id, { transaction: t });
      if (!brand) throw new AppError('Brand not found', 400);
      await UserBrandAssociation.findOrCreate({
        where: { user_id: user.id, brand_id },
        defaults: { user_id: user.id, brand_id, registered_at: new Date() },
        transaction: t,
      });
    }

    return user;
  });
};

const registerToBrand = async (userId, brandId) => {
  const user = await User.findByPk(userId);
  if (!user) throw new AppError('User not found', 404);
  const brand = await Brand.findByPk(brandId);
  if (!brand) throw new AppError('Brand not found', 404);

  const [assoc, created] = await UserBrandAssociation.findOrCreate({
    where: { user_id: userId, brand_id: brandId },
    defaults: { user_id: userId, brand_id: brandId, registered_at: new Date() },
  });
  return { association: assoc, created };
};

const list = async ({ page = 1, limit = 20, brand_id, search }) => {
  const offset = (Number(page) - 1) * Number(limit);
  const where = {};
  if (search) {
    where[Op.or] = [
      { email: { [Op.like]: `%${search}%` } },
      { phone: { [Op.like]: `%${search}%` } },
      { first_name: { [Op.like]: `%${search}%` } },
      { last_name: { [Op.like]: `%${search}%` } },
    ];
  }
  const include = [];
  if (brand_id) {
    include.push({
      model: UserBrandAssociation,
      as: 'brandAssociations',
      where: { brand_id },
      required: true,
    });
  }
  const { rows, count } = await User.findAndCountAll({
    where,
    include,
    limit: Number(limit),
    offset,
    order: [['id', 'DESC']],
    distinct: true,
  });
  return { items: rows, total: count, page: Number(page), limit: Number(limit) };
};

const getById = async (id) => {
  const user = await User.findByPk(id, {
    include: [
      { model: UserBrandAssociation, as: 'brandAssociations', include: [{ model: Brand, as: 'brand' }] },
      { model: Segment, as: 'segments', through: { attributes: ['assigned_at'] } },
      { model: PropensityScore, as: 'propensityScore' },
    ],
  });
  if (!user) throw new AppError('User not found', 404);
  return user;
};

const recentEvents = async (userId, { limit = 50 } = {}) =>
  Event.findAll({
    where: { user_id: userId },
    include: [{ model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] }],
    order: [['occurred_at', 'DESC']],
    limit: Number(limit),
  });

module.exports = { upsertUser, registerToBrand, list, getById, recentEvents };
