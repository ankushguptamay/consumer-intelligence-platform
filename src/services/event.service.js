'use strict';

/**
 * Records a behavioural / transaction event.
 * Maintains denormalized rollups atomically:
 *   - user_brand_associations.total_spend / purchase_count / last_event_at
 *   - users.total_lifetime_value / last_active_at
 */

const { Op } = require('sequelize');
const { sequelize, Event, User, Brand, UserBrandAssociation } = require('../models');
const { AppError } = require('../utils/apiResponse');

const recordEvent = async (payload) => {
  const { user_id, brand_id, event_type, amount, occurred_at } = payload;

  return sequelize.transaction(async (t) => {
    const user = await User.findByPk(user_id, { transaction: t });
    if (!user) throw new AppError('User not found', 404);

    const brand = await Brand.findByPk(brand_id, { transaction: t });
    if (!brand) throw new AppError('Brand not found', 404);

    // Ensure the user is registered with the brand (auto-register on first event)
    const [assoc] = await UserBrandAssociation.findOrCreate({
      where: { user_id, brand_id },
      defaults: { user_id, brand_id, registered_at: new Date() },
      transaction: t,
    });

    const event = await Event.create(
      {
        user_id,
        brand_id,
        event_type,
        amount: event_type === 'PURCHASE' ? amount : null,
        occurred_at: occurred_at ? new Date(occurred_at) : new Date(),
      },
      { transaction: t }
    );

    // Update rollups
    const assocUpdates = { last_event_at: event.occurred_at };
    const userUpdates = { last_active_at: event.occurred_at };

    if (event_type === 'PURCHASE' && amount) {
      assocUpdates.total_spend = Number(assoc.total_spend) + Number(amount);
      assocUpdates.purchase_count = Number(assoc.purchase_count) + 1;
      userUpdates.total_lifetime_value = Number(user.total_lifetime_value) + Number(amount);
    }

    await assoc.update(assocUpdates, { transaction: t });
    await user.update(userUpdates, { transaction: t });

    return event;
  });
};

const list = async ({ page = 1, limit = 50, user_id, brand_id, event_type, from, to }) => {
  const where = {};
  if (user_id) where.user_id = user_id;
  if (brand_id) where.brand_id = brand_id;
  if (event_type) where.event_type = event_type;
  if (from || to) {
    where.occurred_at = {};
    if (from) where.occurred_at[Op.gte] = new Date(from);
    if (to) where.occurred_at[Op.lte] = new Date(to);
  }
  const offset = (Number(page) - 1) * Number(limit);
  const { rows, count } = await Event.findAndCountAll({
    where,
    include: [
      { model: User, as: 'user', attributes: ['id', 'email', 'first_name', 'last_name'] },
      { model: Brand, as: 'brand', attributes: ['id', 'name', 'slug'] },
    ],
    limit: Number(limit),
    offset,
    order: [['occurred_at', 'DESC']],
  });
  return { items: rows, total: count, page: Number(page), limit: Number(limit) };
};

module.exports = { recordEvent, list };
