# Demo Run

The main entrypoint is now one command:

```bash
npm run demo
```

That command prepares the environment and starts the demo stack.

## Windows

1. Double-click `start.cmd`

## Linux/macOS

1. Run `./start.sh`

## What it does

- creates missing env files
- installs dependencies in the root, `backend/`, and `ui/` when missing
- checks that PostgreSQL is reachable
- creates `backend/.env` from `backend/.env.example` if needed
- creates `ui/.env.local` pointing the UI to `http://localhost:3000`
- runs backend migrations
- creates a demo tenant, demo users, rooms, reservations, and folio data
- validates the backend build
- starts backend and UI together

## Demo login

- `admin@sunu.com` / `admin123`
- `staff@sunu.com` / `staff1234`

## Notes

- PostgreSQL still needs to be installed and reachable using the values in `backend/.env`
- the billing demo is seeded with a closed folio so you can test payments and invoice generation immediately
- if you only want setup without starting the servers, run `npm run demo:setup`
- for hotel food-item masters, use the `Imports` page and start from [demo-restaurant-items.csv](/home/sunu/hotel/hospitality-saas-core/demo-restaurant-items.csv)

## Production Mode

Use production mode when you want a clean hotel setup without demo users, demo text, or seeded fake reservations.

Backend `.env`:

```env
APP_MODE=production
PRODUCTION_TENANT_CODE=HOTEL_MAIN
PRODUCTION_TENANT_NAME=Hotel Main
PRODUCTION_SOFTWARE_NAME=Hospitality
PRODUCTION_ADMIN_EMAIL=admin@hotel.local
PRODUCTION_ADMIN_PASSWORD=ChangeMe123!
PRODUCTION_DELUXE_ROOMS=10
PRODUCTION_SUITE_ROOMS=2
```

UI `.env.local`:

```env
VITE_API_BASE=http://localhost:3000
VITE_APP_MODE=production
```

Then run:

```bash
cd backend
npm run migration:run
npm run setup:production

cd ..
npm run dev
```

That will create:
- one real tenant/hotel
- one real admin user
- a base room layout using the configured deluxe/suite counts
