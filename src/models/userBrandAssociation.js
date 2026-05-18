'use strict';

module.exports = (sequelize, DataTypes) => {
  const UserBrandAssociation = sequelize.define(
    'UserBrandAssociation',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      brand_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      registered_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      total_spend: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      purchase_count: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        defaultValue: 0,
      },
      last_event_at: { type: DataTypes.DATE, allowNull: true },
    },
    {
      tableName: 'user_brand_associations',
      indexes: [
        { fields: ['user_id', 'brand_id'], unique: true },
        { fields: ['brand_id'] },
      ],
    }
  );

  UserBrandAssociation.associate = (models) => {
    UserBrandAssociation.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
    UserBrandAssociation.belongsTo(models.Brand, { foreignKey: 'brand_id', as: 'brand' });
  };

  return UserBrandAssociation;
};
