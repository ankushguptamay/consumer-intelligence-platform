'use strict';

/**
 * Seeds 4 consumers that each trigger a different segment / score:
 *   - Priya:  high-value, cross-brand, active
 *   - Rahul:  high-value, single-brand, active
 *   - Aanya:  dormant (no activity in 150 days)
 *   - Meera:  brand new, low spend
 */

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

module.exports = {
  async up(queryInterface) {
    const now = new Date();

    await queryInterface.bulkInsert('users', [
      {
        id: 1,
        email: 'priya.sharma@example.com',
        phone: '+919812345001',
        first_name: 'Priya',
        last_name: 'Sharma',
        gender: 'FEMALE',
        date_of_birth: '1988-04-12',
        city: 'Mumbai',
        total_lifetime_value: 63000,
        last_active_at: daysAgo(2),
        is_active: true,
        created_at: daysAgo(400),
        updated_at: now,
      },
      {
        id: 2,
        email: 'rahul.verma@example.com',
        phone: '+919812345002',
        first_name: 'Rahul',
        last_name: 'Verma',
        gender: 'MALE',
        date_of_birth: '1992-09-20',
        city: 'Bengaluru',
        total_lifetime_value: 62000,
        last_active_at: daysAgo(5),
        is_active: true,
        created_at: daysAgo(300),
        updated_at: now,
      },
      {
        id: 3,
        email: 'aanya.kapoor@example.com',
        phone: '+919812345003',
        first_name: 'Aanya',
        last_name: 'Kapoor',
        gender: 'FEMALE',
        date_of_birth: '1990-06-05',
        city: 'New Delhi',
        total_lifetime_value: 12000,
        last_active_at: daysAgo(150),
        is_active: true,
        created_at: daysAgo(500),
        updated_at: now,
      },
      {
        id: 4,
        email: 'meera.iyer@example.com',
        phone: '+919812345004',
        first_name: 'Meera',
        last_name: 'Iyer',
        gender: 'FEMALE',
        date_of_birth: '1995-11-30',
        city: 'Chennai',
        total_lifetime_value: 1500,
        last_active_at: daysAgo(1),
        is_active: true,
        created_at: daysAgo(10),
        updated_at: now,
      },
    ]);

    // brand_id: 1=TinyTots, 2=KiddoKart, 3=UrbanEdge
    await queryInterface.bulkInsert('user_brand_associations', [
      // Priya: TinyTots + UrbanEdge (cross-brand)
      { id: 1, user_id: 1, brand_id: 1, registered_at: daysAgo(400), total_spend: 35000, purchase_count: 12, last_event_at: daysAgo(2), created_at: daysAgo(400), updated_at: now },
      { id: 2, user_id: 1, brand_id: 3, registered_at: daysAgo(200), total_spend: 28000, purchase_count: 8, last_event_at: daysAgo(7), created_at: daysAgo(200), updated_at: now },
      // Rahul: UrbanEdge only
      { id: 3, user_id: 2, brand_id: 3, registered_at: daysAgo(300), total_spend: 62000, purchase_count: 14, last_event_at: daysAgo(5), created_at: daysAgo(300), updated_at: now },
      // Aanya: KiddoKart, dormant
      { id: 4, user_id: 3, brand_id: 2, registered_at: daysAgo(500), total_spend: 12000, purchase_count: 6, last_event_at: daysAgo(150), created_at: daysAgo(500), updated_at: now },
      // Meera: KiddoKart, brand new
      { id: 5, user_id: 4, brand_id: 2, registered_at: daysAgo(10), total_spend: 1500, purchase_count: 1, last_event_at: daysAgo(1), created_at: daysAgo(10), updated_at: now },
    ]);

    // Events: just enough to make segmentation + propensity scoring produce
    // meaningful results.
    const events = [];
    let eid = 1;
    const add = (overrides) => {
      events.push({
        id: eid++,
        user_id: null,
        brand_id: null,
        event_type: 'PURCHASE',
        amount: null,
        occurred_at: now,
        created_at: now,
        updated_at: now,
        ...overrides,
      });
    };

    // Priya: 12 purchases on TinyTots + 8 on UrbanEdge
    for (let i = 0; i < 12; i += 1) {
      add({ user_id: 1, brand_id: 1, event_type: 'PURCHASE', amount: 2500, occurred_at: daysAgo(400 - i * 30) });
    }
    for (let i = 0; i < 8; i += 1) {
      add({ user_id: 1, brand_id: 3, event_type: 'PURCHASE', amount: 3500, occurred_at: daysAgo(200 - i * 20) });
    }
    [0, 2, 5].forEach((d) => add({ user_id: 1, brand_id: 1, event_type: 'APP_OPEN', occurred_at: daysAgo(d) }));

    // Rahul: 14 purchases on UrbanEdge
    for (let i = 0; i < 14; i += 1) {
      add({ user_id: 2, brand_id: 3, event_type: 'PURCHASE', amount: 4500, occurred_at: daysAgo(300 - i * 20) });
    }

    // Aanya: 6 old purchases, no recent activity
    for (let i = 0; i < 6; i += 1) {
      add({ user_id: 3, brand_id: 2, event_type: 'PURCHASE', amount: 2000, occurred_at: daysAgo(500 - i * 60) });
    }

    // Meera: 1 small purchase, recent app activity
    add({ user_id: 4, brand_id: 2, event_type: 'PURCHASE', amount: 1500, occurred_at: daysAgo(5) });
    [0, 1, 2].forEach((d) => add({ user_id: 4, brand_id: 2, event_type: 'APP_OPEN', occurred_at: daysAgo(d) }));

    await queryInterface.bulkInsert('events', events);
  },
  async down(queryInterface) {
    await queryInterface.bulkDelete('events', null, {});
    await queryInterface.bulkDelete('user_brand_associations', null, {});
    await queryInterface.bulkDelete('users', null, {});
  },
};
