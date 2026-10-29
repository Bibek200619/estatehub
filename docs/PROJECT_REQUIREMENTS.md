# EstateHub project requirements

## Source and interpretation

Primary source: `EstateHub_College_Template_Final_Aligned_Animated.pptx` (13 slides, supplied by the user). The deck describes product goals and an illustrative technology plan. It contains no embedded instructions that supersede the user's request; its images and diagrams are product references, not interface specifications to reproduce literally.

## Problem and users

Property information is scattered across agents, advertisements, social posts and portals. Buyers and renters spend time finding and comparing incomplete or stale records; owners, sellers and agents need a simple way to publish listings and follow inquiries. EstateHub connects seekers and providers through structured property information and a consistent search-to-inquiry flow.

Primary users: buyers, renters, property owners/sellers/agents, and administrators.

## Product outcomes

- Discover properties from one searchable catalogue using location, budget, type and basic requirements.
- Show comparable, complete listing information: price, location, category, area, rooms, images, amenities, availability and contact route.
- Let seekers save favourites and submit inquiries, with inquiry records available to the relevant parties.
- Let providers create, edit, publish/unpublish and manage their property listings.
- Give administrators controls to review users/listings, create listings for an existing owner, deactivate/restore records, and permanently delete inappropriate or outdated listings.

## MVP requirements mapped to implementation

| ID | Requirement from deck | Acceptance criteria | Implementation area |
|---|---|---|---|
| R1 | Register/login; store per-user activity | Account creation and login validate input; session is persisted securely; logout works | `server/auth`, Users schema, auth UI |
| R2 | Property discovery and filters | Search by location, price range, category, transaction, bedrooms and availability; empty state; sort results | `server/properties`, search UI |
| R3 | Detailed property page | Images, description, price, type, address/location, area, rooms, amenities, availability and provider contact are visible | property detail UI/API |
| R4 | Listing management | Authenticated provider can create/edit their own listing and change availability; unauthorized edits are rejected | provider dashboard, property API |
| R5 | Favourites | Signed-in user can add/remove a property and revisit saved properties | favourites API/schema/UI |
| R6 | Inquiries | Signed-in seeker can send a validated message; provider can read inquiry records for own listings; states distinguish new/read/responded | inquiry API/schema/dashboard |
| R7 | Admin control | Admin can review listing/user records and deactivate/remove inappropriate listings | admin API/UI and role guard |
| R8 | Three-tier separation | React presentation calls Express JSON API; validated application logic persists through relational data store | architecture/folders |
| R9 | Demo-ready usability | Responsive, keyboard-usable search, listing, details, account and dashboard flows; loading/error/empty/success states | client design system + QA |

## MVP versus later

**MVP:** authentication and roles; seeded sample inventory; search/filter/sort; details; provider listing CRUD; favourites; inquiry submission and management; minimal admin moderation; responsive accessible interface; local setup and reproducible seed data.

**Deferred:** map search, online payments, AI recommendations, price prediction, seller verification, virtual tours, appointment booking and automated alerts. These appear as future scope or extensions in the deck, not core MVP workflows.

## Assumptions and uncertainty log

- The deck leaves MySQL versus MongoDB open. Use SQLite for a zero-service college demo; normalized relations fit Users, Properties, Favourites and Inquiries. Keep repository interfaces replaceable if a hosted database is later required.
- Use Bengaluru and INR for fictional seed records because the deck does not specify geography/currency. All seeded properties and contact details are illustrative, not real offers.
- Any account can act as seeker and provider; role `admin` is assigned only through seed/configuration, never public registration.
- Images use bundled or stable public demo assets. No geocoding, MLS/real inventory feed, email delivery, identity verification or legal-status guarantee is implied.
- Inquiry messaging is an in-app record, not an email/SMS relay.
- Admin removal is implemented as soft deactivation for auditability.

## Risks and mitigations

- **Stale/misleading records:** show availability and update dates; seed demo data clearly; admin can deactivate records. No real verification is promised.
- **Account security:** hash passwords, validate server-side, use secure HTTP-only SameSite session cookies, CSRF-aware same-origin behavior, rate-limit auth, and role-check every protected endpoint.
- **Privacy:** minimize collected personal data; expose provider contact only on a public listing; inquiries are visible only to sender, listing owner, and admin.
- **External dependencies:** no paid data or map services for MVP; local SQLite and seed script keep demo reproducible.

## Deck coverage

Slides 1–4 establish the product and search/filter/details/contact/manage journey; slide 5 suggests frontend/backend/database tools; slide 6 identifies scattered records, stale listings, difficult comparison, and slow communication; slide 7 states discovery, information clarity, owner listings and admin control; slide 8 describes common portal patterns and cleaner/comparable records as the gap; slide 9 defines seeker and provider workflows; slides 10–11 define three tiers and UI→API→database data flow; slide 12 names Users, Properties, Favourites and Inquiries; slide 13 lists future enhancements. The embedded imagery is illustrative, not a requirement to clone the depicted UI.
