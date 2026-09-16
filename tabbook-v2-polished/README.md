# tabbook frontend (v2 — matched to real backend)

React + Vite + react-konva frontend, rebuilt from the uploaded v0 design to correctly
integrate with your actual Express/Prisma/Postgres backend.

## Setup

1. `npm install`
2. Confirm `.env` has `VITE_API_URL=http://localhost:3000`
3. Make sure your backend is running with `cors` enabled
4. `npm run dev` — opens on http://localhost:5173

## What changed vs. the uploaded v0 scaffold

- Fixed the slots endpoint to the real nested path: `/api/restaurants/:id/slots?date=...`
- Booking creation now sends `{tableId, date, slotStart, slotEnd}` instead of `{restaurantId, date, time, guests}` — your backend books a specific table, not a generic party size
- Added the visual floor plan (react-konva) and table selection — this was completely missing before, and it's your project's core feature
- Added area/floor support (Main Floor, Open Roof, etc.) with tabs, matching the `area` field you just added to your backend
- Real, functional owner dashboard (create restaurant, add tables, drag floor plan) — replacing the old hardcoded fake stats
- Real Razorpay payment flow wired into the booking flow, with automatic hold-release if payment is cancelled
- Real "My Bookings" list with cancel buttons, replacing the placeholder text

## Design

Kept the visual language from the uploaded scaffold: coral (#ff654d) accent, dark charcoal
(#1d2723), warm off-white background, Space Grotesk display type + DM Sans body type.
