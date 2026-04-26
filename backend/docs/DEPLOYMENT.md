# Deployment Guide (On‑Prem + Cloud)

This document supplements `INSTALLATION.md` with operational deployment guidance for both on‑prem and cloud.

---

## On‑Prem (Windows + Linux)

### Hardware baseline
- 4 vCPU, 8–16 GB RAM, 100+ GB SSD
- Static IP on LAN

### Networking
- Expose `80/443` if using Nginx/IIS
- Or expose `3000` directly (not recommended)

### Process management
- Linux: `systemd`
- Windows: `NSSM`

### Backups
- Daily `pg_dump` to local disk + external copy
- Keep at least 7–14 days of backups
- Use repo scripts: `scripts/backup-postgres.sh` and `scripts/restore-postgres.sh`
- Validate restore into a non-production database every week

---

## Cloud (AWS/GCP/Azure)

### Minimal stack
- VM (Ubuntu 22.04)
- Postgres (managed DB preferred)
- Nginx reverse proxy
- SSL (Let’s Encrypt)

### Recommended layout
- API server: `api.hotel.example.com`
- Admin app (if any): `app.hotel.example.com`

### Security
- Restrict DB to VPC only
- Enable SSL certs
- Rotate JWT secrets periodically

### Monitoring
- Logs: `journald` or `pm2` logs
- Health checks: `/health` (optional endpoint)

---

## Zero‑Downtime Updates (Optional)
- Use `pm2` or `systemd` + `nginx` upstream swap
- Always run migrations before restart

---

## Database Maintenance
- Vacuum weekly
- Index monitoring for large tables

---

## Rollback Strategy
1. Roll back app to previous build
2. Revert migrations only if strictly necessary
3. Restore database snapshot if required
