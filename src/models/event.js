'use strict';

/**
 * Behavioural / transaction event log.
 * Every event is tied to both a user and a brand.
 */
module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define(
    'Event',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      brand_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      event_type: {
        type: DataTypes.ENUM('PURCHASE', 'APP_OPEN', 'PRODUCT_VIEW', 'CONTENT_VIEW'),
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        comment: 'Required for PURCHASE events',
      },
      occurred_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'events',
      indexes: [
        { fields: ['user_id'] },
        { fields: ['brand_id'] },
        { fields: ['event_type'] },
        { fields: ['occurred_at'] },
      ],
    }
  );

  Event.associate = (models) => {
    Event.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    Event.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'brand' });
  };

  return Event;
};
