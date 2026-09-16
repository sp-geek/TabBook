# TabBook

TabBook is a restaurant table-booking platform. Diners search restaurants, pick
a time slot, choose a specific table on a visual floor plan, and pay a
per-guest booking fee online. Restaurant owners manage their own listings —
details, hours, pricing, photo gallery, floor plan, and incoming bookings —
from an owner dashboard.

## Features

**For diners**
- Browse restaurants, filter by location, cuisine, and price per guest
- See real available time slots for a given date
- Pick a table on an interactive floor plan (multiple areas/floors supported)
- Enter party size and optional notes (e.g. "window seat please")
- Pay online via Razorpay; price = restaurant's per-guest rate × guest count
- View and cancel upcoming bookings; cancelling ≥2 hours before the slot
  triggers an automatic refund

**For restaurant owners**
- List one or more restaurants under a single account
- Edit restaurant details (name, address, city, cuisine, description, hours,
  slot length, price per guest) at any time
- Upload and remove photos (stored on Cloudinary) for a gallery diners see on
  the restaurant page
- Build a floor plan: add tables, group them into areas, drag to position
- View all bookings for a restaurant, including customer name/email, guest
  count, notes, and payment status
- Delete a restaurant (soft delete — booking history is preserved)

## Tech stack

**Backend** — Node.js, Express 5, PostgreSQL via Prisma 8 (contract-based
schema/migrations), JWT auth, bcrypt, Razorpay (payments), Cloudinary +
Multer (image uploads)

**Frontend** — React 19, React Router, Vite, Axios, Konva/react-konva (the
draggable floor-plan canvas)

## Project structure

```
tabbook-backend/
  src/
    controllers/   # request handlers
    services/      # business logic, DB access
    routes/        # Express routers
    middleware/     # auth (JWT) middleware
    lib/            # Prisma client, Cloudinary, Razorpay singletons
    prisma/
      contract.prisma   # source of truth for the schema
      contract.json      # emitted contract (generated, do not edit)
  migrations/
    app/             # applied migration packages + refs
    snapshots/       # contract snapshots referenced by migrations

tabbook-frontend/
  src/
    api/          # axios calls to the backend, one file per resource
    pages/        # route-level pages (Discover, Restaurant detail, Owner dashboard, Bookings)
    components/   # shared components (e.g. TableCanvas floor-plan widget)
    context/      # auth context
```

## Getting started

### Prerequisites
- Node.js 18+
- A PostgreSQL database
- A Razorpay account (test mode is fine) for payments
- A Cloudinary account (free tier is fine) for photo uploads

### 1. Backend setup

```bash
cd tabbook-backend
npm install
```

Create a `.env` file in `tabbook-backend/`:

```env
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/tabbook
JWT_SECRET=some-long-random-string
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Apply the schema to your database:

```bash
npx prisma contract emit
npx prisma db update --db "$DATABASE_URL"
```

(`db update` reconciles the live database directly against the contract —
convenient for local development. For a tracked migration history instead,
use `npx prisma migration plan --name <name>` followed by
`npx prisma db migrate`.)

Start the server:

```bash
npm run dev
```

The API runs at `http://localhost:3000`. `GET /health` returns `{ status: 'ok' }`
once it's up.

### 2. Frontend setup

```bash
cd tabbook-frontend
npm install
npm run dev
```

Vite will print the local dev URL (typically `http://localhost:5173`). The
frontend expects the backend to be reachable — check `src/api/client.js` for
the base URL if you're not running the backend on `localhost:3000`.

## API overview

All routes are prefixed with `/api`. Routes marked 🔒 require a logged-in
user (`Authorization: Bearer <token>`); 🔒 OWNER also requires the `OWNER` role.

| Method | Path | Description |
|---|---|---|
| POST | `/auth/register` | Create an account (`CUSTOMER` or `OWNER`) |
| POST | `/auth/login` | Log in, returns a JWT |
| GET | `/restaurants` | List all active restaurants |
| GET | `/restaurants/:id` | Get one restaurant (tables, images included) |
| POST | `/restaurants` 🔒 OWNER | Create a restaurant |
| PATCH | `/restaurants/:id` 🔒 OWNER | Update a restaurant's details |
| DELETE | `/restaurants/:id` 🔒 OWNER | Soft-delete a restaurant |
| GET | `/restaurants/:id/bookings` 🔒 OWNER | List bookings for a restaurant (with customer info) |
| POST | `/restaurants/:id/images` 🔒 OWNER | Upload a photo (multipart, field `image`) |
| DELETE | `/restaurants/:id/images/:imageId` 🔒 OWNER | Remove a photo |
| GET | `/restaurants/:id/tables` | List a restaurant's tables |
| POST | `/restaurants/:id/tables` 🔒 OWNER | Add a table |
| PATCH | `/restaurants/:id/tables/:tableId/position` 🔒 OWNER | Move a table on the floor plan |
| GET | `/restaurants/:id/slots?date=YYYY-MM-DD` | Get available time slots for a date |
| POST | `/bookings` 🔒 | Create a booking (table, date, slot, guests, notes) |
| GET | `/bookings/mine` 🔒 | List the current user's bookings |
| GET | `/bookings/:id` 🔒 | Get one booking |
| PATCH | `/bookings/:id/cancel` 🔒 | Cancel a booking (refunds if ≥2h before slot) |
| POST | `/payments/create-order` 🔒 | Create a Razorpay order for a booking |
| POST | `/payments/verify` 🔒 | Verify a completed Razorpay payment |

## Data model notes

- **`Restaurant.bookingPrice`** is a **per-guest** rate, not a flat fee —
  the amount charged is `bookingPrice × guests`.
- **`Restaurant.isActive`** implements soft delete; deleted restaurants are
  filtered out of listings but their historical bookings/payments remain intact.
- An owner can list **multiple restaurants** — `Restaurant.ownerId` is a
  plain foreign key, not unique.
- **`RestaurantImage`** rows (`url`, `position`) back the photo gallery;
  images are hosted on Cloudinary.
- **`Booking.guests`** is validated server-side against the booked table's
  `capacity`.

## Schema changes

The database schema is managed through Prisma 8's contract workflow:

1. Edit `src/prisma/contract.prisma`
2. `npx prisma contract emit` — regenerate `contract.json`/`contract.d.ts`
3. `npx prisma migration plan --name <what-changed>` — review the generated
   diff before applying
4. `npx prisma db migrate` — apply it

For rapid local iteration, `npx prisma db update --db <url>` applies the
contract directly to the database without creating a migration package —
handy for a dev database, not recommended once a schema is shared or deployed.
