# Deployment Guide

## Prerequisites

- **Node.js** 20+ (LTS recommended)
- **pnpm** 10+ (`corepack enable && corepack prepare pnpm@latest --activate`)
- **PostgreSQL** 16+
- **Redis** 7+ (for BullMQ job queue)
- **Clerk** account (authentication provider)

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/school_saas

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Clerk Webhook (for user/org sync)
CLERK_WEBHOOK_SECRET=whsec_...

# Redis (for BullMQ)
REDIS_URL=redis://localhost:6379

# S3 / MinIO (local dev)
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_BUCKET=school-saas

# Resend (email)
RESEND_API_KEY=re_...

# Application
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## Initial Setup

### 1. Clone and install dependencies

```bash
git clone <repository-url>
cd school-saas
pnpm install
```

### 2. Start infrastructure services

```bash
docker compose up -d
```

This starts:
- PostgreSQL 16 on port 5432
- Redis 7 on port 6379
- MinIO (S3-compatible storage) on ports 9000/9001

### 3. Configure environment

```bash
cp .env.example .env
# Edit .env with your Clerk keys and database URL
```

### 4. Push database schema

```bash
pnpm db:push
```

### 5. Apply RLS policies

```bash
pnpm db:rls
```

### 6. Seed demo data (optional)

```bash
pnpm db:seed
```

This creates 75 students, 8 classes, full attendance history, grades, fees, and more.

### 7. Configure Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable Organizations feature
3. Create organization roles: `admin`, `teacher`, `student`, `parent`
4. Set up webhook endpoint: `https://your-domain.com/api/webhooks/clerk`
5. Subscribe to events: `organization.created`, `organizationMembership.created`, `user.created`

### 8. Run development server

```bash
pnpm dev
```

Visit `http://localhost:3000`

## Production Build

```bash
# Build all packages
SKIP_ENV_VALIDATION=true pnpm build
```

The `SKIP_ENV_VALIDATION` flag is needed if building in CI/CD environments where Clerk keys may not be available at build time.

## Production Deployment

### PM2 Process Manager

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start "npx next start" --name school-saas --cwd apps/web

# Save PM2 process list
pm2 save

# Setup PM2 to start on boot
pm2 startup
```

### PM2 Commands

```bash
pm2 status          # Check process status
pm2 logs school-saas  # View logs
pm2 restart school-saas  # Restart
pm2 stop school-saas     # Stop
pm2 delete school-saas   # Remove
```

### Cloudflare Tunnel

If the server is behind NAT, use Cloudflare Tunnel to expose it:

```yaml
# /etc/cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: school.your-domain.com
    service: http://localhost:3000
  - service: http_status:404
```

```bash
# Install and configure cloudflared
cloudflared tunnel create school-saas
cloudflared tunnel route dns school-saas school.your-domain.com

# Run as systemd service
sudo cloudflared service install
sudo systemctl start cloudflared
```

## Database Backup

### Manual Backup

```bash
pg_dump -h localhost -U postgres -d school_saas > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Automated Backup (cron)

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * pg_dump -h localhost -U postgres -d school_saas | gzip > /backups/school_saas_$(date +\%Y\%m\%d).sql.gz
```

### Restore

```bash
psql -h localhost -U postgres -d school_saas < backup.sql
```

## Update Procedure

```bash
# Pull latest code
git pull origin main

# Install any new dependencies
pnpm install

# Push schema changes (if any)
pnpm db:push

# Apply RLS policy updates (if any)
pnpm db:rls

# Rebuild
SKIP_ENV_VALIDATION=true pnpm build

# Restart the application
pm2 restart school-saas
```

## Troubleshooting

### Common Issues

**Build fails with "env validation" error**
```bash
# Use the skip flag
SKIP_ENV_VALIDATION=true pnpm build
```

**Database connection refused**
```bash
# Check if PostgreSQL is running
docker compose ps
# Restart if needed
docker compose restart postgres
```

**Clerk authentication not working**
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are correct
- Ensure the sign-in/sign-up URLs match your Clerk dashboard settings
- Check that the webhook endpoint is accessible and the secret matches

**RLS blocking all queries**
- Ensure `app.current_tenant_id` is being set in the tRPC middleware
- Verify the user has an active organization selected in Clerk
- Run `pnpm db:rls-audit` to test RLS policies

**PM2 process keeps crashing**
```bash
pm2 logs school-saas --lines 100  # Check recent logs
pm2 restart school-saas --update-env  # Restart with fresh env
```

**Port 3000 already in use**
```bash
lsof -i :3000  # Find what's using the port
kill -9 <PID>  # Kill the process
```

### Health Check

```bash
# Verify the application is running
curl -I http://localhost:3000

# Check database connectivity
pnpm --filter @school-saas/db push --dry-run

# Verify Clerk webhook endpoint
curl -I https://your-domain.com/api/webhooks/clerk
```

## Architecture Overview

```
Browser -> Cloudflare Tunnel -> Next.js (PM2) -> PostgreSQL
                                              -> Redis (BullMQ)
                                              -> MinIO (S3)
                                              -> Clerk (Auth)
                                              -> Resend (Email)
```

All requests are authenticated via Clerk. The tRPC middleware sets the PostgreSQL session variable for RLS-based tenant isolation. Each school organization in Clerk maps to a tenant in the database.
