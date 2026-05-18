'use strict';

/**
 * Refresh token storage.
 * The plain token value is SHA-256-hashed before persisting.
 * revoked_at lets the server invalidate a session immediately.
 */
module.exports = (sequelize, DataTypes) => {
  const RefreshToken = sequelize.define(
    'RefreshToken',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      admin_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
      token_hash: {
        type: DataTypes.STRING(128),
        allowNull: false,
        unique: true,
      },
      issued_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      expires_at: { type: DataTypes.DATE, allowNull: false },
      revoked_at: { type: DataTypes.DATE, allowNull: true },
      ip_address: {
        type: DataTypes.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: 'refresh_tokens',
      indexes: [
        { fields: ['admin_id'] },
        { fields: ['token_hash'], unique: true },
      ],
    }
  );

  RefreshToken.associate = (models) => {
    RefreshToken.belongsTo(models.Admin, { foreignKey: 'admin_id', as: 'admin' });
  };

  return RefreshToken;
};
