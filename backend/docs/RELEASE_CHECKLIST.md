# Production Release Checklist

Use this checklist before shipping a hotel instance.

## 1. Build and verification

- `npm --prefix backend run build`
- `npm --prefix ui run build`
- Confirm critical routes load for:
  - `SUPER_USER`
  - `ADMIN`
  - `MANAGER`
  - `STAFF`

## 2. Data protection

- Run a real database backup before migration:

```bash
BACKUP_DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/hospitality_prod' \
BACKUP_DIR='/var/backups/hospitality/postgres' \
EXTERNAL_COPY_DIR='/mnt/offsite/hospitality/postgres' \
RETENTION_DAYS='14' \
BACKUP_PREFIX='hospitality-prod' \
npm run backup:db
```

- Confirm off-server copy exists
- Confirm one restore drill has been completed recently

## 3. Database rollout

- Run migrations in production
- Confirm tenant/module setup is correct
- Seed only production-safe baseline data if needed

## 4. Access and role checks

- `SUPER_USER` can log in and sees all software controls
- `ADMIN` can manage hotel setup and users
- `MANAGER` cannot act as software owner
- Front desk `STAFF` lands on front-office dashboard without finance `403` errors

## 5. Module smoke tests

### Front Office
- Login works
- Dashboard loads
- Reservation create/update works
- Check-in works
- Check-out works
- Room board loads

### Guests and Billing
- Guest profile opens
- Folio loads for active stay
- Payment posting works
- Invoice generation works

### Housekeeping and Maintenance
- Housekeeping board loads
- Maintenance board loads
- Room status transitions behave correctly

### Imports
- Restaurant CSV import works
- Coffee shop CSV import works
- Bar CSV import works

### Reports and Finance
- Finance dashboard loads for finance-capable users
- KPI report works
- Revenue data loads

## 6. Backup scheduler

- Install cron from `scripts/backup-cron.example`
- Confirm next scheduled execution time
- Confirm backup log path exists

## 7. Go-live handoff

- Share role model with hotel team
- Store `SUPER_USER` credentials with IT/owner only
- Hand hotel `ADMIN` credentials to authorized property admin
- Create GM as `MANAGER`
- Archive release notes

## 8. Release decision

Ship only if:
- builds pass
- backup is real
- restore path is known
- role access behaves correctly
- front office dashboard is clean for staff users
