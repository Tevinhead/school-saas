# Security Audit

## Multi-Tenancy & RLS

### Overview
The application uses PostgreSQL Row-Level Security (RLS) to enforce data isolation between tenants. Every tenant-scoped table has a `tenant_id` column with RLS policies that filter rows based on the current tenant session variable.

### How RLS Works
1. tRPC middleware calls `SET LOCAL app.current_tenant_id = <orgId>` per request
2. PostgreSQL RLS policies on all 20+ tenant-scoped tables filter by `tenant_id = current_setting('app.current_tenant_id')`
3. This ensures that even if application code has bugs, the database itself enforces isolation

### Running the RLS Audit
```bash
pnpm --filter @school-saas/db rls-audit
```

This script:
- Creates two test tenants (A and B)
- Seeds data in Tenant A
- Switches to Tenant B context and verifies:
  - SELECT on Tenant A's data returns 0 rows
  - UPDATE on Tenant A's data has no effect
  - DELETE on Tenant A's data has no effect
  - INSERT with Tenant A's tenant_id is blocked
- Cleans up test data

### RLS-Protected Tables
All 20+ tables with `tenant_id` column:
- `academic_years`, `terms`, `grade_levels`, `subjects`
- `classes`, `class_sections`, `class_enrollments`
- `students`, `guardians`, `student_guardians`
- `attendance_records`
- `grading_scales`, `assessments`, `grades`
- `fee_structures`, `invoices`, `payments`
- `report_cards`
- `announcements`, `message_threads`, `messages`, `thread_participants`
- `user_profiles`

## RBAC (Role-Based Access Control)

### Role Hierarchy
| Role | Access Level |
|------|-------------|
| `super_admin` | Full system access |
| `school_admin` | Full tenant access (CRUD all data) |
| `teacher` | Read students, manage own classes, grade entry, attendance |
| `student` | Read-only portal access (own data only) |
| `parent` | Read-only portal access (linked children only) |

### Procedure Security Levels
| Procedure Type | Auth | Tenant | Role |
|---------------|------|--------|------|
| `publicProcedure` | No | No | No |
| `authOnlyProcedure` | Yes | No | No |
| `protectedProcedure` | Yes | Yes (RLS) | No |
| `teacherProcedure` | Yes | Yes (RLS) | teacher+ |
| `adminProcedure` | Yes | Yes (RLS) | admin+ |

### RBAC Review Findings

1. **Student CRUD** (`student.list`, `student.create`, etc.) - Uses `protectedProcedure`, meaning any authenticated org member can access. This is acceptable since teachers need read access, and RLS ensures tenant isolation.

2. **Portal procedures** - All portal queries validate student ownership through the `portal.getMyChildren` procedure which filters by the parent's Clerk user ID. Parents can only see data for their linked children.

3. **Admin-only operations** - Settings changes (tenant update, academic year CRUD, grade level CRUD, subject CRUD) correctly use `adminProcedure`.

4. **Onboarding** - Uses `authOnlyProcedure` (no tenant scoping) since the tenant doesn't exist yet during onboarding. The `createSchool` mutation validates the org ID from the auth context.

### Recommendations

1. Consider adding `teacherProcedure` to `student.create` and `student.update` if only teachers/admins should manage student records
2. Add rate limiting to mutation endpoints to prevent abuse
3. Add input sanitization for text fields to prevent XSS (currently handled by React's default escaping)
4. Consider adding audit logging for sensitive operations (student deletion, payment recording)
5. Regularly run `pnpm --filter @school-saas/db rls-audit` after schema changes
