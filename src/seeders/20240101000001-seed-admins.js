'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
    const hash = (pwd) => bcrypt.hashSync(pwd, rounds);

    await queryInterface.bulkInsert('admins', [
      {
        id: 1,
        name: 'Primary Admin',
        email: 'admin@nova.com',
        password_hash: hash('Admin@12345'),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        id: 2,
        name: 'TinyTots Admin',
        email: 'admin@tinytots.com',
        password_hash: hash('Admin@12345'),
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ]);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('admins', null, {});
  },
};
