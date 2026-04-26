# Startup Commands

This file gives the exact commands to run the PMS in both development and production-style local mode.

## Development

Run the full stack from the repo root:

```bash
npm run dev
```

This starts:
- backend in watch mode on `http://localhost:3000`
- UI dev server on `http://localhost:5173`

You can also run them separately:

```bash
npm run dev:backend
npm run dev:ui
```

## Production-Style Local Run

Build and start both backend and UI preview from the repo root:

```bash
npm run prod
```

This does:
1. build backend
2. build UI
3. start backend with `start:prod`
4. start UI with `vite preview`

Expected local URLs:
- backend: `http://localhost:3000`
- UI preview: `http://localhost:4173`

You can also run them separately:

```bash
npm run build
npm run prod:backend
npm run prod:ui
```

## Setup Commands

Demo data:

```bash
npm run setup:demo
```

Production tenant bootstrap:

```bash
npm run setup:production
```

Super user bootstrap:

```bash
npm run setup:super-user
```

## Database Commands

Run migrations:

```bash
npm --prefix backend run migration:run
```

Backup and restore:

```bash
npm run backup:db
npm run restore:db
```

## Notes

- `npm run prod` is a production-style local runner, not a full server deployment system.
- If port `3000` is already in use, stop the old backend or change `PORT` in `backend/.env`.
- If UI preview port `4173` is in use, stop the old preview process before rerunning `npm run prod`.
