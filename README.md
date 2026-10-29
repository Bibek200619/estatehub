# EstateHub

EstateHub is a real-estate marketplace MVP based on the supplied college-project brief. It brings property seekers and providers into one place to search, compare, save and inquire about homes, while giving owners a simple listing workspace and administrators basic moderation controls.

All seeded properties and demo accounts are fictional. The app is a college demonstration and does not verify listings, prices, legal status, or property availability.

## Features

- Browse and filter buy/rent properties by location, type, budget and bedrooms; sort by price or newest.
- Compare consistent listing cards and review property photos, key facts, amenities and availability.
- Register/sign in, save favourite homes and send in-app inquiries.
- Provider dashboard for listing creation, editing, availability and incoming inquiry status.
- Admin view for users/listings, with reversible listing deactivation.
- Responsive layouts for mobile and desktop with keyboard focus states, labeled forms, accessible feedback and reduced-motion support.

## Technology

- React 19, TypeScript, Vite, React Router, Lucide icons
- Node.js 22+, Express 5, TypeScript, Zod
- SQLite via better-sqlite3; relational tables for users, properties, favourites, inquiries and server sessions
- Helmet, rate limits, scrypt password hashing, opaque HTTP-only session cookies
- Vitest API integration tests, ESLint, TypeScript and Vite production build

The three-layer flow is React UI → same-origin Express JSON API → validated business logic and parameterized SQL → SQLite. SQLite keeps the college demo self-contained. A multi-instance production deployment should use a managed database and shared session store.

## Prerequisites

- Node.js 22 or newer and npm
- A C/C++ build toolchain if a prebuilt `better-sqlite3` binary is unavailable for your platform

## Local setup

```sh
cd estatehub
npm ci
cp .env.example .env
npm run seed
npm run dev
```

The client starts at [http://localhost:5173](http://localhost:5173); the API runs at [http://localhost:3001/api/health](http://localhost:3001/api/health). Vite proxies API requests during development.

Seeded sign-in accounts:

| Role | Email | Password |
|---|---|---|
| Seeker | `maya@estatehub.demo` | Value of `DEMO_SEED_PASSWORD` (default: `EstateHubDemo!2026`) |
| Provider | `arjun@estatehub.demo` | Value of `DEMO_SEED_PASSWORD` |
| Admin | `admin@estatehub.demo` | Value of `DEMO_SEED_PASSWORD` |

Change `DEMO_SEED_PASSWORD` in `.env` before creating seed accounts for a shared demo. Seeding is idempotent and does not rotate existing passwords. To reset the local demo database, stop the app, remove `data/estatehub.sqlite` and its `-shm`/`-wal` files, then run `npm run seed` again. Do not use the sample accounts or password in a public production environment.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `PORT` | Express port | `3001` |
| `DATABASE_PATH` | SQLite database file | `./data/estatehub.sqlite` |
| `NODE_ENV` | Runtime mode (`development` / `production`) | development |
| `DEMO_SEED_PASSWORD` | Password set when demo accounts are first created | `EstateHubDemo!2026` |

`.env` and database files are gitignored. For production, set `NODE_ENV=production` and use secure HTTPS. Sessions use random opaque tokens stored as hashes, so the app does not use a separate signing secret. Never publish credentials.

## Development commands

```sh
npm run dev       # Vite client + Express API
npm run seed      # Create demo accounts and sample listings
npm run lint      # ESLint
npm run build     # TypeScript project check + optimized client build
npm test          # API integration tests with an isolated in-memory database
npm start         # Run the API; in production it also serves dist/
```

## API overview

- Authentication: `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Properties: `GET /api/properties`, `GET /api/properties/:id`, `GET /api/properties/mine`, `POST /api/properties`, `PATCH /api/properties/:id`, `DELETE /api/properties/:id`
- Favourites: `GET /api/favourites`, `POST /api/favourites/:id`, `DELETE /api/favourites/:id`
- Inquiries: `POST /api/properties/:id/inquiries`, `GET /api/inquiries`, `PATCH /api/inquiries/:id`
- Admin: `GET /api/admin/users`, `GET /api/admin/properties`, `PATCH /api/admin/properties/:id/status`

The server enforces validation and ownership checks. Property deletion from a provider workspace and admin moderation deactivate records rather than permanently deleting them. Public listing responses omit provider email; interested seekers use the in-app inquiry workflow.

## Production build and deployment

```sh
npm ci
npm run seed
npm run build
NODE_ENV=production npm start
```

Deploy as a single Node web service with a persistent disk mounted for the SQLite path, configure environment variables in the hosting dashboard, and use HTTPS. The current API is single-instance oriented. For horizontal scaling, replace SQLite with managed Postgres/MySQL and sessions with a shared store. No map provider, listing feed, email/SMS service, payment service, or identity verification is configured.

## Project documentation

- [Requirements](docs/PROJECT_REQUIREMENTS.md)
- [Product specification](docs/PRODUCT_SPECIFICATION.md)
- [Technical architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [UI/UX research](docs/UI_UX_RESEARCH.md)
- [Implementation plan](docs/IMPLEMENTATION_PLAN.md)
- [Demo walkthrough](docs/DEMO_GUIDE.md)

## Known limitations

- Sample listings and account profiles are fictional; availability is not verified.
- Listing photos are fetched from Unsplash URLs and need an internet connection; replace with owned assets for a disconnected demo.
- Inquiries are stored in the app; no email, SMS, push notification, or reply composer is included.
- Map search, payments, AI recommendations, price prediction, seller verification, virtual tours and appointments remain future scope from the presentation.
- SQLite and local sessions are designed for a single-instance demo, not a horizontally scaled production marketplace.
