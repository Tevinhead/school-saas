import { initTRPC, TRPCError } from "@trpc/server";
import { auth } from "@clerk/nextjs/server";
import superjson from "superjson";
import { sql } from "drizzle-orm";
import { db } from "@school-saas/db";
import type { UserRole } from "@school-saas/db/schema";

export interface TRPCContext {
  db: typeof db;
  auth: {
    userId: string | null;
    orgId: string | null;
    orgRole: string | null;
  };
}

export async function createTRPCContext(opts: { req: Request }): Promise<TRPCContext> {
  const session = await auth();

  return {
    db,
    auth: {
      userId: session.userId,
      orgId: session.orgId ?? null,
      orgRole: session.orgRole ?? null,
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
  // This will be used by RLS policies to filter data
  await ctx.db.execute(
    sql`SELECT set_config('app.current_tenant_id', ${ctx.auth.orgId}, true)`
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
