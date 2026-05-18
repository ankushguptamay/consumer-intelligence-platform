# Consumer Intelligence Platform

Backend for a multi-brand D2C platform. A single consumer who shops across multiple brands has **one unified profile** instead of one row per brand. On top of that, a rule-based **segmentation engine** classifies users into groups, and a **propensity score** estimates how likely each user is to purchase next.

Built with Node.js, Express, MySQL, and Sequelize.

---

## Setup

**Requires:** Node.js 18+, MySQL 8+

```bash
npm install
cp .env.example .env       # edit DB credentials and set JWT_SECRET
npm run db:create
npm run db:migrate
npm run db:seed
npm run dev                # or: npm start
```

Server runs on `http://localhost:3000`. All API routes are under `/api/v1`.

---

## Seeded credentials

Both admins use password `Admin@12345`:

- `admin@nova.com` — owns KiddoKart, UrbanEdge
- `admin@tinytots.com` — owns TinyTots

---

## Database tables

| Table | Purpose |
|---|---|
| `admins` | Login accounts. `id, name, email, password_hash, is_active, last_login_at` |
| `refresh_tokens` | Server-side sessions (SHA-256 hashed). `id, admin_id, token_hash, issued_at, expires_at, revoked_at, ip_address, user_agent` |
| `login_records` | Audit log. `id, admin_id, email, status, ip_address, user_agent, occurred_at` |
| `brands` | Flat list of brands. `id, admin_id, name, slug, is_active` |
| `users` | **One row per consumer**, shared across brands. `id, email, phone, first_name, last_name, gender, date_of_birth, city, total_lifetime_value, last_active_at, is_active` |
| `user_brand_associations` | Junction with per-brand rollups. `id, user_id, brand_id, registered_at, total_spend, purchase_count, last_event_at` |
| `events` | Timestamped behavioural events. `id, user_id, brand_id, event_type, amount, occurred_at` |
| `segments` | Segment definitions. `id, key, name, rule` (rule is JSON) |
| `user_segments` | Junction. `id, user_id, segment_id, assigned_at` |
| `propensity_scores` | Latest score per user. `id, user_id, score, rationale, computed_at` |

**Key design points**

- `users.email` and `users.phone` are `UNIQUE` so a consumer is automatically deduplicated when registered from a second brand.
- `total_lifetime_value` and the per-brand rollups (`total_spend`, `purchase_count`, `last_event_at`) are maintained inside the same DB transaction as the event write — dashboards never scan the events table.
- Segment rules are stored as JSON (`{ type, params }`) so adding a new segment is one new handler function in code; no schema change.

---

## API endpoints

All routes require `Authorization: Bearer <access_token>` except `POST /auth/login`.

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/login` | Email + password → access + refresh token |
| POST | `/api/v1/auth/logout` | Revoke refresh token (or all sessions with `{"all_devices": true}`) |
| POST | `/api/v1/auth/change-password` | Verify current pw, set new, revoke all sessions |

### Brands

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/brands` | List brands |
| GET | `/api/v1/brands/:id` | Brand detail |
| POST | `/api/v1/brands` | Create |
| PATCH | `/api/v1/brands/:id` | Update |
| DELETE | `/api/v1/brands/:id` | Soft-deactivate |

### Users

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/users` | **Upsert** by email/phone — deduplication happens automatically |
| GET | `/api/v1/users` | List (filter by brand, search) |
| GET | `/api/v1/users/:id` | Full profile (brand associations, segments, score) |
| GET | `/api/v1/users/:id/events` | Recent events |
| GET | `/api/v1/users/:id/segments-preview` | Dry-run segment rules against this user |
| GET | `/api/v1/users/:id/propensity` | Latest score |
| POST | `/api/v1/users/:id/brand-associations` | Register user with a brand |

### Events

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/events` | Record one event (rollups update atomically) |
| GET | `/api/v1/events` | Query events (user_id, brand_id, event_type, from, to) |

### Segments & propensity

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/segments` | List segment definitions |
| GET | `/api/v1/segments/:key/users` | Users currently in a segment |
| POST | `/api/v1/segments/recompute` | Recompute memberships |
| GET | `/api/v1/propensity/top` | Top-N users by score |
| POST | `/api/v1/propensity/recompute` | Recompute scores |
| POST | `/api/v1/propensity/recompute/:id` | Recompute for one user |

---

## Quick walkthrough

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@nova.com","password":"Admin@12345"}' \
  | node -pe "JSON.parse(require('fs').readFileSync(0)).data.access_token")

# Upsert a user
curl -s -X POST http://localhost:3000/api/v1/users \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"email":"newuser@example.com","first_name":"New","brand_id":1}'

# Record a purchase
curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"user_id":5,"brand_id":1,"event_type":"PURCHASE","amount":4999}'

# Run segmentation + propensity, then inspect
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/segments/recompute
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/propensity/recompute
curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/users/1
```

---

## Segmentation

Three built-in segments. A user can be in multiple segments at once.

| Key | Matches when… |
|---|---|
| `HIGH_VALUE_USER` | `total_lifetime_value >= 50000` |
| `CROSS_BRAND_USER` | Active on 2 or more brands |
| `DORMANT_USER` | `last_active_at` older than 60 days |

**Adding a new segment** = adding one function to `RULE_HANDLERS` in `src/services/segmentation.service.js` and inserting one row in `segments`. No schema change needed.

---

## Propensity score (0–100)

Three signals, weights total 100:

```
score = min(50, purchases_in_last_180d * 5)    // frequency
      + min(20, activities_in_last_180d * 1)   // engagement
      + (purchase_in_last_30d ? 30 : 0)        // recency bonus
```

Each row carries an auto-generated `rationale` string so the score is always explainable, e.g. *"Moderate likelihood: 10 purchases and 13 total activities in last 180 days."*

**Expected scores from seeded data:**

| User | Purchases (180d) | Activities (180d) | Recent? | Score |
|---|---|---|---|---|
| Priya  | 10 | 13 | no  | **63** |
| Rahul  | 7  | 7  | no  | **42** |
| Aanya  | 0  | 0  | no  | **0**  |
| Meera  | 1  | 4  | yes | **39** |

---

## Security

- Passwords bcrypt-hashed (cost 12), excluded from default query scope
- Access tokens are short-lived JWTs (15 min); refresh tokens are 64-byte crypto-random values, **SHA-256 hashed in DB**
- Logout sets `revoked_at` → session invalidated immediately (not "wait for JWT to expire")
- Password change revokes every active session
- Every login attempt (success or failure) logged with IP + user-agent
- Joi validation on every mutation; helmet, CORS, rate limiting
- All queries parameterised through Sequelize

---

## Project structure

```
src/
├── app.js                 # Express app: security, routes, error handlers
├── server.js              # Entry point: DB connect + listen
├── config/                # Env config + sequelize-cli config
├── models/                # Sequelize models (10 tables)
├── migrations/            # Schema migrations
├── seeders/               # Demo data
├── controllers/           # Thin HTTP layer (try/catch + sendResponse)
├── routes/                # Express routers
├── services/              # Business logic
├── middlewares/           # Auth, validation, error handler
├── validators/            # Joi schemas
└── utils/                 # logger, AppError, sendResponse
```

---

## npm scripts

| Script | What it does |
|---|---|
| `npm start` | Production start |
| `npm run dev` | Auto-reload via nodemon |
| `npm run db:create` | Create the database |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Insert demo data |
| `npm run db:reset` | Drop all migrations, re-migrate, re-seed |
