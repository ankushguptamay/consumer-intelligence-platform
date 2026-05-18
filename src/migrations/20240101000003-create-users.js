'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      email: { type: Sequelize.STRING(160), allowNull: true, unique: true },
      phone: { type: Sequelize.STRING(20), allowNull: true, unique: true },
      first_name: { type: Sequelize.STRING(80), allowNull: true },
      last_name: { type: Sequelize.STRING(80), allowNull: true },
      gender: {
        type: Sequelize.ENUM('MALE', 'FEMALE', 'OTHER'),
        allowNull: true,
      },
      date_of_birth: { type: Sequelize.DATEONLY, allowNull: true },
      city: { type: Sequelize.STRING(80), allowNull: true },
      total_lifetime_value: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      last_active_at: { type: Sequelize.DATE, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
    await queryInterface.addIndex('users', ['last_active_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('users');
  },
};
