import { z } from "zod";
import { eq, and, desc, sql, gte, lte, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../trpc";
import {
  userProfiles,
  students,
  guardians,
  studentGuardians,
  attendanceRecords,
  grades,
  assessments,
  classSections,
  subjects,
  invoices,
  feeStructures,
  announcements,
  reportCards,
  terms,
  classEnrollments,
  timetableEntries,
  periods,
  classes,
} from "@school-saas/db/schema";

// Helper: resolve current user → userProfile
async function getUserProfile(db: any, clerkUserId: string, tenantId: string) {
  const profile = await db.query.userProfiles.findFirst({
    where: and(
      eq(userProfiles.clerkUserId, clerkUserId),
      eq(userProfiles.tenantId, tenantId)
    ),
  });
  if (!profile) {
    throw new TRPCError({ code: "NOT_FOUND", message: "User profile not found" });
  }
  return profile;
}

// Helper: verify caller has access to a student
async function resolveStudentAccess(
  db: any,
  userProfile: { id: string; role: string },
  studentId: string,
  tenantId: string
): Promise<void> {
  if (userProfile.role === "student") {
    // Student can only access their own record
    const student = await db.query.students.findFirst({
      where: and(
        eq(students.id, studentId),
        eq(students.tenantId, tenantId),
        eq(students.userProfileId, userProfile.id)
      ),
    });
    if (!student) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }
  } else if (userProfile.role === "parent") {
    // Parent can access children linked through guardians
    const guardian = await db.query.guardians.findFirst({
      where: and(
        eq(guardians.tenantId, tenantId),
        eq(guardians.userProfileId, userProfile.id)
      ),
    });
    if (!guardian) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied" });
    }
    const link = await db.query.studentGuardians.findFirst({
      where: and(
        eq(studentGuardians.guardianId, guardian.id),
        eq(studentGuardians.studentId, studentId)
      ),
    });
    if (!link) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Access denied to this student" });
    }
  } else if (userProfile.role === "school_admin" || userProfile.role === "super_admin" || userProfile.role === "teacher") {
    // Admins and teachers can access any student for portal preview
    return;
  } else {
    throw new TRPCError({ code: "FORBIDDEN", message: "Portal access is for students and parents only" });
  }
}

