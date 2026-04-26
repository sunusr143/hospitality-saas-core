# Hospitality SaaS Core - Operations Runbook

**Version:** 1.0  
**Last Updated:** March 30, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Prerequisites & Requirements](#prerequisites--requirements)
2. [Quick Start Guide](#quick-start-guide)
3. [Installation & Setup](#installation--setup)
4. [Starting the Application](#starting-the-application)
5. [Database Setup & Migrations](#database-setup--migrations)
6. [Seeding Data](#seeding-data)
7. [Running Tests](#running-tests)
8. [Common Commands Reference](#common-commands-reference)
9. [Troubleshooting Guide](#troubleshooting-guide)
10. [Monitoring & Logs](#monitoring--logs)
11. [Production Deployment](#production-deployment)
12. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites & Requirements

### System Requirements

- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher (or yarn v3.0+)
- **PostgreSQL:** v13.0 or higher
- **Git:** v2.25.0 or higher
- **RAM:** Minimum 4GB (8GB recommended)
- **Disk Space:** At least 2GB free

### Environment Setup

Ensure you have the following installed and accessible:

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check PostgreSQL version
psql --version

# Check Git version
git --version
```

### Database Connectivity

PostgreSQL must be running and accessible:

```bash
# Test PostgreSQL connection
psql -h localhost -p 5432 -U postgres -c "SELECT version();"
```

### Port Requirements

The application requires the following ports to be available:

| Port | Service | Usage |
|------|---------|-------|
| 3000 | NestJS API | Main application server |
| 3001 | Hot Reload | Development mode (optional) |
| 5432 | PostgreSQL | Database |
| 6379 | Redis | Caching (optional, for production) |

---

## Quick Start Guide

For experienced developers, here's the fastest way to get running:

```bash
# 1. Clone repository
git clone https://github.com/sunusr143/hospitality-saas-core.git
cd hospitality-saas-core

# 2. Install dependencies
npm install

# 3. Setup environment
cp backend/.env.example backend/.env
cp ui/.env.example ui/.env

# 4. Configure database (edit backend/.env)
# Set: DATABASE_URL=postgresql://user:password@localhost:5432/hospitality_dev

# 5. Run database migrations
cd backend
npm run typeorm:migration:run

# 6. Start backend (terminal 1)
npm run start:dev

# 7. Start frontend (terminal 2)
cd ui
npm run dev

# 8. Access application
# Backend:  http://localhost:3000
# Frontend: http://localhost:5173
```

---

## Installation & Setup

### Step 1: Clone the Repository

```bash
git clone https://github.com/sunusr143/hospitality-saas-core.git
cd hospitality-saas-core
```

### Step 2: Install Dependencies

#### Backend Dependencies

```bash
cd backend
npm install
```

**Expected output:** Should complete without errors. Check for any warnings about missing peer dependencies.

#### Frontend Dependencies

```bash
cd ../ui
npm install
```

### Step 3: Environment Configuration

#### Backend Configuration

```bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env with your settings
nano .env
```

**Required environment variables:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/hospitality_dev
DATABASE_LOGGING=true

# JWT
JWT_SECRET=your-secret-key-here-min-32-chars
JWT_EXPIRATION=24h

# Application
NODE_ENV=development
APP_PORT=3000
APP_NAME=Hospitality SaaS

# SMTP (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@hospitality.com

# Optional: Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

#### Frontend Configuration

```bash
cd ../ui

# Copy environment template
cp .env.example .env

# Edit if needed
nano .env
```

**Frontend environment variables:**

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Hospitality SaaS
```

### Step 4: Create Database

```bash
# As PostgreSQL user
psql -U postgres

# In psql prompt:
CREATE DATABASE hospitality_dev;
CREATE USER hospitality_user WITH PASSWORD 'your-password';
GRANT ALL PRIVILEGES ON DATABASE hospitality_dev TO hospitality_user;
\q
```

### Step 5: Run Migrations

```bash
cd backend

# Run all pending migrations
npm run typeorm:migration:run

# Verify migration success
npm run typeorm:migration:show
```

### Step 6: Bootstrap the Platform Super User

Run the hotel/property setup first, then create the platform-level `SUPER_USER`.

```bash
# 1. Initialize or refresh the production tenant/admin
npm run setup:production

# 2. Create or update the platform super user
npm run setup:super-user
```

These setup commands now run when explicitly invoked, even if `APP_MODE` is currently `demo`.

Required backend `.env` values for the super user:

```env
SUPER_USER_TENANT_CODE=HOTEL_MAIN
SUPER_USER_EMAIL=it-owner@hotel.local
SUPER_USER_PASSWORD=ChangeThisSuperUser123!
SUPER_USER_NAME=Platform Super User
SUPER_USER_TITLE=Platform Owner
```

After the first login, go to Hotel Settings and configure Super User Recovery with:
- two security questions
- one separate recovery key stored in your password manager

---

## Starting the Application

### Development Mode (Recommended for Development)

#### Terminal 1: Start Backend

```bash
cd backend

# Start with file watching (autorefresh on code changes)
npm run start:dev

# Expected output:
# [Nest] PID - 03/30/2026, 10:15:30 AM   LOG [NestFactory] Starting Nest application...
# [Nest] PID - 03/30/2026, 10:15:32 AM   LOG [InstanceLoader] TypeOrmModule dependencies initialized...
# [Nest] PID - 03/30/2026, 10:15:33 AM   LOG [RoutesResolver] AppController {/}:
# [Nest] PID - 03/30/2026, 10:15:33 AM   LOG [NestApplication] Nest application successfully started +2ms
```

For demo data refresh from the repo root:

```bash
npm run setup:demo
```

#### Terminal 2: Start Frontend

```bash
cd ui

# Start Vite dev server
npm run dev

# Expected output:
# VITE v4.x.x  ready in xxx ms
# ➜  Local:   http://localhost:5173/
# ➜  press h to show help
```

#### Access Application

- **Backend API:** http://localhost:3000
- **Frontend UI:** http://localhost:5173
- **API Documentation:** http://localhost:3000/api/docs

---

### Production Mode

#### Build for Production

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../ui
npm run build

# Expected output:
# dist/ - Production-ready files
```

#### Start Production Server

```bash
# Backend (production)
cd backend
NODE_ENV=production npm run start

# Frontend (serve built files)
cd ../ui
npm run preview
```

---

## Database Setup & Migrations

### Creating Migrations

After modifying entities, create a new migration:

```bash
cd backend

# Generate migration from entities
npm run typeorm:migration:generate src/database/migrations/YourMigrationName

# Example:
npm run typeorm:migration:generate src/database/migrations/AddNewFeature
```

### Applying Migrations

```bash
cd backend

# Run all pending migrations
npm run typeorm:migration:run

# Revert last migration
npm run typeorm:migration:revert

# Show migration status
npm run typeorm:migration:show
```

### Database Health Check

```bash
# Check database connection
npm run typeorm:query "SELECT NOW();"

# List all tables
npm run typeorm:query "\dt"

# Check migration status
npm run typeorm:migration:show
```

---

## Seeding Data

### Available Seed Scripts

#### 1. Demo Seed (Sample Data)

```bash
cd backend

# Load demo data (5 tenants, 20+ rooms, sample rates)
npx ts-node src/scripts/seed.ts

# Expected output:
# ✓ Created tenant: DEMO
# ✓ Created 20 rooms...
# ✓ Seeded 45 restaurant items...
# ✓ Seeded 20 bar items...
# ✓ Demo seed completed successfully!
```

#### 2. Production Seed (Production Templates)

```bash
cd backend

# Load production-grade templates (rate plans, menus, corporate accounts)
npx ts-node src/scripts/seed-production.ts

# Expected output:
# ✓ Created rate plan: BAR_WINTER...
# ✓ Created rate plan: BAR_SUMMER...
# ✓ Seeded 45 items in Appetizers...
# ✓ Created corporate account: TechCorp India...
# ✅ Production seed completed successfully!
```

#### 3. Setup for Development

```bash
cd backend

# Full development setup (entities + demo data)
npx ts-node src/scripts/setup.ts

# Expected output:
# Setting up development environment...
# Creating entities...
# Seeding demo data...
# Setup completed successfully!
```

### Seed Script Reference

| Script | Purpose | When to Use |
|--------|---------|------------|
| seed.ts | Demo/sample data | Development, testing |
| seed-production.ts | Production templates | Production setup, reference data |
| setup-demo.ts | Full demo environment | Initial setup |
| setup-production.ts | Production environment | Production deployment |

---

## Running Tests

### Unit Tests

```bash
cd backend

# Run all unit tests
npm run test

# Run tests in watch mode (for development)
npm run test:watch

# Run specific test file
npm run test -- src/modules/reservations/reservations.service.spec.ts

# Generate coverage report
npm run test:cov
```

### Integration Tests

```bash
cd backend

# Run integration tests
npm run test:integration

# Watch mode for integration tests
npm run test:integration -- --watch
```

### E2E Tests

```bash
cd backend

# Run all E2E tests
npm run test:e2e

# Run specific E2E test suite
npm run test:e2e critical-flows.e2e-spec.ts

# Run with detailed verbose output
npm run test:e2e -- --verbose

# Generate coverage
npm run test:e2e -- --coverage
```

### Test Results Interpretation

```
PASS   src/modules/reservations/reservations.service.spec.ts
PASS   src/modules/folios/folios.service.spec.ts
----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |   85.2  |   79.3   |   88.5  |   84.9  |
----------|---------|----------|---------|---------|-------------------

Tests:      15 passed, 15 total
Snapshots:  0 total
Time:       5.234 s
```

---

## Common Commands Reference

### Development Commands

```bash
# Install dependencies
npm install

# Start development server (backend)
npm run start:dev

# Start frontend dev server
npm run dev

# Build application
npm run build

# Lint code
npm run lint

# Format code
npm run format

# Run type checking
npm run typecheck
```

### Database Commands

```bash
# Run migrations
npm run typeorm:migration:run

# Revert last migration
npm run typeorm:migration:revert

# Generate migration from entities
npm run typeorm:migration:generate src/database/migrations/MigrationName

# Show migration status
npm run typeorm:migration:show

# Synchronize database schema (development only!)
npm run typeorm:schema:sync
```

### Seed Commands

```bash
# Seed demo data
cd backend && npx ts-node src/scripts/seed.ts

# Seed production templates
cd backend && npx ts-node src/scripts/seed-production.ts

# Full development setup
cd backend && npx ts-node src/scripts/setup-demo.ts
```

### Test Commands

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Generate coverage report
npm run test:cov
```

### Utility Commands

```bash
# Check application health
curl http://localhost:3000/health

# View API documentation
curl http://localhost:3000/api/docs

# Check database connection
cd backend && npm run typeorm:query "SELECT 1"

# View application logs
tail -f logs/application.log

# Clear build output
npm run clean

# Fresh install
rm -rf node_modules package-lock.json && npm install
```

---

## Troubleshooting Guide

### Problem: Application Won't Start

#### Issue: "Port 3000 already in use"

**Diagnosis:**
```bash
# Find process using port 3000
lsof -i :3000
# or
netstat -tulpn | grep 3000
```

**Solution Option 1: Kill the process**
```bash
# Kill process on port 3000
kill -9 <PID>

# Or use the app's kill script
npm run stop
```

**Solution Option 2: Use different port**
```bash
# Start on different port
PORT=3001 npm run start:dev
```

#### Issue: "Module not found" error

**Diagnosis:**
```bash
# Check if node_modules exists
ls -la node_modules

# Check for missing dependencies
npm ls

# Check for broken links
npm audit
```

**Solution: Reinstall dependencies**
```bash
# Remove old dependencies
rm -rf node_modules
rm package-lock.json

# Reinstall
npm install

# Verify installation
npm ls
```

#### Issue: "Cannot find module '@nestjs/core'"

**Diagnosis:**
```bash
# Check if dependencies are installed
npm ls @nestjs/core

# Check package.json
cat package.json | grep @nestjs
```

**Solution:**
```bash
# Reinstall all dependencies
npm ci

# Or specific package
npm install @nestjs/core
```

---

### Problem: Database Connection Issues

#### Issue: "ECONNREFUSED: Connection refused"

**Diagnosis:**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -p 5432 -U postgres

# Check environment variables
echo $DATABASE_URL
```

**Solution Option 1: Start PostgreSQL**
```bash
# On Linux
sudo systemctl start postgresql

# On macOS
brew services start postgresql

# On Windows (PowerShell as admin)
Start-Service -Name PostgreSQL
```

**Solution Option 2: Verify connection string**
```bash
# Edit backend/.env
DATABASE_URL=postgresql://user:password@host:port/database

# Example:
DATABASE_URL=postgresql://hospitality_user:password@localhost:5432/hospitality_dev

# Test connection
psql $DATABASE_URL -c "SELECT 1"
```

#### Issue: "FATAL: database does not exist"

**Diagnosis:**
```bash
# List all databases
psql -U postgres -l

# Check if hospitality_dev exists
psql -U postgres -l | grep hospitality_dev
```

**Solution: Create database**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE hospitality_dev;

# Create user
CREATE USER hospitality_user WITH PASSWORD 'your-password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hospitality_dev TO hospitality_user;

# Exit
\q
```

#### Issue: "FATAL: role does not exist"

**Diagnosis:**
```bash
# List all users/roles
psql -U postgres -c "\du"

# Check if user exists
psql -U postgres -c "\du" | grep hospitality_user
```

**Solution: Create user role**
```bash
# Connect as postgres
psql -U postgres

# Create user
CREATE USER hospitality_user WITH PASSWORD 'your-password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE hospitality_dev TO hospitality_user;

# Exit
\q

# Test new user
psql -U hospitality_user -d hospitality_dev -c "SELECT 1"
```

---

### Problem: Migrations Failing

#### Issue: "Migration failed: syntax error in migration"

**Diagnosis:**
```bash
# Check migration files
ls -la src/database/migrations/

# Check latest migration
cat src/database/migrations/[latest].ts

# Check migration status
npm run typeorm:migration:show
```

**Solution:**
```bash
# Revert last migration
npm run typeorm:migration:revert

# Fix the migration file
nano src/database/migrations/[migration-name].ts

# Run again
npm run typeorm:migration:run
```

#### Issue: "Cannot execute migration: column does not exist"

**Diagnosis:**
```bash
# Check table structure
npm run typeorm:query "SELECT column_name FROM information_schema.columns WHERE table_name = 'your_table';"

# Check migration order
npm run typeorm:migration:show
```

**Solution Option 1: Manual fix**
```bash
# Connect to database
psql -U hospitality_user -d hospitality_dev

# Check table
\d table_name

# Manually add missing column (if needed)
ALTER TABLE table_name ADD COLUMN column_name type;

# Exit
\q

# Retry migration
npm run typeorm:migration:run
```

**Solution Option 2: Recreate migrations**
```bash
# Revert all migrations
npm run typeorm:migration:revert

# Run migrations again
npm run typeorm:migration:run
```

---

### Problem: Tests Failing

#### Issue: "Jest: Cannot find test files"

**Diagnosis:**
```bash
# Check test file locations
find . -name "*.spec.ts"

# Check jest configuration
cat jest.config.js
```

**Solution:**
```bash
# Build first
npm run build

# Then run tests
npm run test

# Or run with verbose output
npm run test -- --verbose
```

#### Issue: "Test database connection failed"

**Diagnosis:**
```bash
# Check test database settings
cat jest-e2e.json | grep database

# Check environment
echo $DATABASE_TEST_URL
```

**Solution:**
```bash
# Create test database
psql -U postgres -c "CREATE DATABASE hospitality_test;"

# Update .env.test
DATABASE_URL=postgresql://user:password@localhost:5432/hospitality_test

# Run migrations on test database
npm run typeorm:migration:run

# Run tests
npm run test:e2e
```

---

### Problem: TypeScript Compilation Errors

#### Issue: "TS2304: Cannot find name 'SomeClass'"

**Diagnosis:**
```bash
# Check if import exists
grep -r "SomeClass" src/

# Check type definitions
npm ls @types/node
```

**Solution:**
```bash
# Install missing types
npm install --save-dev @types/node

# Clear build cache
rm -rf dist/

# Rebuild
npm run build

# Check for errors
npx tsc --noEmit
```

#### Issue: "TS7016: Could not find a declaration file"

**Diagnosis:**
```bash
# Check for .d.ts files
find . -name "*.d.ts"

# Check tsconfig
cat tsconfig.json | grep declaration
```

**Solution:**
```bash
# Install types for package
npm install --save-dev @types/package-name

# Or generate declaration file
npx tsc --declaration

# Rebuild
npm run build
```

---

### Problem: Seed Data Issues

#### Issue: "Seed script fails with foreign key constraint error"

**Diagnosis:**
```bash
# Check if tables exist
npm run typeorm:query "\dt"

# Check constraints
npm run typeorm:query "SELECT constraint_name FROM information_schema.table_constraints WHERE table_name = 'table_name';"
```

**Solution:**
```bash
# Run migrations first
npm run typeorm:migration:run

# Then run seed
cd backend && npx ts-node src/scripts/seed.ts
```

#### Issue: "Seed script: Cannot read property 'id' of undefined"

**Diagnosis:**
```bash
# Check if entity was saved
npm run typeorm:query "SELECT * FROM tenants LIMIT 1;"

# Check seed script logic
cat src/scripts/seed.ts | head -50
```

**Solution:**
```bash
# Ensure database is migrated
npm run typeorm:migration:run

# Add error handling to seed
# Check src/scripts/seed.ts for proper null checks

# Run with verbose logging
NODE_DEBUG=* npx ts-node src/scripts/seed.ts 2>&1 | head -100
```

---

### Problem: API Not Responding

#### Issue: "Cannot GET /api/reservations"

**Diagnosis:**
```bash
# Check if server is running
curl http://localhost:3000/health

# Check available routes
npm run test -- --listTests | grep controller

# Check if modules are loaded
curl http://localhost:3000/api/docs
```

**Solution:**
```bash
# Check server logs
tail -f logs/application.log

# Ensure modules are imported in app.module.ts
grep ReservationsModule src/app.module.ts

# Restart server
npm run start:dev
```

#### Issue: "401 Unauthorized on protected endpoints"

**Diagnosis:**
```bash
# Check if token is being sent
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/protected

# Check JWT configuration
echo $JWT_SECRET
echo $JWT_EXPIRATION
```

**Solution:**
```bash
# Get valid token
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@hotel.com", "password": "password"}'

# Use token in request
curl -H "Authorization: Bearer TOKEN" http://localhost:3000/api/reservations
```

---

## Monitoring & Logs

### Viewing Logs

#### Application Logs

```bash
# Real-time logs
tail -f logs/application.log

# Last 100 lines
tail -100 logs/application.log

# Search logs
grep "ERROR" logs/application.log

# Follow specific pattern
tail -f logs/application.log | grep "Reservation"

# Log files by date
ls -lah logs/
```

#### Database Logs

```bash
# PostgreSQL logs (Linux)
tail -f /var/log/postgresql/postgresql.log

# PostgreSQL logs (macOS)
tail -f /usr/local/var/log/postgres.log

# Check active connections
psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Kill slow query
psql -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE duration > interval '5 minutes';"
```

#### Browser Console Logs

```bash
# Frontend errors in console
# Open browser DevTools: F12 or Cmd+Option+I

# Check network requests
# Go to Network tab

# View application state
# Go to Application/Storage tab
```

### Health Checks

```bash
# API Health
curl http://localhost:3000/health

# Database Health
curl http://localhost:3000/health/db

# API Documentation
curl http://localhost:3000/api/docs

# Metrics (if enabled)
curl http://localhost:3000/metrics
```

### Performance Monitoring

```bash
# Check response time
time curl http://localhost:3000/api/reservations

# Monitor resource usage
top -p $(pgrep -f "node.*start")

# Check database query time
# Enable DATABASE_LOGGING=true in .env

# Check applied migrations
npm run typeorm:migration:show
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] All tests passing: `npm run test:e2e`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] All migrations created and tested
- [ ] Environment variables configured
- [ ] Database backup created
- [ ] SSL/TLS certificates installed
- [ ] API documentation reviewed
- [ ] Security checklist completed

### Deployment Steps

#### 1. Prepare Environment

```bash
# Pull latest code
git pull origin main

# Install dependencies
npm ci

# Verify installation
npm ls
```

#### 2. Build Application

```bash
# Build backend
cd backend
npm run build

# Build frontend
cd ../ui
npm run build

# Verify builds
ls -la dist/
```

#### 3. Migrate Database

```bash
# Create backup
pg_dump hospitality_prod > backup-$(date +%Y%m%d-%H%M%S).sql

# Run migrations
cd backend
npm run typeorm:migration:run

# Verify migrations
npm run typeorm:migration:show
```

#### 4. Seed Production Data

```bash
# Seed production templates (if first time)
cd backend
npx ts-node src/scripts/seed-production.ts
```

#### 5. Start Services

```bash
# Start backend (use process manager like PM2)
pm2 start "NODE_ENV=production npm run start" --name "hospitality-api"

# Start frontend (use nginx or similar)
# Copy ui/dist/* to /var/www/hospitality/

# Verify services
pm2 list
curl http://localhost:3000/health
```

#### 6. Post-Deployment Verification

```bash
# Check API health
curl http://localhost:3000/health

# Check database
curl http://localhost:3000/health/db

# Test critical flows
npm run test:e2e -- --match="critical"

# Check logs
tail -f logs/application.log
```

### Production Tips

- Use PM2 for process management
- Enable file rotation for logs
- Configure backup schedules
- Set up monitoring and alerting
- Implement rate limiting
- Enable CORS properly
- Use environment-specific configs
- Monitor resource usage
- Regular security updates

### Backup Automation Standard

Daily reports and all major hotel operations data live in PostgreSQL. That means backups are mandatory, not optional.

Use the repo backup helpers:

```bash
# Create a compressed PostgreSQL backup with checksum + retention cleanup
BACKUP_DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/hospitality_prod' \
BACKUP_DIR='/var/backups/hospitality/postgres' \
EXTERNAL_COPY_DIR='/mnt/offsite/hospitality/postgres' \
RETENTION_DAYS='14' \
BACKUP_PREFIX='hospitality-prod' \
npm run backup:db
```

```bash
# Restore a backup into a recovery database
RESTORE_DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/hospitality_restore' \
npm run restore:db -- /var/backups/hospitality/postgres/hospitality-prod-YYYYMMDDTHHMMSSZ.dump.gz
```

Required production practice:

- Run automated DB backups every day.
- Copy backups off the app server.
- Keep at least 14 days of retention.
- Test restore into a non-production database weekly.
- Treat reports as recoverable only if database restore is proven.

Reference files:

- [BACKUP_RECOVERY.md](/home/sunu/hotel/hospitality-saas-core/backend/docs/BACKUP_RECOVERY.md)
- [ROLE_ACCESS_MATRIX.md](/home/sunu/hotel/hospitality-saas-core/backend/docs/ROLE_ACCESS_MATRIX.md)
- [RELEASE_CHECKLIST.md](/home/sunu/hotel/hospitality-saas-core/backend/docs/RELEASE_CHECKLIST.md)
- [backup-postgres.sh](/home/sunu/hotel/hospitality-saas-core/scripts/backup-postgres.sh)
- [restore-postgres.sh](/home/sunu/hotel/hospitality-saas-core/scripts/restore-postgres.sh)
- [backup-cron.example](/home/sunu/hotel/hospitality-saas-core/scripts/backup-cron.example)

Sample import templates:

- [demo-restaurant-items.csv](/home/sunu/hotel/hospitality-saas-core/demo-restaurant-items.csv)
- [demo-coffee-shop-items.csv](/home/sunu/hotel/hospitality-saas-core/demo-coffee-shop-items.csv)
- [demo-bar-items.csv](/home/sunu/hotel/hospitality-saas-core/demo-bar-items.csv)

---

## Rollback Procedures

### Emergency Rollback

#### Issue: Critical bug in production

**Step 1: Stop current version**
```bash
pm2 stop hospitality-api
```

**Step 2: Revert to previous commit**
```bash
# Check previous commits
git log --oneline | head -10

# Revert to stable version
git checkout <commit-hash>

# Or rollback to previous tag
git checkout tag/v1.0.0
```

**Step 3: Reinstall and rebuild**
```bash
npm ci
npm run build
```

**Step 4: Restore database (if needed)**
```bash
# List backups
ls -la backup-*.sql

# Restore from backup
psql hospitality_prod < backup-YYYYMMDD-HHMMSS.sql
```

**Step 5: Restart services**
```bash
pm2 restart hospitality-api
pm2 start "npm run serve:ui" --name "hospitality-ui"
```

**Step 6: Verify**
```bash
curl http://localhost:3000/health
npm run test:e2e
```

### Database Rollback

```bash
# List migration history
npm run typeorm:migration:show

# Revert last migration
npm run typeorm:migration:revert

# Or revert specific migration
npm run typeorm:migration:revert -- --transaction=false --name=MigrationName

# Verify
npm run typeorm:migration:show
```

### Code Rollback (Non-Emergency)

```bash
# Revert last commit (keep changes)
git reset --soft HEAD~1

# Revert last commit (discard changes)
git reset --hard HEAD~1

# Revert specific file
git checkout HEAD -- src/file.ts

# Revert to specific commit
git revert <commit-hash>
```

---

## FAQ & Quick Answers

**Q: How do I change the API port?**
```bash
# Option 1: Environment variable
PORT=3001 npm run start:dev

# Option 2: Edit .env
APP_PORT=3001
```

**Q: How do I reset the database?**
```bash
# Drop database
psql -U postgres -c "DROP DATABASE hospitality_dev;"

# Recreate database
psql -U postgres -c "CREATE DATABASE hospitality_dev;"

# Run migrations
npm run typeorm:migration:run

# Seed data
npx ts-node src/scripts/seed.ts
```

**Q: Where are logs stored?**
```bash
# Check log location
cat src/main.ts | grep createLogger

# Default location
logs/
logs/application.log
logs/error.log
```

**Q: How do I add a new migration?**
```bash
# Modify entity
# Then generate migration
npm run typeorm:migration:generate src/database/migrations/AddNewFeature

# Review migration
cat src/database/migrations/AddNewFeature.ts

# Run migration
npm run typeorm:migration:run
```

**Q: How do I debug the application?**
```bash
# Using VSCode debugger
# Add to .vscode/launch.json
# Press F5 to start

# Or use node inspector
node --inspect-brk src/main.ts

# Access devtools at: chrome://inspect
```

---

## Support & Getting Help

### Documentation

- API Docs: http://localhost:3000/api/docs
- Architecture: [ARCHITECTURE.md](backend/docs/ARCHITECTURE.md)
- Implementation: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- Testing: [TESTING_SCENARIOS.md](TESTING_SCENARIOS.md)

### Common Issues Reference

- **Database issues:** See "Problem: Database Connection Issues"
- **Build errors:** See "Problem: TypeScript Compilation Errors"
- **Test failures:** See "Problem: Tests Failing"
- **Deployment:** See "Production Deployment"

### Getting Help

1. Check the troubleshooting guide above
2. Review application logs: `tail -f logs/application.log`
3. Check database logs: `tail -f /var/log/postgresql/postgresql.log`
4. Review error messages carefully
5. Try the suggested solutions in order
6. If stuck, rollback to last known good state

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-03-30 | Initial runbook |
| | | - Complete setup guide |
| | | - Troubleshooting section |
| | | - Production deployment |

---

**Last Updated:** March 30, 2026  
**Next Review:** April 30, 2026  
**Maintained By:** Hospitality SaaS Team

---

## Quick Reference Card (Print This)

```
╔════════════════════════════════════════════════════════════════╗
║           HOSPITALITY SAAS - QUICK REFERENCE CARD              ║
╠════════════════════════════════════════════════════════════════╣
║ START APPLICATION:                                             ║
║   Terminal 1: cd backend && npm run start:dev                  ║
║   Terminal 2: cd ui && npm run dev                             ║
║   Access: http://localhost:3000 (backend)                      ║
║           http://localhost:5173 (frontend)                     ║
╠════════════════════════════════════════════════════════════════╣
║ SETUP DATABASE:                                                ║
║   npm run typeorm:migration:run                                ║
║   npx ts-node src/scripts/seed.ts                              ║
╠════════════════════════════════════════════════════════════════╣
║ RUN TESTS:                                                     ║
║   npm run test (unit tests)                                    ║
║   npm run test:e2e (integration tests)                         ║
║   npm run test:cov (coverage report)                           ║
╠════════════════════════════════════════════════════════════════╣
║ TROUBLESHOOT:                                                  ║
║   Port in use: kill -9 $(lsof -ti :3000)                       ║
║   DB connection: psql $DATABASE_URL -c "SELECT 1"              ║
║   Rebuild: rm -rf node_modules && npm install                  ║
╠════════════════════════════════════════════════════════════════╣
║ LOGS & HEALTH:                                                 ║
║   tail -f logs/application.log                                 ║
║   curl http://localhost:3000/health                            ║
║   npm run typeorm:migration:show                               ║
╚════════════════════════════════════════════════════════════════╝
```
