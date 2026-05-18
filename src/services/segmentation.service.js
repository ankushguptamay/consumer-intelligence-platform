'use strict';

const { User, UserBrandAssociation, Segment, UserSegment } = require('../models');

// Each handler returns true if the user matches the rule.
const RULE_HANDLERS = {
  HIGH_VALUE_USER: async (user, params) => {
    const min = Number(params.min_spend || 50000);
    return Number(user.total_lifetime_value) >= min;
  },

  CROSS_BRAND_USER: async (user, params) => {
    const min = Number(params.min_brands || 2);
    const count = await UserBrandAssociation.count({ where: { user_id: user.id } });
    return count >= min;
  },

  DORMANT_USER: async (user, params) => {
    const days = Number(params.inactive_days || 60);
    if (!user.last_active_at) return false;
    const diffDays = (Date.now() - new Date(user.last_active_at).getTime()) / 86400000;
    return diffDays >= days;
  },
};

const evaluateUser = async (user, segments) => {
  const matched = [];
  for (const seg of segments) {
    const rule = typeof seg.rule === 'string' ? JSON.parse(seg.rule) : seg.rule;
    const handler = RULE_HANDLERS[rule.type];
    if (!handler) continue;
    // eslint-disable-next-line no-await-in-loop
    if (await handler(user, rule.params || {})) {
      matched.push(seg);
    }
  }
  return matched;
};

/**
 * Recompute segment memberships for all users (or a single user if userId given).
 * Adds new matches and removes stale ones.
 */
const recomputeAll = async (userId = null) => {
  const segments = await Segment.findAll();
  const users = await User.findAll(userId ? { where: { id: userId } } : {});

  let added = 0;
  let removed = 0;

  for (const user of users) {
    // eslint-disable-next-line no-await-in-loop
    const matched = await evaluateUser(user, segments);
    const matchedIds = new Set(matched.map((s) => s.id));

    // eslint-disable-next-line no-await-in-loop
    const existing = await UserSegment.findAll({ where: { user_id: user.id } });
    const existingIds = new Set(existing.map((u) => u.segment_id));

    // Add new matches
    for (const seg of matched) {
      if (!existingIds.has(seg.id)) {
        // eslint-disable-next-line no-await-in-loop
        await UserSegment.create({ user_id: user.id, segment_id: seg.id });
        added += 1;
      }
    }
    // Remove stale memberships
    for (const u of existing) {
      if (!matchedIds.has(u.segment_id)) {
        // eslint-disable-next-line no-await-in-loop
        await u.destroy();
        removed += 1;
      }
    }
  }

  return { evaluated_users: users.length, added, removed };
};

const listSegments = async () => Segment.findAll({ order: [['id', 'ASC']] });

const getSegmentUsers = async (segmentKey, { page = 1, limit = 50 } = {}) => {
  const segment = await Segment.findOne({ where: { key: segmentKey } });
  if (!segment) return { items: [], total: 0, page, limit, segment: null };

  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await User.findAndCountAll({
    include: [
      {
        model: Segment,
        as: 'segments',
        where: { id: segment.id },
        through: { attributes: ['assigned_at'] },
        required: true,
      },
    ],
    limit: Number(limit),
    offset,
    order: [['id', 'ASC']],
    distinct: true,
  });
  return { items: rows, total: count, page: Number(page), limit: Number(limit), segment };
};

const previewForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  const segments = await Segment.findAll();
  const result = [];
  for (const seg of segments) {
    const rule = typeof seg.rule === 'string' ? JSON.parse(seg.rule) : seg.rule;
    const handler = RULE_HANDLERS[rule.type];
    // eslint-disable-next-line no-await-in-loop
    const matches = handler ? await handler(user, rule.params || {}) : false;
    result.push({ key: seg.key, name: seg.name, matches });
  }
  return result;
};

module.exports = { RULE_HANDLERS, recomputeAll, listSegments, getSegmentUsers, previewForUser };
