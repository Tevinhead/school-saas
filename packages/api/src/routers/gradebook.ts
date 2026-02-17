import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, protectedProcedure, teacherProcedure, adminProcedure } from "../trpc";
import { gradingScales, assessments, grades, students, classSections, subjects } from "@school-saas/db/schema";

export const gradebookRouter = router({
  // Grading Scales
  listGradingScales: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.gradingScales.findMany({
      where: eq(gradingScales.tenantId, ctx.auth.orgId),
    });
  }),

  createGradingScale: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        type: z.enum(["numeric", "letter", "percentage"]),
        scaleDefinition: z.record(z.unknown()),
        isDefault: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [scale] = await ctx.db
        .insert(gradingScales)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return scale;
    }),

  updateGradingScale: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        type: z.enum(["numeric", "letter", "percentage"]).optional(),
        scaleDefinition: z.record(z.unknown()).optional(),
        isDefault: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(gradingScales)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(gradingScales.id, id), eq(gradingScales.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteGradingScale: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(gradingScales)
        .where(and(eq(gradingScales.id, input.id), eq(gradingScales.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  // Assessments
  listAssessments: protectedProcedure
    .input(z.object({ classSectionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.assessments.findMany({
        where: and(
          eq(assessments.tenantId, ctx.auth.orgId),
          eq(assessments.classSectionId, input.classSectionId)
        ),
        orderBy: (a, { desc }) => [desc(a.dueDate)],
      });
    }),

  createAssessment: teacherProcedure
    .input(
      z.object({
        classSectionId: z.string().uuid(),
        name: z.string().min(1).max(255),
        type: z.enum(["homework", "quiz", "test", "exam", "project"]),
        gradingScaleId: z.string().uuid().optional(),
        maxScore: z.number().positive().optional(),
        weight: z.number().min(0).max(100).optional(),
        dueDate: z.date().optional(),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = {
        ...input,
        tenantId: ctx.auth.orgId,
        maxScore: input.maxScore?.toString(),
        weight: input.weight?.toString(),
      };
      const [assessment] = await ctx.db
        .insert(assessments)
        .values(values)
        .returning();
      return assessment;
    }),

  updateAssessment: teacherProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        type: z.enum(["homework", "quiz", "test", "exam", "project"]).optional(),
        gradingScaleId: z.string().uuid().optional(),
        maxScore: z.number().positive().optional(),
        weight: z.number().min(0).max(100).optional(),
        dueDate: z.date().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, maxScore, weight, ...rest } = input;
      const data: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (maxScore !== undefined) data.maxScore = maxScore.toString();
      if (weight !== undefined) data.weight = weight.toString();
      const [updated] = await ctx.db
        .update(assessments)
        .set(data)
        .where(and(eq(assessments.id, id), eq(assessments.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteAssessment: teacherProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(assessments)
        .where(and(eq(assessments.id, input.id), eq(assessments.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  // Grades
  getGrades: protectedProcedure
    .input(z.object({ assessmentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: grades.id,
          assessmentId: grades.assessmentId,
          studentId: grades.studentId,
          score: grades.score,
          letterGrade: grades.letterGrade,
          comments: grades.comments,
          gradedById: grades.gradedById,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          studentNumber: students.studentNumber,
        })
        .from(grades)
        .innerJoin(students, eq(grades.studentId, students.id))
        .where(
          and(
            eq(grades.tenantId, ctx.auth.orgId),
            eq(grades.assessmentId, input.assessmentId)
          )
        )
        .orderBy(students.lastName, students.firstName);
      return rows;
    }),

  submitGrades: teacherProcedure
    .input(
      z.object({
        assessmentId: z.string().uuid(),
        grades: z.array(
          z.object({
            studentId: z.string().uuid(),
            score: z.number().optional(),
            letterGrade: z.string().max(5).optional(),
            comments: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.grades.map((grade) => ({
        tenantId: ctx.auth.orgId,
        assessmentId: input.assessmentId,
        studentId: grade.studentId,
        score: grade.score?.toString(),
        letterGrade: grade.letterGrade,
        comments: grade.comments,
        gradedById: ctx.auth.userId,
      }));

      const result = await ctx.db
        .insert(grades)
        .values(values)
        .onConflictDoUpdate({
          target: [grades.assessmentId, grades.studentId],
          set: {
            score: sql`EXCLUDED.score`,
            letterGrade: sql`EXCLUDED.letter_grade`,
            comments: sql`EXCLUDED.comments`,
            gradedById: sql`EXCLUDED.graded_by_id`,
            updatedAt: new Date(),
          },
        })
        .returning();
      return result;
    }),

  getStudentGradeSummary: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          assessmentId: assessments.id,
          assessmentName: assessments.name,
          assessmentType: assessments.type,
          maxScore: assessments.maxScore,
          weight: assessments.weight,
          classSectionId: assessments.classSectionId,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          score: grades.score,
          letterGrade: grades.letterGrade,
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .innerJoin(classSections, eq(assessments.classSectionId, classSections.id))
        .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
        .where(
          and(
            eq(grades.tenantId, ctx.auth.orgId),
            eq(grades.studentId, input.studentId)
          )
        )
        .orderBy(subjects.name, assessments.name);

      // Group by subject
      const bySubject: Record<string, {
        subjectName: string;
        subjectCode: string;
        grades: typeof rows;
        weightedAverage: number | null;
      }> = {};

      for (const row of rows) {
        const key = row.subjectCode;
        if (!bySubject[key]) {
          bySubject[key] = {
            subjectName: row.subjectName,
            subjectCode: row.subjectCode,
            grades: [],
            weightedAverage: null,
          };
        }
        bySubject[key].grades.push(row);
      }

      // Calculate weighted averages
      for (const subj of Object.values(bySubject)) {
        let totalWeight = 0;
        let weightedSum = 0;
        for (const g of subj.grades) {
          const score = g.score ? parseFloat(g.score) : null;
          const max = g.maxScore ? parseFloat(g.maxScore) : null;
          const weight = g.weight ? parseFloat(g.weight) : 1;
          if (score !== null && max !== null && max > 0) {
            weightedSum += (score / max) * 100 * weight;
            totalWeight += weight;
          }
        }
        subj.weightedAverage = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 10) / 10 : null;
      }

      return Object.values(bySubject);
    }),
});
