# School Management SaaS

## Project Overview
A school management SaaS targeting international schools. Multi-tenant (shared DB + RLS), multi-curriculum, multi-language.

## Stack
Next.js 15 (App Router) + TypeScript + PostgreSQL + Clerk + tRPC v11 + Drizzle ORM + Tailwind v4 + shadcn/ui

## Monorepo Structure
- `apps/web/` — Next.js frontend + API routes
- `packages/db/` — Drizzle schema, migrations, seed
- `packages/api/` — tRPC routers (tenant, student, academic, attendance, gradebook, fees, communication)
- `packages/validators/` — Shared Zod schemas + grading presets (IB, British, American)
- `packages/email/` — Resend + React Email
- `workers/queue/` — BullMQ background jobs

## Key Files
- `PHASES.md` — Full build plan with all phases and steps
- `PROGRESS.md` — Current progress tracker (what's done, what's next, known issues)

## Multi-Tenancy
- Every tenant-scoped table has `tenant_id` column
- tRPC middleware sets `SET LOCAL app.current_tenant_id` per request
- PostgreSQL RLS policies enforce isolation
- Each school = Clerk Organization

## Commands
```bash
docker compose up -d          # Postgres + Redis + MinIO
pnpm install
pnpm db:push                  # Push schema to DB
pnpm db:seed                  # Seed demo data
pnpm dev                      # Start everything via Turborepo
pnpm type-check               # Type-check all packages
pnpm build                    # Build all (needs SKIP_ENV_VALIDATION=true without real Clerk keys)
```

## Environment
Copy `.env.example` to `.env` and fill in Clerk keys. Current `.env` has placeholder Clerk keys — builds require `SKIP_ENV_VALIDATION=true` until real keys are added.
