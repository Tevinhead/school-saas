import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { gradeLevels, classes, subjects, classSections, classEnrollments, students } from "@school-saas/db/schema";

export const academicRouter = router({
  // Grade Levels
  listGradeLevels: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.gradeLevels.findMany({
      where: eq(gradeLevels.tenantId, ctx.auth.orgId),
      orderBy: (gl, { asc }) => [asc(gl.sortOrder)],
    });
  }),

  createGradeLevel: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        sortOrder: z.number().int().default(0),
        curriculum: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [level] = await ctx.db
        .insert(gradeLevels)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return level;
    }),

  // Classes
  listClasses: protectedProcedure
    .input(z.object({ academicYearId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(classes.tenantId, ctx.auth.orgId)];
      if (input?.academicYearId) {
        conditions.push(eq(classes.academicYearId, input.academicYearId));
      }
      return ctx.db.query.classes.findMany({
        where: and(...conditions),
      });
    }),

  createClass: adminProcedure
    .input(
      z.object({
        gradeLevelId: z.string().uuid(),
        academicYearId: z.string().uuid(),
        name: z.string().min(1).max(100),
        homeroomTeacherId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [cls] = await ctx.db
        .insert(classes)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return cls;
    }),

  // Subjects
  listSubjects: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.subjects.findMany({
      where: eq(subjects.tenantId, ctx.auth.orgId),
    });
  }),

  createSubject: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        code: z.string().min(1).max(20),
        department: z.string().max(100).optional(),
        curriculum: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [subject] = await ctx.db
        .insert(subjects)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return subject;
    }),

  // Class Sections
  listClassSections: protectedProcedure
    .input(z.object({ classId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.classSections.findMany({
        where: and(
          eq(classSections.tenantId, ctx.auth.orgId),
          eq(classSections.classId, input.classId)
        ),
      });
    }),

  createClassSection: adminProcedure
    .input(
      z.object({
        classId: z.string().uuid(),
        subjectId: z.string().uuid(),
        teacherId: z.string().uuid().optional(),
        termId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [section] = await ctx.db
        .insert(classSections)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return section;
    }),

  updateGradeLevel: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        sortOrder: z.number().int().optional(),
        curriculum: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(gradeLevels)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(gradeLevels.id, id), eq(gradeLevels.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteGradeLevel: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(gradeLevels)
        .where(and(eq(gradeLevels.id, input.id), eq(gradeLevels.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  updateSubject: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        code: z.string().min(1).max(20).optional(),
        department: z.string().max(100).optional(),
        curriculum: z.string().max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(subjects)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(subjects.id, id), eq(subjects.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteSubject: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(subjects)
        .where(and(eq(subjects.id, input.id), eq(subjects.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  // Get students enrolled in a class section (via class → classEnrollments)
  getStudentsByClassSection: protectedProcedure
    .input(z.object({ classSectionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: students.id,
          studentNumber: students.studentNumber,
          firstName: students.firstName,
          lastName: students.lastName,
        })
        .from(classSections)
        .innerJoin(classes, eq(classSections.classId, classes.id))
        .innerJoin(classEnrollments, eq(classes.id, classEnrollments.classId))
        .innerJoin(students, eq(classEnrollments.studentId, students.id))
        .where(
          and(
            eq(classSections.id, input.classSectionId),
            eq(classSections.tenantId, ctx.auth.orgId)
          )
        )
        .orderBy(students.lastName, students.firstName);
      return rows;
    }),
});