export const portalRouter = router({
  getMyContext: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);

    if (profile.role === "student") {
      const student = await ctx.db.query.students.findFirst({
        where: and(
          eq(students.tenantId, ctx.auth.orgId),
          eq(students.userProfileId, profile.id)
        ),
      });
      return {
        role: profile.role as string,
        students: student ? [student] : [],
      };
    }

    if (profile.role === "parent") {
      const guardian = await ctx.db.query.guardians.findFirst({
        where: and(
          eq(guardians.tenantId, ctx.auth.orgId),
          eq(guardians.userProfileId, profile.id)
        ),
      });

      if (!guardian) return { role: profile.role as string, students: [] };

      // Get linked students
      const links = await ctx.db
        .select({ studentId: studentGuardians.studentId })
        .from(studentGuardians)
        .where(eq(studentGuardians.guardianId, guardian.id));

      if (links.length === 0) return { role: profile.role as string, students: [] };

      const linkedStudents = await Promise.all(
        links.map(async (link) => {
          return ctx.db.query.students.findFirst({
            where: eq(students.id, link.studentId),
          });
        })
      );

      return {
        role: profile.role as string,
        students: linkedStudents.filter(Boolean),
      };
    }

    // Admins and teachers can preview the portal — return first 5 students
    if (profile.role === "school_admin" || profile.role === "super_admin" || profile.role === "teacher") {
      const allStudents = await ctx.db.query.students.findMany({
        where: eq(students.tenantId, ctx.auth.orgId),
        limit: 5,
      });
      return { role: profile.role as string, students: allStudents };
    }

    return { role: profile.role as string, students: [] };
  }),

  getStudentSummary: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      // Attendance stats
      const attendanceStats = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
          absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
          late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
          excused: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'excused')::int`,
        })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.studentId, input.studentId),
            eq(attendanceRecords.tenantId, ctx.auth.orgId)
          )
        );

      const stats = attendanceStats[0] ?? { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
      const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

      // Recent grades
      const recentGrades = await ctx.db
        .select({
          score: grades.score,
          letterGrade: grades.letterGrade,
          assessmentName: assessments.name,
          subjectName: subjects.name,
          maxScore: assessments.maxScore,
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .innerJoin(classSections, eq(assessments.classSectionId, classSections.id))
        .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
        .where(
          and(
            eq(grades.studentId, input.studentId),
            eq(grades.tenantId, ctx.auth.orgId)
          )
        )
        .orderBy(desc(grades.createdAt))
        .limit(5);

      // Fee summary
      const feeStats = await ctx.db
        .select({
          totalInvoiced: sql<number>`coalesce(sum(cast(${invoices.amount} as numeric)), 0)`,
          totalPaid: sql<number>`coalesce(sum(cast(${invoices.paidAmount} as numeric)), 0)`,
          outstanding: sql<number>`coalesce(sum(cast(${invoices.amount} as numeric) - cast(${invoices.paidAmount} as numeric)), 0)`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.studentId, input.studentId),
            eq(invoices.tenantId, ctx.auth.orgId)
          )
        );

      // Recent announcements count
      const announcementCount = await ctx.db
        .select({ count: sql<number>`count(*)::int` })
        .from(announcements)
        .where(
          and(
            eq(announcements.tenantId, ctx.auth.orgId),
            eq(announcements.isPublished, true),
            or(
              eq(announcements.audience, "all"),
              eq(announcements.audience, "parents")
            )
          )
        );

      return {
        attendance: { ...stats, rate: attendanceRate },
        recentGrades,
        fees: feeStats[0] ?? { totalInvoiced: 0, totalPaid: 0, outstanding: 0 },
        announcementCount: announcementCount[0]?.count ?? 0,
      };
    }),

  getStudentAttendance: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      const conditions = [
        eq(attendanceRecords.studentId, input.studentId),
        eq(attendanceRecords.tenantId, ctx.auth.orgId),
      ];
      if (input.startDate) conditions.push(gte(attendanceRecords.date, input.startDate));
      if (input.endDate) conditions.push(lte(attendanceRecords.date, input.endDate));

      return ctx.db.query.attendanceRecords.findMany({
        where: and(...conditions),
        orderBy: (a, { desc: d }) => [d(a.date)],
      });
    }),

  getStudentAttendanceStats: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      const result = await ctx.db
        .select({
          total: sql<number>`count(*)::int`,
          present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
          absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
          late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
          excused: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'excused')::int`,
        })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.studentId, input.studentId),
            eq(attendanceRecords.tenantId, ctx.auth.orgId)
          )
        );

      const stats = result[0] ?? { total: 0, present: 0, absent: 0, late: 0, excused: 0 };
      return {
        ...stats,
        presentPercentage: stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0,
      };
    }),

  getStudentGrades: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      const rows = await ctx.db
        .select({
          assessmentId: assessments.id,
          assessmentName: assessments.name,
          assessmentType: assessments.type,
          maxScore: assessments.maxScore,
          weight: assessments.weight,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          score: grades.score,
          letterGrade: grades.letterGrade,
          comments: grades.comments,
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .innerJoin(classSections, eq(assessments.classSectionId, classSections.id))
        .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
        .where(
          and(
            eq(grades.studentId, input.studentId),
            eq(grades.tenantId, ctx.auth.orgId)
          )
        )
        .orderBy(subjects.name, assessments.name);

      // Group by subject
      const grouped: Record<
        string,
        {
          subjectName: string;
          subjectCode: string;
          grades: typeof rows;
          weightedAverage: number;
        }
      > = {};

      for (const row of rows) {
        const key = row.subjectCode;
        if (!grouped[key]) {
          grouped[key] = {
            subjectName: row.subjectName,
            subjectCode: row.subjectCode,
            grades: [],
            weightedAverage: 0,
          };
        }
        grouped[key].grades.push(row);
      }

      // Calculate weighted averages
      for (const group of Object.values(grouped)) {
        let totalWeight = 0;
        let weightedSum = 0;
        for (const g of group.grades) {
          if (g.score && g.maxScore && g.weight) {
            const pct = (parseFloat(g.score) / parseFloat(g.maxScore)) * 100;
            const w = parseFloat(g.weight);
            weightedSum += pct * w;
            totalWeight += w;
          }
        }
        group.weightedAverage = totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
      }

      return Object.values(grouped);
    }),

  getStudentFees: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        status: z.enum(["pending", "partial", "paid", "overdue", "cancelled"]).optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      const conditions = [
        eq(invoices.studentId, input.studentId),
        eq(invoices.tenantId, ctx.auth.orgId),
      ];
      if (input.status) conditions.push(eq(invoices.status, input.status));

      return ctx.db
        .select({
          id: invoices.id,
          amount: invoices.amount,
          currency: invoices.currency,
          dueDate: invoices.dueDate,
          status: invoices.status,
          paidAmount: invoices.paidAmount,
          feeStructureName: feeStructures.name,
          createdAt: invoices.createdAt,
        })
        .from(invoices)
        .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
        .where(and(...conditions))
        .orderBy(desc(invoices.createdAt));
    }),

  getStudentFeeStats: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      const result = await ctx.db
        .select({
          totalInvoiced: sql<number>`coalesce(sum(cast(${invoices.amount} as numeric)), 0)`,
          totalCollected: sql<number>`coalesce(sum(cast(${invoices.paidAmount} as numeric)), 0)`,
          outstanding: sql<number>`coalesce(sum(cast(${invoices.amount} as numeric) - cast(${invoices.paidAmount} as numeric)), 0)`,
          overdueCount: sql<number>`count(*) filter (where ${invoices.status} = 'overdue')::int`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.studentId, input.studentId),
            eq(invoices.tenantId, ctx.auth.orgId)
          )
        );

      return result[0] ?? { totalInvoiced: 0, totalCollected: 0, outstanding: 0, overdueCount: 0 };
    }),

  getAnnouncements: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        audience: announcements.audience,
        publishedAt: announcements.publishedAt,
        createdAt: announcements.createdAt,
        authorFirstName: userProfiles.firstName,
        authorLastName: userProfiles.lastName,
      })
      .from(announcements)
      .leftJoin(userProfiles, eq(announcements.authorId, userProfiles.id))
      .where(
        and(
          eq(announcements.tenantId, ctx.auth.orgId),
          eq(announcements.isPublished, true),
          or(
            eq(announcements.audience, "all"),
            eq(announcements.audience, "parents")
          )
        )
      )
      .orderBy(desc(announcements.createdAt));
  }),

  getStudentReportCards: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      return ctx.db
        .select({
          id: reportCards.id,
          termId: reportCards.termId,
          status: reportCards.status,
          createdAt: reportCards.createdAt,
          termName: terms.name,
          pdfUrl: reportCards.pdfUrl,
        })
        .from(reportCards)
        .innerJoin(terms, eq(reportCards.termId, terms.id))
        .where(
          and(
            eq(reportCards.studentId, input.studentId),
            eq(reportCards.tenantId, ctx.auth.orgId),
            eq(reportCards.status, "published")
          )
        )
        .orderBy(desc(reportCards.createdAt));
    }),

  getReportCardDetail: protectedProcedure
    .input(z.object({ reportCardId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rc = await ctx.db.query.reportCards.findFirst({
        where: and(
          eq(reportCards.id, input.reportCardId),
          eq(reportCards.tenantId, ctx.auth.orgId),
          eq(reportCards.status, "published")
        ),
      });

      if (!rc) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Report card not found" });
      }

      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, rc.studentId, ctx.auth.orgId);

      // Get term info
      const term = await ctx.db.query.terms.findFirst({
        where: eq(terms.id, rc.termId),
      });

      // Get student info
      const student = await ctx.db.query.students.findFirst({
        where: eq(students.id, rc.studentId),
      });

      // Get grades for this student in the term's class sections
      const studentGrades = await ctx.db
        .select({
          subjectName: subjects.name,
          subjectCode: subjects.code,
          assessmentName: assessments.name,
          score: grades.score,
          maxScore: assessments.maxScore,
          letterGrade: grades.letterGrade,
          weight: assessments.weight,
        })
        .from(grades)
        .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
        .innerJoin(classSections, eq(assessments.classSectionId, classSections.id))
        .innerJoin(subjects, eq(classSections.subjectId, subjects.id))
        .where(
          and(
            eq(grades.studentId, rc.studentId),
            eq(grades.tenantId, ctx.auth.orgId)
          )
        )
        .orderBy(subjects.name, assessments.name);

      return {
        reportCard: rc,
        term,
        student,
        grades: studentGrades,
      };
    }),

  getAttendanceTrend: protectedProcedure
    .input(z.object({ studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      // Monthly attendance data
      const result = await ctx.db
        .select({
          month: sql<string>`to_char(${attendanceRecords.date}, 'YYYY-MM')`,
          total: sql<number>`count(*)::int`,
          present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
          absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
          late: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'late')::int`,
        })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.studentId, input.studentId),
            eq(attendanceRecords.tenantId, ctx.auth.orgId)
          )
        )
        .groupBy(sql`to_char(${attendanceRecords.date}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${attendanceRecords.date}, 'YYYY-MM')`);

      return result;
    }),

  getStudentTimetable: protectedProcedure
    .input(z.object({ studentId: z.string().uuid(), termId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const profile = await getUserProfile(ctx.db, ctx.auth.userId, ctx.auth.orgId);
      await resolveStudentAccess(ctx.db, profile, input.studentId, ctx.auth.orgId);

      // Get student's class
      const enrollment = await ctx.db
        .select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .where(eq(classEnrollments.studentId, input.studentId))
        .limit(1);

      if (enrollment.length === 0) return [];

      return ctx.db
        .select({
          id: timetableEntries.id,
          periodId: timetableEntries.periodId,
          dayOfWeek: timetableEntries.dayOfWeek,
          room: timetableEntries.room,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          teacherFirstName: userProfiles.firstName,
          teacherLastName: userProfiles.lastName,
          periodName: periods.name,
          periodShortName: periods.shortName,
          periodSortOrder: periods.sortOrder,
          periodStartTime: periods.startTime,
          periodEndTime: periods.endTime,
          periodIsBreak: periods.isBreak,
        })
        .from(timetableEntries)
        .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
        .innerJoin(userProfiles, eq(timetableEntries.teacherId, userProfiles.id))
        .innerJoin(periods, eq(timetableEntries.periodId, periods.id))
        .where(
          and(
            eq(timetableEntries.tenantId, ctx.auth.orgId),
            eq(timetableEntries.termId, input.termId),
            eq(timetableEntries.classId, enrollment[0].classId)
          )
        )
        .orderBy(periods.sortOrder);
    }),

  listPeriods: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(periods)
      .where(eq(periods.tenantId, ctx.auth.orgId))
      .orderBy(periods.sortOrder);
  }),

  listTerms: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.terms.findMany({
      where: eq(terms.tenantId, ctx.auth.orgId),
      orderBy: (t, { asc }) => [asc(t.startDate)],
    });
  }),
});
