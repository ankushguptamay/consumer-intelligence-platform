'use strict';

/**
 * Segment definition. The rule is stored as JSON so adding new segment
 * types only requires a new rule handler in the service — no schema change.
 *
 * Example rule: { "type": "HIGH_VALUE_USER", "params": { "min_spend": 50000 } }
 */
module.exports = (sequelize, DataTypes) => {
  const Segment = sequelize.define(
    'Segment',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      key: { type: DataTypes.STRING(80), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      rule: { type: DataTypes.JSON, allowNull: false },
    },
    {
      tableName: 'segments',
      indexes: [{ fields: ['key'], unique: true }],
    }
  );

  Segment.associate = (models) => {
    Segment.belongsToMany(models.User, {
      through: models.UserSegment,
      foreignKey: 'segment_id',
      otherKey: 'user_id',
      as: 'users',
    });
  };

  return Segment;
};
