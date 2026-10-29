# EstateHub implementation plan

## Milestones

1. **Understand and prepare (complete):** inspect all 13 PPT slides and embedded visuals; extract requirements; research product patterns, React/Express guidance and WCAG; choose MVP and stack; initialize planning documents.
2. **Repository and foundation (complete):** public `Bibek200619/estatehub` repository created; local React/Vite + Express/SQLite project initialized; scripts, environment example, gitignore, schema, seed data and GitHub issue tracking are in place.
3. **Discovery experience (complete):** responsive home, search/filter/sort, cards and property detail API/UI implemented; browser search and details verified.
4. **Accounts and seeker workflows (complete):** persisted sessions, register/login/logout, favourites and inquiry submission/history with authorization implemented and API tested.
5. **Provider/admin workflows (complete):** listing create/edit/availability, inquiry management and admin moderation implemented; provider form and dashboard verified in browser.
6. **Quality and documentation (complete):** API integration tests, lint, TypeScript/build, npm audit and browser workflows executed; README and demo guide written. Visual inspection covered a narrow mobile viewport; dedicated WCAG conformance and multiple desktop viewport testing remain follow-up checks.
7. **GitHub integration (in progress):** push the implementation branch, open an issue-linked PR, inspect checks/protections, merge into `main` if permitted, and verify the integrated result.

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
