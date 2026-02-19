import { z } from "zod";
import { eq, and, desc, asc, count, sql } from "drizzle-orm";
import { router, adminProcedure, publicProcedure } from "../trpc";
import {
  applications,
  applicationDocuments,
  applicationInterviews,
  waitlistEntries,
  tenants,
} from "@school-saas/db/schema";
import {
  createApplicationSchema,
  updateApplicationSchema,
  updateApplicationStatusSchema,
  createInterviewSchema,
  uploadDocumentSchema,
  waitlistEntrySchema,
} from "@school-saas/validators";

export const admissionsRouter = router({
  listApplications: adminProcedure
    .input(
      z.object({
        status: z.string().optional(),
        gradeLevelId: z.string().uuid().optional(),
        academicYearId: z.string().uuid().optional(),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().positive().max(100).default(20),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const pageSize = input?.pageSize ?? 20;
      const conditions = [eq(applications.tenantId, ctx.auth.orgId)];

      if (input?.status) {
        conditions.push(eq(applications.status, input.status));
      }
      if (input?.gradeLevelId) {
        conditions.push(eq(applications.gradeLevelId, input.gradeLevelId));
      }
      if (input?.academicYearId) {
        conditions.push(eq(applications.academicYearId, input.academicYearId));
      }

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(applications)
        .where(and(...conditions));

      const items = await ctx.db
        .select()
        .from(applications)
        .where(and(...conditions))
        .orderBy(desc(applications.appliedAt))
        .limit(pageSize)
        .offset((page - 1) * pageSize);

      return { items, total: Number(totalResult?.count ?? 0) };
    }),

  getApplication: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [application] = await ctx.db
        .select()
        .from(applications)
        .where(
          and(eq(applications.id, input.id), eq(applications.tenantId, ctx.auth.orgId))
        );

      if (!application) return null;

      const documents = await ctx.db
        .select()
        .from(applicationDocuments)
        .where(eq(applicationDocuments.applicationId, input.id))
        .orderBy(desc(applicationDocuments.uploadedAt));

      const interviews = await ctx.db
        .select()
        .from(applicationInterviews)
        .where(eq(applicationInterviews.applicationId, input.id))
        .orderBy(desc(applicationInterviews.scheduledAt));

      return { ...application, documents, interviews };
    }),

  createApplication: publicProcedure
    .input(createApplicationSchema.extend({ tenantId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const { tenantId, dateOfBirth, ...rest } = input;
      const [application] = await ctx.db
        .insert(applications)
        .values({
          ...rest,
          tenantId,
          dateOfBirth: new Date(dateOfBirth),
          status: "applied",
        })
        .returning();
      return application;
    }),

  updateApplication: adminProcedure
    .input(updateApplicationSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, dateOfBirth, ...rest } = input;
      const data: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (dateOfBirth) {
        data.dateOfBirth = new Date(dateOfBirth);
      }
      const [updated] = await ctx.db
        .update(applications)
        .set(data)
        .where(and(eq(applications.id, id), eq(applications.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  updateStatus: adminProcedure
    .input(updateApplicationStatusSchema)
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(applications)
        .set({ status: input.status, updatedAt: new Date() })
        .where(
          and(eq(applications.id, input.id), eq(applications.tenantId, ctx.auth.orgId))
        )
        .returning();
      return updated;
    }),

  createInterview: adminProcedure
    .input(createInterviewSchema)
    .mutation(async ({ ctx, input }) => {
      const [interview] = await ctx.db
        .insert(applicationInterviews)
        .values({
          applicationId: input.applicationId,
          tenantId: ctx.auth.orgId,
          scheduledAt: new Date(input.scheduledAt),
          interviewedBy: ctx.auth.userId,
          notes: input.notes,
          outcome: input.outcome,
        })
        .returning();
      return interview;
    }),

  listInterviews: adminProcedure
    .input(z.object({ applicationId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select()
        .from(applicationInterviews)
        .where(
          and(
            eq(applicationInterviews.applicationId, input.applicationId),
            eq(applicationInterviews.tenantId, ctx.auth.orgId)
          )
        )
        .orderBy(desc(applicationInterviews.scheduledAt));
    }),

  getWaitlist: adminProcedure
    .input(
      z.object({
        gradeLevelId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(waitlistEntries.tenantId, ctx.auth.orgId)];
      if (input?.gradeLevelId) {
        conditions.push(eq(waitlistEntries.gradeLevelId, input.gradeLevelId));
      }

      const rows = await ctx.db
        .select({
          id: waitlistEntries.id,
          rank: waitlistEntries.rank,
          offeredAt: waitlistEntries.offeredAt,
          createdAt: waitlistEntries.createdAt,
          applicationId: waitlistEntries.applicationId,
          gradeLevelId: waitlistEntries.gradeLevelId,
          studentFirstName: applications.studentFirstName,
          studentLastName: applications.studentLastName,
          applicationStatus: applications.status,
        })
        .from(waitlistEntries)
        .innerJoin(applications, eq(waitlistEntries.applicationId, applications.id))
        .where(and(...conditions))
        .orderBy(asc(waitlistEntries.rank));

      return rows;
    }),

  addToWaitlist: adminProcedure
    .input(waitlistEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .insert(waitlistEntries)
        .values({
          ...input,
          tenantId: ctx.auth.orgId,
        })
        .returning();

      // Also update application status to waitlisted
      await ctx.db
        .update(applications)
        .set({ status: "waitlisted", updatedAt: new Date() })
        .where(
          and(
            eq(applications.id, input.applicationId),
            eq(applications.tenantId, ctx.auth.orgId)
          )
        );

      return entry;
    }),

  updateWaitlistRank: adminProcedure
    .input(z.object({ id: z.string().uuid(), rank: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(waitlistEntries)
        .set({ rank: input.rank })
        .where(
          and(
            eq(waitlistEntries.id, input.id),
            eq(waitlistEntries.tenantId, ctx.auth.orgId)
          )
        )
        .returning();
      return updated;
    }),

  offerFromWaitlist: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [entry] = await ctx.db
        .update(waitlistEntries)
        .set({ offeredAt: new Date() })
        .where(
          and(
            eq(waitlistEntries.id, input.id),
            eq(waitlistEntries.tenantId, ctx.auth.orgId)
          )
        )
        .returning();

      if (entry) {
        await ctx.db
          .update(applications)
          .set({ status: "accepted", updatedAt: new Date() })
          .where(
            and(
              eq(applications.id, entry.applicationId),
              eq(applications.tenantId, ctx.auth.orgId)
            )
          );
      }

      return entry;
    }),

  getPipelineFunnel: adminProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        status: applications.status,
        count: count(),
      })
      .from(applications)
      .where(eq(applications.tenantId, ctx.auth.orgId))
      .groupBy(applications.status);

    return rows;
  }),

  deleteApplication: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(applications)
        .where(
          and(eq(applications.id, input.id), eq(applications.tenantId, ctx.auth.orgId))
        );
      return { success: true };
    }),

  recordDocument: adminProcedure
    .input(uploadDocumentSchema)
    .mutation(async ({ ctx, input }) => {
      const [doc] = await ctx.db
        .insert(applicationDocuments)
        .values({
          ...input,
          tenantId: ctx.auth.orgId,
        })
        .returning();
      return doc;
    }),

  deleteDocument: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(applicationDocuments)
        .where(
          and(
            eq(applicationDocuments.id, input.id),
            eq(applicationDocuments.tenantId, ctx.auth.orgId)
          )
        );
      return { success: true };
    }),
});
