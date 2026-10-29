# EstateHub implementation plan

## Milestones

1. **Understand and prepare (complete):** inspect all 13 PPT slides and embedded visuals; extract requirements; research product patterns and official framework/security docs; choose MVP and stack; initialize planning documents.
2. **Repository and foundation:** create GitHub repository; initialize local React/Vite + Express/SQLite project; add scripts, linting, env example, gitignore, schema and seed data; create tracking issues and feature branch.
3. **Discovery experience:** implement responsive home, search/filter/sort, cards and property detail API/UI; verify mobile/desktop and empty/error states.
4. **Accounts and seeker workflows:** implement sessions, signup/login/logout, favourites and inquiry submission/history with authorization.
5. **Provider/admin workflows:** implement listing create/edit/availability and inquiry management; admin moderation with role checks.
6. **Quality and documentation:** run unit/API/browser/build/lint checks; inspect browser rendering and major interactions; fix regressions; complete setup/demo README and screenshots/guide.
7. **GitHub integration:** issues linked to feature branches/commits/PRs; review diffs and checks; merge into `main` if repository rules permit; verify integrated build.

## Work items and acceptance checkpoints

- Project setup + docs: clean reproducible install/build, no secrets, accurate setup.
- API and data layer: schema constraints, seed process, request validation, errors, secure session/role checks.
- Property browsing: filters combine correctly, sort stable, detail fields complete.
- Seeker actions: auth required, favourites persist, inquiry visible only to authorized parties.
- Provider dashboard: CRUD ownership enforced, availability updates public search.
- Admin dashboard: admin-only list/review/deactivation; audit-friendly soft removal.
- QA: critical business/API tests and primary journeys; responsive/accessibility review; no claims without executed checks.

## Branch/issue strategy

No pre-existing local repository or branch convention exists. Use `main` as integration branch and short feature branches per independently deliverable feature. Create issues after repository initialization, with acceptance criteria and labels; assign to authenticated account `Bibek200619` when supported. Create a PR per substantial coherent milestone and merge only after checks and available protections are satisfied.

## Risks and unresolved choices

- GitHub connector has no repository-creation operation exposed; authenticated `gh` CLI is available and can create the requested public demo repository.
- Public vs private repository is unspecified. Public is the working assumption because this is a college demonstration and the user requested suitable visibility; do not include private or real personal data.
- Hosted deployment/database requires choosing a service and may incur cost; no paid provisioning is included without explicit user request.
- No real-estate inventory, map API, messaging gateway or identity verification credentials are available; seed data and in-app inquiries cover the MVP faithfully.
