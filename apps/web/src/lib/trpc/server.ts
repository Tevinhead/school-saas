import "server-only";
import { cache } from "react";
import { auth } from "@clerk/nextjs/server";
import { appRouter, createCallerFactory } from "@school-saas/api";
import { db } from "@school-saas/db";

const createCaller = createCallerFactory(appRouter);

export const serverApi = cache(async () => {
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
