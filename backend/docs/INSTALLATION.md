# Installation Guide (On-Prem)

This guide covers on‑prem installation on Linux and Windows for the Hospitality SaaS backend.

## Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Git

Optional (Linux):
- Nginx for reverse proxy
- systemd for process management

Optional (Windows):
- NSSM (Non‑Sucking Service Manager) to run the API as a service

---

## 1) Clone & Install
```bash
git clone <your-repo-url>
cd hospitality-saas-core/backend
npm install
```

## 2) Configure Environment
Create or edit `.env` in `backend/`:
```
NODE_ENV=development
PORT=3000

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=master_db

DB_SYNCHRONIZE=false
DB_MIGRATIONS_RUN=true
DB_LOGGING=true

JWT_SECRET=super-secret-access-token
JWT_REFRESH_SECRET=super-secret-refresh-token
```

## 3) Create Database
### Linux (psql)
```bash
sudo -u postgres psql
CREATE DATABASE master_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE master_db TO postgres;
\q
```

### Windows (psql)
```powershell
psql -U postgres
CREATE DATABASE master_db;
CREATE USER postgres WITH PASSWORD 'postgres';
GRANT ALL PRIVILEGES ON DATABASE master_db TO postgres;
\q
```

## 4) Run Migrations
```bash
npm run migration:run
```

## 5) Seed Data (Optional)
```bash
npm run seed:all
```

## 6) Start API
### Development
```bash
npm run start:dev
```

### Production Build
```bash
npm run build
node dist/main.js
```

---

# Linux On‑Prem (Recommended)

## Reverse Proxy (Nginx)
Example Nginx config:
```nginx
server {
    listen 80;
    server_name hotel.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## systemd Service
Create `/etc/systemd/system/hotel-backend.service`:
```ini
[Unit]
Description=Hospitality SaaS Backend
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/hotel/hospitality-saas-core/backend
ExecStart=/usr/bin/node dist/main.js
Restart=always
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

Enable + start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable hotel-backend
sudo systemctl start hotel-backend
sudo systemctl status hotel-backend
```

---

# Windows On‑Prem

## Option A: Run in terminal (simple)
```powershell
npm run start:dev
```

## Option B: Run as a service (NSSM)
1. Install NSSM
2. Create service:
```powershell
nssm install hotel-backend
```
- Application: `C:\Program Files\nodejs\node.exe`
- Arguments: `dist\main.js`
- Startup directory: `C:\path\to\hospitality-saas-core\backend`

3. Start service:
```powershell
nssm start hotel-backend
```

---

# LAN Access
- Assign a static IP to the server.
- Allow port `3000` (or `80/443` if behind Nginx/IIS) on the firewall.
- Access from staff devices: `http://<server-ip>:3000`

---

# Notes
- Keep `DB_SYNCHRONIZE=false` in production.
- Always run migrations for schema changes.
- Backup Postgres daily.
