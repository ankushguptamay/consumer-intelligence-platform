'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: {
        type: Sequelize.BIGINT.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      user_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      brand_id: {
        type: Sequelize.BIGINT.UNSIGNED,
        allowNull: false,
        references: { model: 'brands', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      event_type: {
        type: Sequelize.ENUM('PURCHASE', 'APP_OPEN', 'PRODUCT_VIEW', 'CONTENT_VIEW'),
        allowNull: false,
      },
      amount: { type: Sequelize.DECIMAL(12, 2), allowNull: true },
      occurred_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
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
    await queryInterface.addIndex('events', ['user_id']);
    await queryInterface.addIndex('events', ['brand_id']);
    await queryInterface.addIndex('events', ['event_type']);
    await queryInterface.addIndex('events', ['occurred_at']);
  },
  async down(queryInterface) {
    await queryInterface.dropTable('events');
  },
};
