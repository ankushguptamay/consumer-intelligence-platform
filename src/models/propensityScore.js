'use strict';

/**
 * Latest computed spending-propensity score per user.
 */
module.exports = (sequelize, DataTypes) => {
  const PropensityScore = sequelize.define(
    'PropensityScore',
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: false,
        unique: true,
      },
      score: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        validate: { min: 0, max: 100 },
      },
      rationale: { type: DataTypes.STRING(300), allowNull: false },
      computed_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: 'propensity_scores',
      indexes: [{ fields: ['user_id'], unique: true }, { fields: ['score'] }],
    }
  );

  PropensityScore.associate = (models) => {
    PropensityScore.belongsTo(models.User, { foreignKey: 'user_id', as: 'user' });
  };

  return PropensityScore;
};
