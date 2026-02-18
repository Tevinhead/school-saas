import { z } from "zod";
import { eq, count } from "drizzle-orm";
import { router, authOnlyProcedure } from "../trpc";
import { tenants, academicYears, terms } from "@school-saas/db/schema";
import { gradeLevels, subjects } from "@school-saas/db/schema";

export const onboardingRouter = router({
  getStatus: authOnlyProcedure.query(async ({ ctx }) => {
    const orgId = ctx.auth.orgId;
    if (!orgId) {
      return { hasTenant: false, academicYearCount: 0, termCount: 0, gradeLevelCount: 0, subjectCount: 0 };
    }

    const tenant = await ctx.db.query.tenants.findFirst({
      where: eq(tenants.id, orgId),
    });

    if (!tenant) {
      return { hasTenant: false, academicYearCount: 0, termCount: 0, gradeLevelCount: 0, subjectCount: 0 };
    }

    const [ayResult] = await ctx.db.select({ count: count() }).from(academicYears).where(eq(academicYears.tenantId, orgId));
    const [termResult] = await ctx.db.select({ count: count() }).from(terms).where(eq(terms.tenantId, orgId));
    const [glResult] = await ctx.db.select({ count: count() }).from(gradeLevels).where(eq(gradeLevels.tenantId, orgId));
    const [subResult] = await ctx.db.select({ count: count() }).from(subjects).where(eq(subjects.tenantId, orgId));

    return {
      hasTenant: true,
      academicYearCount: ayResult.count,
      termCount: termResult.count,
      gradeLevelCount: glResult.count,
      subjectCount: subResult.count,
    };
  }),

  createSchool: authOnlyProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        timezone: z.string().max(100).default("UTC"),
        defaultLocale: z.string().max(10).default("en"),
        defaultCurrency: z.string().length(3).default("USD"),
        academicYearStartMonth: z.string().max(2).default("09"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const orgId = ctx.auth.orgId;
      if (!orgId) {
        throw new Error("No organization selected. Please create or select an organization first.");
      }

      // Check if tenant already exists
      const existing = await ctx.db.query.tenants.findFirst({
        where: eq(tenants.id, orgId),
      });

      if (existing) {
        return existing;
      }

      const slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      const [tenant] = await ctx.db
        .insert(tenants)
        .values({
          id: orgId,
          name: input.name,
          slug: slug + "-" + orgId.slice(-6),
          timezone: input.timezone,
          defaultLocale: input.defaultLocale,
          defaultCurrency: input.defaultCurrency,
          academicYearStartMonth: input.academicYearStartMonth,
        })
        .returning();

      return tenant;
    }),
});
