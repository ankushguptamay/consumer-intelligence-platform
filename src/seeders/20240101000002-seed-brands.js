'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('brands', [
      { id: 1, admin_id: 2, name: 'TinyTots', slug: 'tinytots', is_active: true, created_at: now, updated_at: now },
      { id: 2, admin_id: 1, name: 'KiddoKart', slug: 'kiddokart', is_active: true, created_at: now, updated_at: now },
      { id: 3, admin_id: 1, name: 'UrbanEdge', slug: 'urbanedge', is_active: true, created_at: now, updated_at: now },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('brands', null, {});
  },
};
