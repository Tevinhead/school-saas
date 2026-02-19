import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import superjson from "superjson";
import { sql } from "drizzle-orm";
import { db } from "@school-saas/db";
import type { UserRole } from "@school-saas/db/schema";

const IS_DEMO = process.env.DEMO_MODE === "true";
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? "org_39n7rluabtOAtn1Hvu8d3HM0ThY";
const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo_user_admin_001";

export interface TRPCContext {
  db: typeof db;
  auth: {
    userId: string | null;
    orgId: string | null;
    orgRole: string | null;
  };
}

const CLERK_ROLE_MAP: Record<string, string> = {
  "org:admin": "school_admin",
  "org:teacher": "teacher",
  "org:student": "student",
  "org:parent": "parent",
};

export async function createTRPCContext(opts: { req: Request }): Promise<TRPCContext> {
  // Demo mode: inject a hardcoded admin context so no Clerk token is required
  if (IS_DEMO) {
    return {
      db,
      auth: {
        userId: DEMO_USER_ID,
        orgId: DEMO_TENANT_ID,
        orgRole: "school_admin",
      },
    };
  }

  const session = await auth();
  const rawRole = session.orgRole ?? null;

  return {
    db,
    auth: {
      userId: session.userId,
      orgId: session.orgId ?? null,
      orgRole: rawRole ? (CLERK_ROLE_MAP[rawRole] ?? rawRole) : null,
    },
  };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

// Middleware: require authentication
const enforceAuth = t.middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated" });
  }
  return next({
    ctx: {
      ...ctx,
      auth: {
        ...ctx.auth,
        userId: ctx.auth.userId,
      },
    },
  });
});

// Middleware: require org membership + set tenant ID for RLS
const enforceTenant = t.middleware(async ({ ctx, next }) => {
  if (!ctx.auth.userId || !ctx.auth.orgId) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Not authenticated or no organization selected" });
  }

  // Set the tenant ID in the PostgreSQL session for RLS
  await ctx.db.execute(
    sql`SELECT set_config('app.current_tenant_id', ${ctx.auth.orgId}, false)`
  );

  return next({
    ctx: {
      ...ctx,
      auth: {
        ...ctx.auth,
        userId: ctx.auth.userId,
        orgId: ctx.auth.orgId,
        orgRole: ctx.auth.orgRole,
      },
    },
  });
});

// Middleware: require specific roles
function enforceRole(...roles: UserRole[]) {
  return t.middleware(async ({ ctx, next }) => {
    if (!ctx.auth.orgRole || !roles.includes(ctx.auth.orgRole as UserRole)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    return next();
  });
}

export const createCallerFactory = t.createCallerFactory;
export const authOnlyProcedure = t.procedure.use(enforceAuth);
export const protectedProcedure = t.procedure.use(enforceAuth).use(enforceTenant);
export const adminProcedure = protectedProcedure.use(enforceRole("super_admin", "school_admin"));
export const teacherProcedure = protectedProcedure.use(enforceRole("super_admin", "school_admin", "teacher"));
