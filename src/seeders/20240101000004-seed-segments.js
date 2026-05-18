'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert('segments', [
      {
        id: 1,
        key: 'HIGH_VALUE_USER',
        name: 'High Value User',
        rule: JSON.stringify({ type: 'HIGH_VALUE_USER', params: { min_spend: 50000 } }),
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        key: 'CROSS_BRAND_USER',
        name: 'Cross-Brand User',
        rule: JSON.stringify({ type: 'CROSS_BRAND_USER', params: { min_brands: 2 } }),
        created_at: now,
        updated_at: now,
      },
      {
        id: 3,
        key: 'DORMANT_USER',
        name: 'Dormant User',
        rule: JSON.stringify({ type: 'DORMANT_USER', params: { inactive_days: 60 } }),
        created_at: now,
        updated_at: now,
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('segments', null, {});
  },
};
