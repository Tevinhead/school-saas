# Progress Tracker

## Current Status: Phase 1 + Phase 2 + Phase 3 COMPLETE — Phase 4 NOT STARTED

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
- [x] Student detail page with tabs (Info, Guardians, Enrollment, Attendance, Grades)
- [x] Guardian management (add/edit/remove, emergency contact flag)
- [x] Class enrollment management (enroll/unenroll)

---

## Phase 2: Core Operations ✅ COMPLETE

### Step 2.1 — Attendance ✅ COMPLETE
- [x] Backend: `getStudentsByClassSection` procedure in academic router (join classSections → classes → classEnrollments → students)
- [x] Backend: `getStudentStats` procedure in attendance router (group by status, calculate presentPercentage)
- [x] Frontend: Attendance main page with class/section/date selectors
- [x] Frontend: Batch marking form (useFieldArray, pre-populates from existing records, defaults to "present")
- [x] Frontend: Daily summary cards (present/absent/late/excused with percentages)
- [x] Frontend: Student attendance tab (replaces stub — history table + stats summary)

### Step 2.2 — Gradebook ✅ COMPLETE
- [x] Backend: `updateAssessment`, `deleteAssessment`, `updateGradingScale`, `deleteGradingScale` procedures
- [x] Backend: `getStudentGradeSummary` — grades grouped by subject with weighted averages
- [x] Backend: Fixed `submitGrades` to use upsert (`onConflictDoUpdate`) for re-grading
- [x] Backend: Fixed `getGrades` to join with students table (returns student names)
- [x] Schema: Added unique constraint `(assessmentId, studentId)` on grades table
- [x] Frontend: Gradebook page with class/section selector → assessment DataTable
- [x] Frontend: Assessment create/edit dialog (name, type, scale, max score, weight, due date)
- [x] Frontend: Spreadsheet-like grade entry grid with memoized rows
- [x] Frontend: Grading scales admin page with IB/British/American/Percentage presets
- [x] Frontend: Student grades tab (replaces stub — grouped by subject + weighted averages)

### Step 2.3 — Report Cards ✅ COMPLETE
- [x] Schema: Added `comments` (JSONB) and `rejectionNote` (text) to reportCards table
- [x] Backend: New `reportCard` router — list, getById, create, bulkCreate, updateComments, submit, approve, reject, publish
- [x] Validators: New `report-card.ts` Zod schemas
- [x] Frontend: Report card list page with term/status filters
- [x] Frontend: Bulk create page (select term + students → create drafts)
- [x] Frontend: Detail page with grades by subject, per-subject teacher comments, status workflow buttons
- [x] Frontend: Draft→submitted→approved→published workflow with rejection notes
- [x] Frontend: PDF download placeholder (needs @react-pdf/renderer for production)

### Step 2.4 — Fee Management ✅ COMPLETE
- [x] Backend: Fixed SQL injection bug in `recordPayment` (was using string interpolation for paidAmount)
- [x] Backend: Auto-status update after payment (paid/partial based on amounts)
- [x] Backend: `updateFeeStructure`, `deleteFeeStructure`, `bulkCreateInvoices`, `updateInvoice`, `getInvoiceById`, `listPaymentsByInvoice`, `getOverdueInvoices`, `getFeeStats`
- [x] Backend: Enhanced `listInvoices` with student/fee structure name joins and date filtering
- [x] Validators: New `fees.ts` Zod schemas
- [x] Frontend: Fee management page with stats cards + Invoices/Fee Structures tabs
- [x] Frontend: Fee structure CRUD with dialog
- [x] Frontend: Invoice DataTable with status filter
- [x] Frontend: Create individual invoice + bulk create invoices dialogs
- [x] Frontend: Invoice detail page with payment progress bar + payment history
- [x] Frontend: Record payment dialog

### Schema Migration (during Phase 2)
- [x] Changed `tenants.id` from `uuid` to `text` to support Clerk org IDs
- [x] Changed all `tenant_id` foreign key columns from `uuid` to `text` (20 columns across 8 schema files)
- [x] Updated `current_tenant_id()` RLS function from `RETURNS uuid` to `RETURNS text`
- [x] Seed script uses Clerk org ID `org_39n7rluabtOAtn1Hvu8d3HM0ThY` as tenant ID

---

## Phase 3: Communication, Portal & Polish ✅ COMPLETE

### Step 3.1 — Communication ✅ COMPLETE
- [x] Announcements with audience targeting (all, teachers, parents, specific class)
- [x] Publish/draft workflow
- [x] Parent-teacher messaging threads
- [x] Message read receipts
- [x] Email notifications for new messages (via queue)

