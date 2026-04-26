# Backup and Recovery

This project now includes executable PostgreSQL backup and restore helpers in the repo-level `scripts/` directory.

## Files

- `scripts/backup-postgres.sh`: creates a compressed custom-format `pg_dump`, checksum, retention cleanup, and optional external copy.
- `scripts/restore-postgres.sh`: restores a `.dump` or `.dump.gz` backup into a target database with `pg_restore`.
- `scripts/backup-cron.example`: sample Linux cron entry for daily backups.

## Backup command

```bash
cd /path/to/hospitality-saas-core

BACKUP_DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/hospitality_prod' \
BACKUP_DIR='/var/backups/hospitality/postgres' \
EXTERNAL_COPY_DIR='/mnt/offsite/hospitality/postgres' \
RETENTION_DAYS='14' \
BACKUP_PREFIX='hospitality-prod' \
./scripts/backup-postgres.sh
```

## Restore command

```bash
cd /path/to/hospitality-saas-core

RESTORE_DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/hospitality_restore' \
./scripts/restore-postgres.sh /var/backups/hospitality/postgres/hospitality-prod-YYYYMMDDTHHMMSSZ.dump.gz
```

## Minimum production standard

1. Run automated backups daily.
2. Copy every backup off the application server.
3. Keep at least 14 daily backups.
4. Test restore into a non-production database every week.
5. Record restore validation in ops notes.

## What is protected

The PostgreSQL backup protects core hotel operational data, including:

- reservations
- guests
- rooms
- folios, invoices, and payments
- housekeeping and maintenance records
- rate/rms data
- audit logs
- report source data

## Important note

Reports in this system are generated from live PostgreSQL data. If the database is lost, daily report history is also lost unless backups are working and restorable.
