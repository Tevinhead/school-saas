import { z } from "zod";
import { eq, and, ilike, sql } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { students, guardians, studentGuardians, classEnrollments, classes, gradeLevels } from "@school-saas/db/schema";

export const studentRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        search: z.string().optional(),
        status: z.enum(["active", "inactive", "graduated", "transferred"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, pageSize, search, status } = input;
      const offset = (page - 1) * pageSize;

      const conditions = [eq(students.tenantId, ctx.auth.orgId)];

      if (status) {
        conditions.push(eq(students.status, status));
      }

      if (search) {
        conditions.push(
          sql`(${students.firstName} ILIKE ${`%${search}%`} OR ${students.lastName} ILIKE ${`%${search}%`} OR ${students.studentNumber} ILIKE ${`%${search}%`})`
        );
      }

      const [items, countResult] = await Promise.all([
        ctx.db.query.students.findMany({
          where: and(...conditions),
          limit: pageSize,
          offset,
          orderBy: (s, { asc }) => [asc(s.lastName), asc(s.firstName)],
        }),
        ctx.db
          .select({ count: sql<number>`count(*)` })
          .from(students)
          .where(and(...conditions)),
      ]);

      return {
        items,
        total: Number(countResult[0].count),
        page,
        pageSize,
        totalPages: Math.ceil(Number(countResult[0].count) / pageSize),
      };
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.students.findFirst({
        where: and(eq(students.id, input.id), eq(students.tenantId, ctx.auth.orgId)),
      });
    }),

  create: adminProcedure
    .input(
      z.object({
        studentNumber: z.string().min(1).max(50),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        dateOfBirth: z.date().optional(),
        nationality: z.string().max(100).optional(),
        passportNumber: z.string().max(50).optional(),
        visaStatus: z.string().max(50).optional(),
        primaryLanguage: z.string().max(50).optional(),
        enrollmentDate: z.date().optional(),
        status: z.enum(["active", "inactive", "graduated", "transferred"]).default("active"),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [student] = await ctx.db
        .insert(students)
        .values({ ...input, tenantId: ctx.auth.orgId })
        .returning();
      return student;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        studentNumber: z.string().min(1).max(50).optional(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        dateOfBirth: z.date().optional(),
        nationality: z.string().max(100).optional(),
        passportNumber: z.string().max(50).optional(),
        visaStatus: z.string().max(50).optional(),
        primaryLanguage: z.string().max(50).optional(),
        enrollmentDate: z.date().optional(),
        status: z.enum(["active", "inactive", "graduated", "transferred"]).optional(),
        metadata: z.record(z.unknown()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(students)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(students.id, id), eq(students.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(students)
        .where(and(eq(students.id, input.id), eq(students.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  // Guardian management
  addGuardian: adminProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        firstName: z.string().min(1).max(100),
        lastName: z.string().min(1).max(100),
        relationship: z.string().min(1).max(50),
        phone: z.string().max(50).optional(),
        email: z.string().email().optional(),
        isEmergencyContact: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { studentId, ...guardianData } = input;

      const [guardian] = await ctx.db
        .insert(guardians)
        .values({ ...guardianData, tenantId: ctx.auth.orgId })
        .returning();

      await ctx.db.insert(studentGuardians).values({
        studentId,
        guardianId: guardian.id,
      });

      return guardian;
    }),

  // Guardian listing
  listGuardians: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: guardians.id,
          firstName: guardians.firstName,
          lastName: guardians.lastName,
          relationship: guardians.relationship,
          phone: guardians.phone,
          email: guardians.email,
          isEmergencyContact: guardians.isEmergencyContact,
        })
        .from(studentGuardians)
        .innerJoin(guardians, eq(studentGuardians.guardianId, guardians.id))
        .where(eq(studentGuardians.studentId, input.studentId));
      return rows;
    }),

  updateGuardian: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        firstName: z.string().min(1).max(100).optional(),
        lastName: z.string().min(1).max(100).optional(),
        relationship: z.string().min(1).max(50).optional(),
        phone: z.string().max(50).optional(),
        email: z.string().email().optional(),
        isEmergencyContact: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(guardians)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(guardians.id, id), eq(guardians.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  removeGuardian: adminProcedure
    .input(z.object({ studentId: z.string().uuid(), guardianId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(studentGuardians)
        .where(
          and(
            eq(studentGuardians.studentId, input.studentId),
            eq(studentGuardians.guardianId, input.guardianId)
          )
        );
      // Also delete the guardian record if not linked to other students
      const remaining = await ctx.db
        .select({ id: studentGuardians.id })
        .from(studentGuardians)
        .where(eq(studentGuardians.guardianId, input.guardianId));
      if (remaining.length === 0) {
        await ctx.db.delete(guardians).where(eq(guardians.id, input.guardianId));
      }
      return { success: true };
    }),

  // Class enrollment
  enrollInClass: adminProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        classId: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [enrollment] = await ctx.db
        .insert(classEnrollments)
        .values(input)
        .returning();
      return enrollment;
    }),

  listEnrollments: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          enrollmentId: classEnrollments.id,
          classId: classes.id,
          className: classes.name,
          gradeLevelName: gradeLevels.name,
          enrolledAt: classEnrollments.enrolledAt,
        })
        .from(classEnrollments)
        .innerJoin(classes, eq(classEnrollments.classId, classes.id))
        .innerJoin(gradeLevels, eq(classes.gradeLevelId, gradeLevels.id))
        .where(eq(classEnrollments.studentId, input.studentId));
      return rows;
    }),

  unenrollFromClass: adminProcedure
    .input(z.object({ enrollmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(classEnrollments)
        .where(eq(classEnrollments.id, input.enrollmentId));
      return { success: true };
    }),
});
