import "server-only";
import { cache } from "react";
import { appRouter, createCallerFactory } from "@school-saas/api";
import { db } from "@school-saas/db";

const IS_DEMO = process.env.DEMO_MODE === "true";
const DEMO_TENANT_ID = process.env.DEMO_TENANT_ID ?? "org_39n7rluabtOAtn1Hvu8d3HM0ThY";
const DEMO_USER_ID = process.env.DEMO_USER_ID ?? "demo_user_admin_001";

const createCaller = createCallerFactory(appRouter);

export const serverApi = cache(async () => {
  if (IS_DEMO) {
    return createCaller({
      db,
      auth: {
        userId: DEMO_USER_ID,
        orgId: DEMO_TENANT_ID,
        orgRole: "school_admin",
      },
    });
  }

  const { auth } = await import("@clerk/nextjs/server");
  const session = await auth();

  return createCaller({
    db,
    auth: {
      userId: session.userId,
      orgId: session.orgId ?? null,
      orgRole: session.orgRole ?? null,
    },
  });
});
