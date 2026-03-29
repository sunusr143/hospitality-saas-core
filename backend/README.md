# Hospitality SaaS Backend

Backend API for a hotel management SaaS platform built with NestJS.

## Tech Stack
- NestJS
- TypeScript
- PostgreSQL
- TypeORM
- JWT + RBAC

## Local Development

```bash
npm install
npm run start:dev
```

## Quality Gates

```bash
npm run build
npm test -- --runInBand
npm run test:e2e -- --runInBand
npm run test:ci
```

## Real API E2E (Dedicated Test DB)

The `test:e2e:api` suite boots `AppModule` and runs:
`reservation -> checkout -> folio -> payment -> invoice`.

Required environment variables:
- `TEST_DB_HOST`
- `TEST_DB_PORT`
- `TEST_DB_USERNAME`
- `TEST_DB_PASSWORD`
- `TEST_DB_NAME`

Run:

```bash
npm run test:e2e:api
```
