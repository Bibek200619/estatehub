# EstateHub demo walkthrough

## Before presenting

1. Run `npm ci`, copy `.env.example` to `.env`, then run `npm run seed` and `npm run dev`.
2. Open `http://localhost:5173` and confirm the listing photography has loaded.
3. Use the demo role accounts and the password configured in your local `.env`. Never commit or publish that password.

## Suggested 5-minute walkthrough

1. **Discovery:** search locations such as “Bellandur”, “Malleshwaram”, or “Devanahalli” to show the broader sample inventory.
2. **Comparison:** use property type, buy/rent and budget filters; point out standardized price, area, room and availability facts across apartments, houses, plots and commercial listings.
3. **Details:** open “Light-filled corner apartment,” browse the photo gallery and amenities, and show the sample-data disclosure.
4. **Seeker workflow:** sign in as Maya; save a home and send an inquiry. Show Saved homes and My inquiries in the dashboard.
5. **Provider workflow:** sign out and sign in as Arjun; open Received inquiries, mark the note read/responded, then create or edit a listing and change its availability.
6. **Admin workflow:** sign in as the admin; search listings by neighbourhood, add a listing and assign its owner, deactivate/restore another listing, and permanently delete a test listing after reviewing the confirmation. Public search hides deactivated/deleted listings.

## Reset the demonstration

Stop the application, remove `data/estatehub.sqlite`, `data/estatehub.sqlite-shm`, and `data/estatehub.sqlite-wal`, then run `npm run seed`. This resets user-created demo content and restores the full sample inventory.

## Presentation notes

- Explain that all addresses, people, prices and availability are examples for the project demonstration.
- The app does not validate legal ownership, provide a real property feed, or send inquiries outside its database.
- Responsive layout can be shown using a narrow browser window; search controls, cards, details and dashboards reflow for small screens.
