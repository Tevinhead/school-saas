import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { tenants, academicYears, terms, exchangeRateSettings } from "@school-saas/db/schema";

export const tenantRouter = router({
  getCurrent: protectedProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db.query.tenants.findFirst({
      where: eq(tenants.id, ctx.auth.orgId),
    });
    return tenant ?? null;
  }),

  update: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255).optional(),
        timezone: z.string().max(100).optional(),
        defaultLocale: z.string().max(10).optional(),
        defaultCurrency: z.string().length(3).optional(),
        academicYearStartMonth: z.string().max(2).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(tenants)
        .set({ ...input, updatedAt: new Date() })
        .where(eq(tenants.id, ctx.auth.orgId))
        .returning();
      return updated;
    }),

  // Academic Years
  listAcademicYears: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.academicYears.findMany({
      where: eq(academicYears.tenantId, ctx.auth.orgId),
      orderBy: (ay, { desc }) => [desc(ay.startDate)],
    });
  }),

  createAcademicYear: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        startDate: z.date(),
        endDate: z.date(),
        isCurrent: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [year] = await ctx.db
        .insert(academicYears)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return year;
    }),

  // Terms
  listTerms: protectedProcedure
    .input(z.object({ academicYearId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.terms.findMany({
        where: eq(terms.academicYearId, input.academicYearId),
        orderBy: (t, { asc }) => [asc(t.startDate)],
      });
    }),

  createTerm: adminProcedure
    .input(
      z.object({
        academicYearId: z.string().uuid(),
        name: z.string().min(1).max(100),
        startDate: z.date(),
        endDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [term] = await ctx.db
        .insert(terms)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return term;
    }),

  updateAcademicYear: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
        isCurrent: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(academicYears)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(academicYears.id, id), eq(academicYears.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteAcademicYear: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(academicYears)
        .where(and(eq(academicYears.id, input.id), eq(academicYears.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  updateTerm: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(terms)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(terms.id, id), eq(terms.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteTerm: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(terms)
        .where(and(eq(terms.id, input.id), eq(terms.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  getExchangeRate: protectedProcedure.query(async ({ ctx }) => {
    const setting = await ctx.db.query.exchangeRateSettings.findFirst({
      where: eq(exchangeRateSettings.tenantId, ctx.auth.orgId),
    });
    return setting ?? { usdToKhr: "4100" };
  }),

  setExchangeRate: adminProcedure
    .input(z.object({ usdToKhr: z.string().regex(/^\d+(\.\d{1,2})?$/) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.query.exchangeRateSettings.findFirst({
        where: eq(exchangeRateSettings.tenantId, ctx.auth.orgId),
      });
      if (existing) {
        const [updated] = await ctx.db
          .update(exchangeRateSettings)
          .set({ usdToKhr: input.usdToKhr, updatedAt: new Date(), updatedBy: ctx.auth.userId })
          .where(eq(exchangeRateSettings.tenantId, ctx.auth.orgId))
          .returning();
        return updated;
      }
      const [created] = await ctx.db
        .insert(exchangeRateSettings)
        .values({ tenantId: ctx.auth.orgId, usdToKhr: input.usdToKhr, updatedBy: ctx.auth.userId })
        .returning();
      return created;
    }),
});
