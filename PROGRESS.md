# Progress Tracker

## Current Status: Phase 1 COMPLETE — Phase 2 NOT STARTED

---

## Phase 1: Foundation + Core Data ✅ COMPLETE

### Step 1.1 — Scaffold Monorepo ✅ COMPLETE
- [x] Turborepo + pnpm workspaces + turbo.json
- [x] docker-compose.yml (Postgres 16, Redis 7, MinIO)
- [x] Next.js 15 app (App Router, Tailwind v4, PostCSS)
- [x] Clerk auth provider (dynamic mode for build compatibility)
- [x] Route groups: (auth), (dashboard), (portal)
- [x] Auth pages: /sign-in, /sign-up with Clerk components
- [x] Dashboard layout shell + portal layout shell
- [x] tRPC API route at /api/trpc/[trpc]
- [x] tRPC client + React Query provider
- [x] packages/db — Drizzle schemas (8 schema files, 24+ tables)
- [x] packages/api — tRPC routers (7 routers, 3-layer middleware)
- [x] packages/validators — Zod schemas + grading presets
- [x] packages/email — Resend integration
- [x] workers/queue — BullMQ worker skeleton
- [x] ESLint config, env validation, .gitignore, .env.example
- [x] All 6 packages pass type-check (0 errors)
- [x] Next.js build succeeds

### Step 1.2 — Database Setup ✅ COMPLETE
- [x] PostgreSQL 16 installed and running (native, not Docker)
- [x] Database: school_saas, user: schooladmin
- [x] drizzle-kit push to create all tables
- [x] RLS policies on 20 tenant-scoped tables (packages/db/src/rls.ts)
- [x] RLS helper function current_tenant_id()
- [x] Seed script runs successfully

### Step 1.3 — Auth Integration ✅ COMPLETE
- [x] Clerk middleware (apps/web/src/middleware.ts)
- [x] ClerkProvider in root layout
- [x] Auth pages with Clerk components
- [x] Webhook endpoint /api/webhooks/clerk (svix verification)
- [x] User profile sync logic (org membership → user_profiles)
- [x] Real Clerk keys configured

### Step 1.4 — tRPC Foundation ✅ COMPLETE
- [x] tRPC init with superjson
- [x] Context: db + Clerk auth
- [x] enforceAuth / enforceTenant / enforceRole middleware
- [x] protectedProcedure, adminProcedure, teacherProcedure
- [x] API route handler
- [x] Server caller for RSC (apps/web/src/lib/trpc/server.ts)
- [x] createCallerFactory exported

### Step 1.5 — Dashboard Shell ✅ COMPLETE
- [x] Sidebar with role-based nav filtering (lucide-react icons)
- [x] TopBar with Clerk OrganizationSwitcher + UserButton
- [x] Breadcrumbs component (auto-generated from pathname)
- [x] Mobile responsive sidebar (shadcn Sheet)
- [x] DashboardShell client component
- [x] All shadcn/ui components installed

### Step 1.6 — Tenant & Academic Config ✅ COMPLETE
- [x] Tenant settings page + form (name, timezone, locale, currency, etc.)
- [x] Academic year CRUD with dialog forms
- [x] Term CRUD (within academic year)
- [x] Grade levels CRUD with sort order + curriculum badge
- [x] Subjects CRUD with code, department, curriculum
- [x] All router operations: create, update, delete for each entity

### Step 1.7 — Student Information System ✅ COMPLETE
- [x] Reusable DataTable component (@tanstack/react-table + shadcn)
- [x] Student list page with search, status filter, pagination
- [x] Student create/edit form (react-hook-form + zod)
- [x] Student detail page with tabs (Info, Guardians, Enrollment, Attendance stub, Grades stub)
- [x] Guardian management (add/edit/remove, emergency contact flag)
- [x] Class enrollment management (enroll/unenroll)

---

## Phase 2: Core Operations — ⬜ NOT STARTED

### Step 2.1 — Attendance ⬜
### Step 2.2 — Gradebook ⬜
### Step 2.3 — Report Cards ⬜
### Step 2.4 — Fee Management ⬜

---

## Phase 3: Communication, Portal & Polish — ⬜ NOT STARTED

### Step 3.1 — Communication ⬜
### Step 3.2 — Parent/Student Portal ⬜
### Step 3.3 — Dashboard & Analytics ⬜
### Step 3.4 — Polish & Launch Prep ⬜

---

## Deployment

- **URL**: https://school.paigu.org
- **Server**: Behind NAT, exposed via Cloudflare Tunnel (paigu-home)
- **Tunnel config**: /etc/cloudflared/config.yml (school.paigu.org → localhost:3000)
- **Process manager**: PM2 (process name: school-saas, runs `npx next start` in apps/web)
- **Database**: PostgreSQL 16 on localhost:5432, database school_saas
- **Reverse proxy**: Caddy on port 80 (optional, tunnel goes direct to port 3000)
- **Environment**: .env at project root, symlinked to apps/web/.env
- **Build command**: `SKIP_ENV_VALIDATION=true pnpm build`
- **Restart**: `pm2 restart school-saas`

## Known Issues / Notes
- Clerk dev keys in use (pk_test/sk_test) — switch to production keys before real launch
- CLERK_WEBHOOK_SECRET is empty — webhooks won't verify signatures until set
- Attendance and Grades tabs on student detail page are stubs (Phase 2)
- No git commits yet