### Step 3.2 — Parent/Student Portal ✅ COMPLETE
- [x] Separate layout from dashboard
- [x] Read-only views: grades, attendance summary, announcements, fee status
- [x] Parent can view all linked children
- [x] Student can view own data only

### Step 3.3 — Dashboard & Analytics ✅ COMPLETE
- [x] Role-specific dashboard widgets
- [x] Admin: enrollment stats, fee collection summary, attendance overview
- [x] Teacher: my classes, recent attendance, upcoming assessments
- [x] Charts: attendance trends, grade distributions, fee collection rates

### Step 3.4 — Polish & Launch Prep ✅ COMPLETE
- [x] Error states, loading states, empty states for all pages
- [x] Onboarding wizard for new tenants (guided setup)
- [x] Demo data seeder (realistic fake data)
- [x] Playwright E2E tests (sign-in, student CRUD, attendance, grades, portal)
- [x] Performance audit (Core Web Vitals)
- [x] Security audit (RLS verification, RBAC edge cases)
- [x] Documentation for deployment

---

## Phase 4: Scheduling, Admissions, Payments & Localization — 🔄 IN PROGRESS

### Step 4.1 — Timetable & Scheduling ✅ COMPLETE
- [x] Schema: `packages/db/src/schema/timetable.ts` — periods, timetableEntries, substitutions tables
- [x] Router: `packages/api/src/routers/timetable.ts` — full CRUD, conflict detection, personal views, substitutions
- [x] Validators: `packages/validators/src/timetable.ts` — all Zod schemas
- [x] Frontend: `apps/web/src/app/(dashboard)/timetable/` — page + 9 component files (grid, toolbar, dialogs, tabs)
- [x] Frontend: `apps/web/src/app/(portal)/portal/timetable/` — portal view

### Step 4.2 — Admissions Pipeline ✅ COMPLETE
- [x] Schema: `packages/db/src/schema/admissions.ts` — applications, applicationDocuments, applicationInterviews, waitlistEntries tables
- [x] Validators: `packages/validators/src/admissions.ts` — all Zod schemas
- [x] Router: `packages/api/src/routers/admissions.ts` — full CRUD + pipeline funnel + waitlist management
- [x] Frontend: `apps/web/src/app/(dashboard)/admissions/page.tsx` — pipeline dashboard with kanban/table + funnel
- [x] Frontend: `apps/web/src/app/(dashboard)/admissions/[id]/page.tsx` — application detail + interview scheduling
- [x] Frontend: `apps/web/src/app/apply/[orgSlug]/page.tsx` — public multi-step application form (no auth)
- [x] Sidebar: Admissions nav item added for admin roles

### Step 4.3 — Cambodia Payment Integration ✅ COMPLETE
- [x] Schema: Added khqrCode + khqrGeneratedAt to invoices table
- [x] Schema: New exchangeRateSettings table
- [x] Frontend: Exchange rate settings page at /settings/exchange-rate
- [x] Webhook: ABA PayWay webhook handler at /api/webhooks/aba

### Step 4.4 — Document Generation & Transcripts ✅ COMPLETE
- [x] PDF templates: report-card-template.tsx, transcript-template.tsx, receipt-template.tsx (bilingual EN/KH)
- [x] API routes: /api/pdf/report-card/[id], /api/pdf/transcript/[studentId]
- [x] Graceful fallback when @react-pdf/renderer not installed (install to activate)

### Step 4.5 — Advanced Analytics & Reporting ✅ COMPLETE
- [x] Router: `packages/api/src/routers/analytics.ts` — enrollment trends, attendance trends, grade distribution, fee aging, teacher workload, CSV export
- [x] Frontend: `apps/web/src/app/(dashboard)/analytics/page.tsx` — tabbed analytics dashboard with recharts
- [x] Export: CSV download on each analytics tab

### Step 4.6 — Multi-Language (i18n) ✅ COMPLETE
- [x] Translation files: `apps/web/messages/en.json` (expanded), `apps/web/messages/km.json` (full Khmer)
- [x] next-intl config: `apps/web/src/i18n/request.ts` — cookie-based locale detection
- [x] Locale API: `/api/i18n/set-locale` — sets locale cookie
- [x] Middleware updated to allow /apply/(.*) and /api/i18n/(.*) as public routes

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
- Report card PDF generation is a placeholder (needs @react-pdf/renderer)
- Email notifications for absences/overdue fees not yet wired (deferred to Phase 3 polish)
- Git initialized, initial commit: fcdeb22
