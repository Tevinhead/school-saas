import { z } from "zod";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import {
  userProfiles,
  students,
  classes,
  classSections,
  classEnrollments,
  attendanceRecords,
  grades,
  assessments,
  subjects,
  invoices,
  announcements,
  feeStructures,
} from "@school-saas/db/schema";

export const dashboardRouter = router({
  // === Admin Procedures ===

  getAdminStats: adminProcedure.query(async ({ ctx }) => {
    // Total students
    const studentCount = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(eq(students.tenantId, ctx.auth.orgId));

    // Total teachers
    const teacherCount = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.tenantId, ctx.auth.orgId),
          eq(userProfiles.role, "teacher")
        )
      );

    // Total classes
    const classCount = await ctx.db
      .select({ count: sql<number>`count(*)::int` })
      .from(classes)
      .where(eq(classes.tenantId, ctx.auth.orgId));

    // Today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAttendance = await ctx.db
      .select({
        total: sql<number>`count(*)::int`,
        present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
        absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
        late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
      })
      .from(attendanceRecords)
      .where(
        and(
          eq(attendanceRecords.tenantId, ctx.auth.orgId),
          gte(attendanceRecords.date, today),
          lte(attendanceRecords.date, tomorrow)
        )
      );

    const att = todayAttendance[0] ?? { total: 0, present: 0, absent: 0, late: 0 };

    // Fee collection
    const feeCollection = await ctx.db
      .select({
        invoiced: sql<number>`coalesce(sum(cast(${invoices.amount} as numeric)), 0)`,
        collected: sql<number>`coalesce(sum(cast(${invoices.paidAmount} as numeric)), 0)`,
        overdueCount: sql<number>`count(*) filter (where ${invoices.status} = 'overdue')::int`,
      })
      .from(invoices)
      .where(eq(invoices.tenantId, ctx.auth.orgId));

    const fees = feeCollection[0] ?? { invoiced: 0, collected: 0, overdueCount: 0 };

    return {
      totalStudents: studentCount[0]?.count ?? 0,
      totalTeachers: teacherCount[0]?.count ?? 0,
      totalClasses: classCount[0]?.count ?? 0,
      todayAttendance: {
        ...att,
        rate: att.total > 0 ? Math.round((att.present / att.total) * 100) : 0,
      },
      feeCollection: {
        invoiced: fees.invoiced,
        collected: fees.collected,
        rate: fees.invoiced > 0 ? Math.round((fees.collected / fees.invoiced) * 100) : 0,
        overdueCount: fees.overdueCount,
      },
    };
  }),

  getRecentActivity: adminProcedure.query(async ({ ctx }) => {
    const recentAnnouncements = await ctx.db
      .select({
        id: announcements.id,
        title: announcements.title,
        createdAt: announcements.createdAt,
        authorFirstName: userProfiles.firstName,
        authorLastName: userProfiles.lastName,
      })
      .from(announcements)
      .leftJoin(userProfiles, eq(announcements.authorId, userProfiles.id))
      .where(eq(announcements.tenantId, ctx.auth.orgId))
      .orderBy(desc(announcements.createdAt))
      .limit(10);

    const recentEnrollments = await ctx.db
      .select({
        id: classEnrollments.id,
        enrolledAt: classEnrollments.enrolledAt,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
        className: classes.name,
      })
      .from(classEnrollments)
      .innerJoin(students, eq(classEnrollments.studentId, students.id))
      .innerJoin(classes, eq(classEnrollments.classId, classes.id))
      .where(eq(students.tenantId, ctx.auth.orgId))
      .orderBy(desc(classEnrollments.enrolledAt))
      .limit(5);

    return { recentAnnouncements, recentEnrollments };
  }),

  getEnrollmentTrend: adminProcedure
    .input(z.object({ months: z.number().int().min(1).max(24).default(12) }).optional())
    .query(async ({ ctx, input }) => {
      const months = input?.months ?? 12;
      const result = await ctx.db
        .select({
          month: sql<string>`to_char(${classEnrollments.enrolledAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)::int`,
        })
        .from(classEnrollments)
        .innerJoin(students, eq(classEnrollments.studentId, students.id))
        .where(
          and(
            eq(students.tenantId, ctx.auth.orgId),
            gte(
              classEnrollments.enrolledAt,
              sql`now() - interval '${sql.raw(String(months))} months'`
            )
          )
        )
        .groupBy(sql`to_char(${classEnrollments.enrolledAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${classEnrollments.enrolledAt}, 'YYYY-MM')`);

      return result;
    }),

  getAttendanceTrendAdmin: adminProcedure
    .input(z.object({ days: z.number().int().min(1).max(90).default(30) }).optional())
    .query(async ({ ctx, input }) => {
      const days = input?.days ?? 30;
      const result = await ctx.db
        .select({
          date: sql<string>`to_char(${attendanceRecords.date}, 'YYYY-MM-DD')`,
          present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
          absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
          late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.tenantId, ctx.auth.orgId),
            gte(
              attendanceRecords.date,
              sql`now() - interval '${sql.raw(String(days))} days'`
            )
          )
        )
        .groupBy(sql`to_char(${attendanceRecords.date}, 'YYYY-MM-DD')`)
        .orderBy(sql`to_char(${attendanceRecords.date}, 'YYYY-MM-DD')`);

      return result;
    }),

  getGradeDistribution: adminProcedure.query(async ({ ctx }) => {
    const result = await ctx.db
      .select({
        range: sql<string>`
          case
            when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 90 then '90-100'
            when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 80 then '80-89'
            when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 70 then '70-79'
            when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 60 then '60-69'
            else 'Below 60'
          end`,
        count: sql<number>`count(*)::int`,
      })
      .from(grades)
      .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
      .where(
        and(
          eq(grades.tenantId, ctx.auth.orgId),
          sql`${grades.score} is not null`,
          sql`${assessments.maxScore} is not null`,
          sql`cast(${assessments.maxScore} as numeric) > 0`
        )
      )
      .groupBy(
        sql`case
          when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 90 then '90-100'
          when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 80 then '80-89'
          when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 70 then '70-79'
          when cast(${grades.score} as numeric) / cast(${assessments.maxScore} as numeric) * 100 >= 60 then '60-69'
          else 'Below 60'
        end`
      );

    return result;
  }),

  getFeeCollectionTrend: adminProcedure
    .input(z.object({ months: z.number().int().min(1).max(24).default(12) }).optional())
    .query(async ({ ctx, input }) => {
      const months = input?.months ?? 12;
      const result = await ctx.db
        .select({
          month: sql<string>`to_char(${invoices.createdAt}, 'YYYY-MM')`,
          invoiced: sql<number>`coalesce(sum(cast(${invoices.amount} as numeric)), 0)`,
          collected: sql<number>`coalesce(sum(cast(${invoices.paidAmount} as numeric)), 0)`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.tenantId, ctx.auth.orgId),
            gte(
              invoices.createdAt,
              sql`now() - interval '${sql.raw(String(months))} months'`
            )
          )
        )
        .groupBy(sql`to_char(${invoices.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${invoices.createdAt}, 'YYYY-MM')`);

      return result;
    }),

  // === Teacher Procedures ===

  getTeacherClasses: protectedProcedure.query(async ({ ctx }) => {
    // Resolve teacher's userProfile
    const profile = await ctx.db.query.userProfiles.findFirst({
      where: and(
        eq(userProfiles.clerkUserId, ctx.auth.userId),
        eq(userProfiles.tenantId, ctx.auth.orgId)
      ),
    });
    if (!profile) return [];

    const sections = await ctx.db
      .select({
        id: classSections.id,
        className: classes.name,
        subjectName: subjects.name,
        subjectCode: subjects.code,
      })
      .from(classSections)
      .innerJoin(classes, eq(classSections.classId, classes.id))
      .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
      .where(
        and(
          eq(classSections.tenantId, ctx.auth.orgId),
          eq(classSections.teacherId, profile.id)
        )
      )
      .orderBy(classes.name, subjects.name);

    // Get student counts per section
    const result = await Promise.all(
      sections.map(async (section) => {
        const enrollmentCount = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(classEnrollments)
          .innerJoin(classes, eq(classEnrollments.classId, classes.id))
          .innerJoin(classSections, eq(classSections.classId, classes.id))
          .where(eq(classSections.id, section.id));

        return {
          ...section,
          studentCount: enrollmentCount[0]?.count ?? 0,
        };
      })
    );

    return result;
  }),

  getTeacherAttendanceTasks: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.userProfiles.findFirst({
      where: and(
        eq(userProfiles.clerkUserId, ctx.auth.userId),
        eq(userProfiles.tenantId, ctx.auth.orgId)
      ),
    });
    if (!profile) return [];

    const sections = await ctx.db
      .select({
        id: classSections.id,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(classSections)
      .innerJoin(classes, eq(classSections.classId, classes.id))
      .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
      .where(
        and(
          eq(classSections.tenantId, ctx.auth.orgId),
          eq(classSections.teacherId, profile.id)
        )
      );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await Promise.all(
      sections.map(async (section) => {
        const records = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.classSectionId, section.id),
              gte(attendanceRecords.date, today),
              lte(attendanceRecords.date, tomorrow)
            )
          );

        return {
          ...section,
          isMarked: (records[0]?.count ?? 0) > 0,
        };
      })
    );

    return result;
  }),

  getTeacherUpcomingAssessments: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.db.query.userProfiles.findFirst({
      where: and(
        eq(userProfiles.clerkUserId, ctx.auth.userId),
        eq(userProfiles.tenantId, ctx.auth.orgId)
      ),
    });
    if (!profile) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return ctx.db
      .select({
        id: assessments.id,
        name: assessments.name,
        type: assessments.type,
        dueDate: assessments.dueDate,
        className: classes.name,
        subjectName: subjects.name,
      })
      .from(assessments)
      .innerJoin(classSections, eq(assessments.classSectionId, classSections.id))
      .innerJoin(classes, eq(classSections.classId, classes.id))
      .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
      .where(
        and(
          eq(assessments.tenantId, ctx.auth.orgId),
          eq(classSections.teacherId, profile.id),
          gte(assessments.dueDate, today)
        )
      )
      .orderBy(assessments.dueDate)
      .limit(10);
  }),
});
