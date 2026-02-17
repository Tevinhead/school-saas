import { router } from "./trpc";
import { tenantRouter } from "./routers/tenant";
import { studentRouter } from "./routers/student";
import { academicRouter } from "./routers/academic";
import { attendanceRouter } from "./routers/attendance";
import { gradebookRouter } from "./routers/gradebook";
import { feesRouter } from "./routers/fees";
import { communicationRouter } from "./routers/communication";
import { reportCardRouter } from "./routers/report-card";

export const appRouter = router({
  tenant: tenantRouter,
  student: studentRouter,
  academic: academicRouter,
  attendance: attendanceRouter,
  gradebook: gradebookRouter,
  fees: feesRouter,
  communication: communicationRouter,
  reportCard: reportCardRouter,
});

export type AppRouter = typeof appRouter;

export { createTRPCContext, createCallerFactory } from "./trpc";
export type { TRPCContext } from "./trpc";
