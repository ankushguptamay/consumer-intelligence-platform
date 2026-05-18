'use strict';

/**
 * Audit log of login attempts and logouts.
 */
module.exports = (sequelize, DataTypes) => {
  const LoginRecord = sequelize.define(
    'LoginRecord',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      admin_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        comment: 'NULL when the attempted email did not match any admin',
      },
      email: { type: DataTypes.STRING(160), allowNull: false },
      status: {
        type: DataTypes.ENUM('SUCCESS', 'FAILED_BAD_CREDENTIALS', 'FAILED_INACTIVE', 'LOGOUT'),
        allowNull: false,
      },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      occurred_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'login_records',
      indexes: [
        { fields: ['admin_id'] },
        { fields: ['status'] },
        { fields: ['occurred_at'] },
      ],
    }
  );

  LoginRecord.associate = (models) => {
    LoginRecord.belongsTo(models.Admin, { foreignKey: 'admin_id', as: 'admin' });
  };

  return LoginRecord;
};
