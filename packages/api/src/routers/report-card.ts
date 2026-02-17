import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, protectedProcedure, teacherProcedure, adminProcedure } from "../trpc";
import { reportCards, students, grades, assessments, classSections, subjects } from "@school-saas/db/schema";
import { terms } from "@school-saas/db/schema";

export const reportCardRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        termId: z.string().uuid().optional(),
        status: z.enum(["draft", "submitted", "approved", "published"]).optional(),
        studentId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(reportCards.tenantId, ctx.auth.orgId)];
      if (input?.termId) conditions.push(eq(reportCards.termId, input.termId));
      if (input?.status) conditions.push(eq(reportCards.status, input.status));
      if (input?.studentId) conditions.push(eq(reportCards.studentId, input.studentId));

      const rows = await ctx.db
        .select({
          id: reportCards.id,
          studentId: reportCards.studentId,
          termId: reportCards.termId,
          status: reportCards.status,
          comments: reportCards.comments,
          rejectionNote: reportCards.rejectionNote,
          pdfUrl: reportCards.pdfUrl,
          createdAt: reportCards.createdAt,
          updatedAt: reportCards.updatedAt,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          studentNumber: students.studentNumber,
          termName: terms.name,
        })
        .from(reportCards)
        .innerJoin(students, eq(reportCards.studentId, students.id))
        .innerJoin(terms, eq(reportCards.termId, terms.id))
        .where(and(...conditions))
        .orderBy(students.lastName, students.firstName);

      return rows;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .select({
          id: reportCards.id,
          studentId: reportCards.studentId,
          termId: reportCards.termId,
          status: reportCards.status,
          comments: reportCards.comments,
          rejectionNote: reportCards.rejectionNote,
          pdfUrl: reportCards.pdfUrl,
          createdAt: reportCards.createdAt,
          updatedAt: reportCards.updatedAt,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          studentNumber: students.studentNumber,
          termName: terms.name,
        })
        .from(reportCards)
        .innerJoin(students, eq(reportCards.studentId, students.id))
        .innerJoin(terms, eq(reportCards.termId, terms.id))
        .where(
          and(
            eq(reportCards.id, input.id),
            eq(reportCards.tenantId, ctx.auth.orgId)
          )
        );

      if (!card) return null;

      // Fetch grades for this student
      const studentGrades = await ctx.db
        .select({
          assessmentName: assessments.name,
          assessmentType: assessments.type,
          maxScore: assessments.maxScore,
          weight: assessments.weight,
          score: grades.score,
          letterGrade: grades.letterGrade,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          classSectionId: classSections.id,
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .innerJoin(classSections, eq(assessments.classSectionId, classSections.id))
        .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
        .where(
          and(
            eq(grades.tenantId, ctx.auth.orgId),
            eq(grades.studentId, card.studentId)
          )
        )
        .orderBy(subjects.name, assessments.name);

      return { ...card, grades: studentGrades };
    }),

  create: adminProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        termId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [card] = await ctx.db
        .insert(reportCards)
        .values({
          tenantId: ctx.auth.orgId,
          studentId: input.studentId,
          termId: input.termId,
        })
        .returning();
      return card;
    }),

  bulkCreate: adminProcedure
    .input(
      z.object({
        termId: z.string().uuid(),
        studentIds: z.array(z.string().uuid()).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.studentIds.map((studentId) => ({
        tenantId: ctx.auth.orgId,
        studentId,
        termId: input.termId,
      }));
      const result = await ctx.db.insert(reportCards).values(values).returning();
      return result;
    }),

  updateComments: teacherProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        comments: z.array(
          z.object({
            classSectionId: z.string().uuid(),
            subjectName: z.string(),
            comment: z.string(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(reportCards)
        .set({ comments: input.comments, updatedAt: new Date() })
        .where(
          and(
            eq(reportCards.id, input.id),
            eq(reportCards.tenantId, ctx.auth.orgId)
          )
        )
        .returning();
      return updated;
    }),

  submit: teacherProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(reportCards)
        .set({ status: "submitted", updatedAt: new Date() })
        .where(
          and(
            eq(reportCards.id, input.id),
            eq(reportCards.tenantId, ctx.auth.orgId),
            eq(reportCards.status, "draft")
          )
        )
        .returning();
      return updated;
    }),

  approve: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(reportCards)
        .set({ status: "approved", rejectionNote: null, updatedAt: new Date() })
        .where(
          and(
            eq(reportCards.id, input.id),
            eq(reportCards.tenantId, ctx.auth.orgId),
            eq(reportCards.status, "submitted")
          )
        )
        .returning();
      return updated;
    }),

  reject: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        rejectionNote: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(reportCards)
        .set({
          status: "draft",
          rejectionNote: input.rejectionNote,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(reportCards.id, input.id),
            eq(reportCards.tenantId, ctx.auth.orgId),
            eq(reportCards.status, "submitted")
          )
        )
        .returning();
      return updated;
    }),

  publish: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [updated] = await ctx.db
        .update(reportCards)
        .set({ status: "published", updatedAt: new Date() })
        .where(
          and(
            eq(reportCards.id, input.id),
            eq(reportCards.tenantId, ctx.auth.orgId),
            eq(reportCards.status, "approved")
          )
        )
        .returning();
      return updated;
    }),
});
