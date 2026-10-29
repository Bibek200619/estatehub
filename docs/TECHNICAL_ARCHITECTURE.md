# EstateHub technical architecture

## Proposed stack

- **Client:** React + TypeScript + Vite, React Router, CSS modules/design tokens, accessible native controls; Lucide icons.
- **API:** Node.js 22 + Express, TypeScript, Zod request validation, REST JSON.
- **Persistence:** SQLite via `better-sqlite3`; SQL schema and idempotent sample seeding. Relational constraints map directly to the deck's four entities.
- **Authentication:** server-side sessions in SQLite (`express-session` + SQLite session store), password hashing with Argon2id or bcrypt; role/capability middleware.
- **Security/quality:** Helmet, same-origin deployment, request rate limits, parameterized SQL, centralized errors, Vitest + Supertest, ESLint/Prettier, Playwright for primary browser journeys if available.
- **Deployment readiness:** one Node process serves built client and `/api`; SQLite path configurable by `DATABASE_PATH`; `.env.example` contains no secrets. A production host needs persistent disk or a managed SQL database.

The deck names HTML/CSS/JS or React, Node/Express, MySQL or MongoDB and GitHub. The selected stack honors those constraints while choosing local SQLite for simple, persistent and reproducible college demonstrations. No external API is required by the core workflows.

## Layers and data flow

React UI → same-origin `/api/*` Express routes → validation/auth/business services → parameterized SQL repositories → SQLite. The server owns authorization and validation; client-side state is convenience only.

## Data model

- `users(id, name, email UNIQUE, password_hash, is_admin, created_at)`
- `properties(id, owner_id FK, title, description, type, transaction, price, address, city, area_sqft, bedrooms, bathrooms, amenities_json, image_urls_json, availability, published_at, updated_at, active)`
- `favourites(user_id FK, property_id FK, created_at, PRIMARY KEY(user_id, property_id))`
- `inquiries(id, user_id FK, property_id FK, message, status, created_at, updated_at)`
- `sessions` managed by session store

Indexes on email, property city/type/transaction/price/availability, owner, favourite user and inquiry owner/property access paths.

## API outline

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- `GET /api/properties` (validated search/filter/sort/pagination), `GET /api/properties/:id`
- `POST /api/properties`, `PATCH /api/properties/:id`, `DELETE /api/properties/:id` (owner/admin; delete is soft)
- `GET/POST/DELETE /api/favourites` and `GET/PUT /api/favourites/:propertyId`
- `POST /api/properties/:id/inquiries`, `GET /api/inquiries` (sender/owner/admin visibility), `PATCH /api/inquiries/:id`
- `GET /api/admin/users`, `GET /api/admin/properties`, `PATCH /api/admin/properties/:id/status`
- `GET /api/health`

## Security and data handling

Hash passwords; do not return hashes; validate every body/query; scope every read/write to actor; regenerate sessions at login; use HTTP-only, SameSite cookies; secure cookies in production; rate-limit auth/inquiries; restrict CORS to same-origin; cap body size; escape rendered user content; parameterize SQL; keep secrets out of Git; include fictional seed content only.

## Deployment constraints

SQLite is suitable for single-instance demonstration deployment. Horizontal scaling and ephemeral filesystems require migration to managed Postgres/MySQL and shared session storage. No real listing data, identity or legal verification is supplied.
