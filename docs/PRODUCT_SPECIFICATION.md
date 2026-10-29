# EstateHub product specification

## Product vision

A calm, trustworthy-feeling property marketplace that helps first-time buyers and renters compare homes without juggling scattered sources, while giving owners and agents a straightforward listing and inquiry workspace.

## Experience principles

1. **Make comparison easy:** keep price, location, type, area, rooms and availability in consistent positions.
2. **Search first:** filters are obvious, editable and preserve context between results and details.
3. **Trust through clarity:** display update time, complete fields and demo-data notice; never imply verification that did not happen.
4. **One journey per role:** seeker: search → compare → save → inquire; provider: publish → update → manage inquiries; admin: review → deactivate.
5. **Quiet visual confidence:** editorial typography, warm off-white surfaces, deep evergreen ink and restrained copper accents; use photography to identify listings rather than decoration.

## Core journeys

### Seeker

1. Browse featured listings or open all properties.
2. Set location, buy/rent, property category, budget and bedroom filters.
3. Compare consistent result cards and open a detail page.
4. Sign in/register when saving or contacting; return to the selected property after auth.
5. Save/unsave; send an inquiry with a message; find sent inquiries and favourites in dashboard.

### Provider

1. Register/sign in.
2. Open “My listings”; create a listing with required fields and photo URLs/assets.
3. Preview and publish; edit details or mark unavailable.
4. Review inquiries received on owned listings and update inquiry status.

### Administrator

1. Sign in using a seeded/admin-configured account.
2. Search/filter the expanded listing inventory by title, location, owner and status.
3. Add a listing, assign it to an existing account, and publish it into public search.
4. Deactivate a listing for reversible moderation or permanently delete it with dependent favourites and inquiries after explicit confirmation.

## MVP screens

- Home/search landing page with search controls, featured records and clear entry to listings.
- Search results with filters, active-filter chips, sort, count and empty state.
- Property detail with gallery, essential facts, amenities, provider and inquiry CTA.
- Sign in/register with validation and accessible feedback.
- Seeker dashboard for favourites and sent inquiries.
- Provider dashboard for listing CRUD and received inquiries.
- Admin moderation view.

## Out of scope

Map/geo search, external listing feeds, payments, recommendations, price prediction, verification badges, virtual tours, appointments, production email/SMS, and multi-tenant agency tools.

## Product decisions

- Sample inventory: fictional Bengaluru properties priced in INR.
- Buy/rent and residential/commercial/plot categories share one filterable catalogue.
- Public visitors can browse; authentication is required for favourites, inquiries and listing management.
- Provider is a capability rather than an exclusive role; admin privileges are controlled separately.
- Availability states: available, pending, unavailable. Deactivated admin records are hidden from public search.
