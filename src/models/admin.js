'use strict';

const bcrypt = require('bcryptjs');
const config = require('../config');

module.exports = (sequelize, DataTypes) => {
  const Admin = sequelize.define(
    'Admin',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      name: { type: DataTypes.STRING(120), allowNull: false },
      email: {
        type: DataTypes.STRING(160),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password_hash: { type: DataTypes.STRING(255), allowNull: false },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_login_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'admins',
      indexes: [{ fields: ['email'], unique: true }],
      defaultScope: { attributes: { exclude: ['password_hash'] } },
      scopes: { withPassword: { attributes: { include: ['password_hash'] } } },
    }
  );

  Admin.associate = (models) => {
    Admin.hasMany(models.Brand, { foreignKey: 'admin_id', as: 'brands' });
    Admin.hasMany(models.RefreshToken, { foreignKey: 'admin_id', as: 'refreshTokens' });
    Admin.hasMany(models.LoginRecord, { foreignKey: 'admin_id', as: 'loginRecords' });
  };

  Admin.beforeCreate(async (admin) => {
    if (admin.password_hash) {
      admin.password_hash = await bcrypt.hash(admin.password_hash, config.bcryptSaltRounds);
    }
  });

  Admin.beforeUpdate(async (admin) => {
    if (admin.changed('password_hash')) {
      admin.password_hash = await bcrypt.hash(admin.password_hash, config.bcryptSaltRounds);
    }
  });

  Admin.prototype.verifyPassword = async function (plain) {
    return bcrypt.compare(plain, this.password_hash);
  };

  return Admin;
};
