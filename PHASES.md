# Build Phases

## Phase 1: Foundation + Core Data (Weeks 1–4)

### Step 1.1 — Scaffold Monorepo
- Turborepo + pnpm workspaces + turbo.json
- docker-compose.yml (Postgres 16, Redis 7, MinIO)
- Next.js app with App Router, Tailwind v4, shadcn/ui CSS variables
- Shared packages: db, api, validators, email, queue
- TypeScript configs, ESLint, env validation (@t3-oss/env-nextjs)
- .gitignore, .env.example, .npmrc

### Step 1.2 — Database Setup
- Drizzle schema files (already created in packages/db/src/schema/)
- RLS policies on all tenant-scoped tables
- Migration pipeline (drizzle-kit generate + migrate)
- Seed script with demo school (International School of Demo)
- Tables: tenants, academic_years, terms, user_profiles, grade_levels, classes, subjects, class_sections, students, guardians, student_guardians, class_enrollments, attendance_records, grading_scales, assessments, grades, report_cards, fee_structures, invoices, payments, announcements, message_threads, messages, message_recipients

### Step 1.3 — Auth Integration
- Clerk setup with Organizations (each school = org)
- Middleware: auth + i18n locale routing
- Webhook endpoint at /api/webhooks/clerk
- User profile sync (Clerk → user_profiles table)
- Roles: super_admin, school_admin, teacher, student, parent

### Step 1.4 — tRPC Foundation
- Init tRPC with superjson transformer
- Context: db + Clerk auth (userId, orgId, orgRole)
- Tenant-scoping middleware (SET LOCAL app.current_tenant_id)
- Role middleware: protectedProcedure, adminProcedure, teacherProcedure
- API route handler at /api/trpc/[trpc]
- Server caller for RSC

### Step 1.5 — Dashboard Shell
- Sidebar with role-based nav filtering
- TopBar with org switcher (Clerk OrganizationSwitcher)
- Breadcrumbs component
- Mobile responsive sidebar (sheet/drawer)
- shadcn/ui Button, Card, Input, Dialog, Sheet, DropdownMenu, etc.

### Step 1.6 — Tenant & Academic Config
- Tenant settings page (name, timezone, locale, currency, academic year start)
- Academic year CRUD
- Term CRUD (within academic year)
- Grade levels CRUD (with curriculum tag)
- Subjects CRUD (with department, code, curriculum)

### Step 1.7 — Student Information System
- Student list with DataTable (search, filter, pagination, sorting)
- Student create/edit form (React Hook Form + Zod)
- Student detail page (tabs: info, guardians, enrollment, attendance, grades)
- Guardian management (add/edit/remove, emergency contact flag)
- Class enrollment management
- Passport/visa/nationality fields for international schools

---

## Phase 2: Core Operations (Weeks 5–8)

### Step 2.1 — Attendance
- Batch marking UI (class view — list all students, mark status)
- Period-wise attendance option
- Daily attendance reports
- Absence notification (email to parents via queue)
- Student attendance history view

### Step 2.2 — Gradebook
- Grading scale config with presets (IB 1-7, British A*-U, American A-F, percentage)
- Custom grading scale creation
- Assessment CRUD (homework, quiz, test, exam, project)
- Grade entry (spreadsheet-like UI per assessment)
- Weighted grade calculation
- Student grade summary view

### Step 2.3 — Report Cards
- Draft → submitted → approved → published workflow
- PDF generation (@react-pdf/renderer)
- Teacher writes comments per subject
- Admin approves before publishing
- Published report cards visible in parent portal

### Step 2.4 — Fee Management
- Fee structure setup (per grade level, per academic year)
- Invoice generation (individual or bulk)
- Payment recording (cash, bank transfer, card, cheque)
- Invoice status tracking (pending, partial, paid, overdue, cancelled)
- Overdue alerts (email via queue)
- Multi-currency support (stored as decimal + ISO 4217 currency code)

---

## Phase 3: Communication, Portal & Polish (Weeks 9–13)

### Step 3.1 — Communication
- Announcements with audience targeting (all, teachers, parents, specific class)
- Publish/draft workflow
- Parent-teacher messaging threads
- Message read receipts
- Email notifications for new messages (via queue)

### Step 3.2 — Parent/Student Portal
- Separate layout from dashboard
- Read-only views: grades, attendance summary, announcements, fee status
- Parent can view all linked children
- Student can view own data only

### Step 3.3 — Dashboard & Analytics
- Role-specific dashboard widgets
- Admin: enrollment stats, fee collection summary, attendance overview
- Teacher: my classes, recent attendance, upcoming assessments
- Charts: attendance trends, grade distributions, fee collection rates (recharts or similar)

### Step 3.4 — Polish & Launch Prep
- Error states, loading states, empty states for all pages
- Onboarding wizard for new tenants (guided setup)
- Demo data seeder (realistic fake data)
- Playwright E2E tests (sign-in, student CRUD, attendance, grades, portal)
- Performance audit (Core Web Vitals)
- Security audit (RLS verification, RBAC edge cases)
- Documentation for deployment
