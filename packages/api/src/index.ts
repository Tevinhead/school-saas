import { router } from "./trpc";
import { tenantRouter } from "./routers/tenant";
import { studentRouter } from "./routers/student";
import { academicRouter } from "./routers/academic";
import { attendanceRouter } from "./routers/attendance";
import { gradebookRouter } from "./routers/gradebook";
import { feesRouter } from "./routers/fees";
import { communicationRouter } from "./routers/communication";
import { reportCardRouter } from "./routers/report-card";
import { portalRouter } from "./routers/portal";
import { dashboardRouter } from "./routers/dashboard";
import { onboardingRouter } from "./routers/onboarding";
import { timetableRouter } from "./routers/timetable";
import { admissionsRouter } from "./routers/admissions";
import { analyticsRouter } from "./routers/analytics";

export const appRouter = router({
  tenant: tenantRouter,
  student: studentRouter,
  academic: academicRouter,
  attendance: attendanceRouter,
  gradebook: gradebookRouter,
  fees: feesRouter,
  communication: communicationRouter,
  reportCard: reportCardRouter,
  portal: portalRouter,
  dashboard: dashboardRouter,
  onboarding: onboardingRouter,
  timetable: timetableRouter,
  admissions: admissionsRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

export { createTRPCContext, createCallerFactory, authOnlyProcedure } from "./trpc";
export type { TRPCContext } from "./trpc";
