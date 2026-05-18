'use strict';

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(160),
        allowNull: true,
        unique: true,
        validate: { isEmail: true },
      },
      phone: { type: DataTypes.STRING(20), allowNull: true, unique: true },
      first_name: { type: DataTypes.STRING(80), allowNull: true },
      last_name: { type: DataTypes.STRING(80), allowNull: true },
      gender: {
        type: DataTypes.ENUM('MALE', 'FEMALE', 'OTHER'),
        allowNull: true,
      },
      date_of_birth: { type: DataTypes.DATEONLY, allowNull: true },
      city: { type: DataTypes.STRING(80), allowNull: true },
      total_lifetime_value: {
        type: DataTypes.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Sum of all purchase events across all brands',
      },
      last_active_at: { type: DataTypes.DATE, allowNull: true },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'users',
      indexes: [
        { fields: ['email'], unique: true },
        { fields: ['phone'], unique: true },
        { fields: ['last_active_at'] },
      ],
    }
  );

  User.associate = (models) => {
    User.hasMany(models.UserBrandAssociation, { foreignKey: 'user_id', as: 'brandAssociations' });
    User.belongsToMany(models.Brand, {
      through: models.UserBrandAssociation,
      foreignKey: 'user_id',
      otherKey: 'brand_id',
      as: 'brands',
    });
    User.hasMany(models.Event, { foreignKey: 'user_id', as: 'events' });
    User.belongsToMany(models.Segment, {
      through: models.UserSegment,
      foreignKey: 'user_id',
      otherKey: 'segment_id',
      as: 'segments',
    });
    User.hasOne(models.PropensityScore, { foreignKey: 'user_id', as: 'propensityScore' });
  };

  return User;
};
