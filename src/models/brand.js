'use strict';

module.exports = (sequelize, DataTypes) => {
  const Brand = sequelize.define(
    'Brand',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      admin_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'Admin who owns/manages this brand',
      },
      name: { type: DataTypes.STRING(150), allowNull: false },
      slug: { type: DataTypes.STRING(160), allowNull: false, unique: true },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'brands',
      indexes: [{ fields: ['admin_id'] }, { fields: ['slug'], unique: true }],
    }
  );

  Brand.associate = (models) => {
    Brand.belongsTo(models.Admin, { foreignKey: 'admin_id', as: 'admin' });
    Brand.hasMany(models.UserBrandAssociation, { foreignKey: 'brand_id', as: 'userAssociations' });
    Brand.hasMany(models.Event, { foreignKey: 'brand_id', as: 'events' });
  };

  return Brand;
};
