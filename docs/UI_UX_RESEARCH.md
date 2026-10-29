# UI/UX research and design direction

## Research reviewed (29 Oct 2026)

- Zillow's advanced search guidance describes narrowing by property type and feature, saving homes/searches, and comparing saved homes. This supports visible, grouped filters and a clear saved-properties workflow. [Zillow: Advanced search techniques](https://www.zillow.com/learn/zillow-advanced-search/)
- React's current documentation describes component-based UI and state-driven interaction; this fits reusable property cards, filters, and role dashboards. [React Quick Start](https://react.dev/learn)
- React recommends starting new apps with an appropriate framework and notes Create React App is deprecated; Vite is selected as a lean build tool for this client-rendered, same-origin college app. [React: Creating a React App](https://react.dev/learn/creating-a-react-app)
- Express production guidance emphasizes TLS, input validation, Helmet, secure sessions, dependency hygiene and limiting brute-force authorization attempts. These inform server defaults. [Express security best practices](https://expressjs.com/advanced/best-practice-security/)

## Competitive patterns to use carefully

Real-estate portals commonly combine a strong location search, budget/type filters, image-led cards, saved homes and a detail-to-contact action. EstateHub adopts these tested patterns without copying any portal's visual layout. It simplifies comparison for first-time buyers/renters with consistent listing facts and a smaller filter set. Map pins, alerts and data-rich recommendations are deferred.

## Original design system

- **Identity:** EstateHub; warm, grounded and organized. Evergreen `#173B35`, warm ivory `#F7F5F0`, clean white cards, copper `#B77945`, slate text and semantic green/amber/red states.
- **Typography:** readable humanist sans for UI (e.g. Inter/Manrope), restrained editorial serif for major property headlines; numerals use tabular figures.
- **Layout:** 8px spacing rhythm, 12-column desktop grid, content max width around 1280px, 3/2/1 card columns at desktop/tablet/mobile. Search controls collapse to a filter sheet on narrow screens.
- **Components:** compact navigation, filter bar and chips, property card with photo/price/status/facts/save action, labeled forms, inline validation, confirmation dialog for destructive actions, skeletons, empty/error states, toast feedback.
- **Interaction:** visible keyboard focus, semantic landmarks, reduced-motion support, no hover-only actions, controls sized for touch. Subtle transitions only for state feedback.
- **Accessibility:** labels and errors programmatically associated; heading order; keyboard-operable filters/dialogs; meaningful image alt text; adequate contrast; status not communicated by color alone; respect `prefers-reduced-motion`.

## Opportunities specific to EstateHub

- Show “last updated”/availability and disclose that seeded records are examples, addressing trust concerns without falsely claiming verification.
- Let a seeker save from both cards and details; return them to intended action after sign-in.
- Use the same fact order on cards and detail pages to make comparison effortless.
- Give providers one dashboard for listings and inquiries rather than splitting a simple MVP into separate products.
