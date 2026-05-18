'use strict';

const { Op } = require('sequelize');
const { User, Event, PropensityScore } = require('../models');

const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));

const computeForUser = async (user) => {
  const since180 = new Date(Date.now() - 180 * 86400000);
  const since30 = new Date(Date.now() - 30 * 86400000);

  // 1. Purchase frequency in last 180 days
  const purchases180 = await Event.count({
    where: {
      user_id: user.id,
      event_type: 'PURCHASE',
      occurred_at: { [Op.gte]: since180 },
    },
  });

  // 2. Total activity (any event type) in last 180 days
  const activities180 = await Event.count({
    where: {
      user_id: user.id,
      occurred_at: { [Op.gte]: since180 },
    },
  });

  // 3. Any recent purchase in last 30 days
  const recentPurchase = await Event.findOne({
    where: {
      user_id: user.id,
      event_type: 'PURCHASE',
      occurred_at: { [Op.gte]: since30 },
    },
  });

  const frequencyPoints = clamp(purchases180 * 5, 0, 50);  // 5 pts each, cap 50
  const activityPoints = clamp(activities180 * 1, 0, 20);  // 1 pt each, cap 20
  const recencyPoints = recentPurchase ? 30 : 0;
  const score = clamp(frequencyPoints + activityPoints + recencyPoints);

  let rationale;
  if (score >= 80) {
    rationale =
      `High likelihood: ${purchases180} purchases and ${activities180} total activities ` +
      `in last 180 days, with recent purchase.`;
  } else if (score >= 50) {
    rationale =
      `Moderate likelihood: ${purchases180} purchases and ${activities180} total activities ` +
      `in last 180 days.`;
  } else if (score > 0) {
    rationale = recentPurchase
      ? `Low likelihood: only ${purchases180} purchases in 180 days, but one was recent ` +
        `(${activities180} total activities).`
      : `Low likelihood: ${purchases180} purchases and ${activities180} activities in 180 days, ` +
        `no recent purchase.`;
  } else {
    rationale = 'Very low likelihood: no purchases or activity in the last 180 days.';
  }

  return { score, rationale };
};

const saveScoreForUser = async (userId) => {
  const user = await User.findByPk(userId);
  if (!user) return null;
  const { score, rationale } = await computeForUser(user);
  const [row] = await PropensityScore.upsert({
    user_id: user.id,
    score,
    rationale,
    computed_at: new Date(),
  });
  return row;
};

const recomputeAll = async () => {
  const users = await User.findAll({ attributes: ['id'] });
  for (const u of users) {
    // eslint-disable-next-line no-await-in-loop
    await saveScoreForUser(u.id);
  }
  return { updated: users.length };
};

const getForUser = async (userId) => PropensityScore.findOne({ where: { user_id: userId } });

const top = async ({ limit = 20 } = {}) =>
  PropensityScore.findAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] }],
    order: [['score', 'DESC']],
    limit: Number(limit),
  });

module.exports = { computeForUser, saveScoreForUser, recomputeAll, getForUser, top };
