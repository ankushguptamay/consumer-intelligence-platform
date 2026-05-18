'use strict';

/**
 * Junction: users <-> segments. A user can belong to many segments.
 */
module.exports = (sequelize, DataTypes) => {
  const UserSegment = sequelize.define(
    'UserSegment',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      segment_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'user_segments',
      indexes: [
        { fields: ['user_id', 'segment_id'], unique: true },
        { fields: ['segment_id'] },
      ],
    }
  );

  UserSegment.associate = (models) => {
    UserSegment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserSegment.belongsTo(models.Segment, { foreignKey: 'segment_id', as: 'segment' });
  };

  return UserSegment;
};
