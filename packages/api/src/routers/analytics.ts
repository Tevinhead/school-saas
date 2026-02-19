import { z } from "zod";
import { eq, and, sql, count, gte, lte, lt, desc } from "drizzle-orm";
import { router, adminProcedure } from "../trpc";
import {
  students,
  classEnrollments,
  attendanceRecords,
  grades,
  assessments,
  invoices,
  payments,
  gradeLevels,
  academicYears,
  classes,
} from "@school-saas/db/schema";

export const analyticsRouter = router({
  // 1. Enrollment Trends — count enrollments by academic year + grade level
  enrollmentTrends: adminProcedure.query(async ({ ctx }) => {
    try {
      const result = await ctx.db
        .select({
          year: academicYears.name,
          gradeLevel: gradeLevels.name,
          count: sql<number>`count(*)::int`,
        })
        .from(classEnrollments)
        .innerJoin(classes, eq(classEnrollments.classId, classes.id))
        .innerJoin(academicYears, eq(classes.academicYearId, academicYears.id))
        .innerJoin(gradeLevels, eq(classes.gradeLevelId, gradeLevels.id))
        .innerJoin(students, eq(classEnrollments.studentId, students.id))
        .where(eq(students.tenantId, ctx.auth.orgId))
        .groupBy(academicYears.name, gradeLevels.name)
        .orderBy(academicYears.name, gradeLevels.name);

      return result;
    } catch (error) {
      console.error("[analytics.enrollmentTrends]", error);
      return [];
    }
  }),

  // 2. Attendance Trends — weekly rates + chronically absent students
  attendanceTrends: adminProcedure
    .input(
      z
        .object({
          academicYearId: z.string().uuid().optional(),
          weeks: z.number().int().min(1).max(52).default(12),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const weeks = input?.weeks ?? 12;

        // Weekly attendance rates
        const weeklyRates = await ctx.db
          .select({
            week: sql<string>`to_char(${attendanceRecords.date}, 'IYYY-IW')`,
            rate: sql<number>`round(
              count(*) filter (where ${attendanceRecords.status} = 'present')::numeric
              / nullif(count(*)::numeric, 0) * 100
            , 1)`,
          })
          .from(attendanceRecords)
          .where(
            and(
              eq(attendanceRecords.tenantId, ctx.auth.orgId),
              gte(
                attendanceRecords.date,
                sql`now() - interval '${sql.raw(String(weeks))} weeks'`
              )
            )
          )
          .groupBy(sql`to_char(${attendanceRecords.date}, 'IYYY-IW')`)
          .orderBy(sql`to_char(${attendanceRecords.date}, 'IYYY-IW')`);

        // Chronically absent students (< 80% attendance rate)
        const chronicAbsent = await ctx.db
          .select({
            studentId: attendanceRecords.studentId,
            studentName: sql<string>`${students.firstName} || ' ' || ${students.lastName}`,
            rate: sql<number>`round(
              count(*) filter (where ${attendanceRecords.status} = 'present')::numeric
              / nullif(count(*)::numeric, 0) * 100
            , 1)`,
          })
          .from(attendanceRecords)
          .innerJoin(students, eq(attendanceRecords.studentId, students.id))
          .where(eq(attendanceRecords.tenantId, ctx.auth.orgId))
          .groupBy(attendanceRecords.studentId, students.firstName, students.lastName)
          .having(
            sql`count(*) filter (where ${attendanceRecords.status} = 'present')::numeric
                / nullif(count(*)::numeric, 0) < 0.8`
          )
          .orderBy(
            sql`count(*) filter (where ${attendanceRecords.status} = 'present')::numeric
                / nullif(count(*)::numeric, 0)`
          );

        return {
          weeklyRates: weeklyRates.map((r) => ({
            week: r.week,
            rate: Number(r.rate ?? 0),
          })),
          chronicAbsent: chronicAbsent.map((s) => ({
            studentId: s.studentId,
            studentName: s.studentName,
            rate: Number(s.rate ?? 0),
          })),
        };
      } catch (error) {
        console.error("[analytics.attendanceTrends]", error);
        return { weeklyRates: [], chronicAbsent: [] };
      }
    }),

  // 3. Grade Distribution — bucket scores into A/B/C/D/F
  gradeDistribution: adminProcedure
    .input(
      z
        .object({
          subjectId: z.string().uuid().optional(),
          termId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      try {
        const conditions = [
          eq(grades.tenantId, ctx.auth.orgId),
          sql`${grades.score} is not null`,
        ];

        // Note: filtering by subjectId or termId would require joining classSections
        // For now we use the basic grade bucketing based on raw score

        const result = await ctx.db
          .select({
            range: sql<string>`
              case
                when cast(${grades.score} as numeric) >= 90 then 'A'
                when cast(${grades.score} as numeric) >= 80 then 'B'
                when cast(${grades.score} as numeric) >= 70 then 'C'
                when cast(${grades.score} as numeric) >= 60 then 'D'
                else 'F'
              end`,
            count: sql<number>`count(*)::int`,
          })
          .from(grades)
          .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
          .where(and(...conditions))
          .groupBy(
            sql`case
              when cast(${grades.score} as numeric) >= 90 then 'A'
              when cast(${grades.score} as numeric) >= 80 then 'B'
              when cast(${grades.score} as numeric) >= 70 then 'C'
              when cast(${grades.score} as numeric) >= 60 then 'D'
              else 'F'
            end`
          );

        return {
          distribution: result.map((r) => ({
            range: r.range,
            count: r.count,
          })),
        };
      } catch (error) {
        console.error("[analytics.gradeDistribution]", error);
        return { distribution: [] };
      }
    }),

  // 4. Fee Aging — group overdue invoices by aging bucket
  feeAging: adminProcedure.query(async ({ ctx }) => {
    try {
      const buckets = await ctx.db
        .select({
          bucket: sql<string>`
            case
              when extract(day from now() - ${invoices.dueDate}) <= 30 then '0-30'
              when extract(day from now() - ${invoices.dueDate}) <= 60 then '31-60'
              when extract(day from now() - ${invoices.dueDate}) <= 90 then '61-90'
              else '90+'
            end`,
          count: sql<number>`count(*)::int`,
          totalAmount: sql<string>`coalesce(sum(cast(${invoices.amount} as numeric) - cast(${invoices.paidAmount} as numeric)), 0)::text`,
        })
        .from(invoices)
        .where(
          and(
            eq(invoices.tenantId, ctx.auth.orgId),
            sql`(${invoices.status} = 'overdue' or (${invoices.status} = 'pending' and ${invoices.dueDate} < now()))`
          )
        )
        .groupBy(
          sql`case
            when extract(day from now() - ${invoices.dueDate}) <= 30 then '0-30'
            when extract(day from now() - ${invoices.dueDate}) <= 60 then '31-60'
            when extract(day from now() - ${invoices.dueDate}) <= 90 then '61-90'
            else '90+'
          end`
        );

      // Collection rate: sum paidAmount / sum amount across all invoices
      const [totals] = await ctx.db
        .select({
          totalInvoiced: sql<number>`coalesce(sum(cast(${invoices.amount} as numeric)), 0)`,
          totalCollected: sql<number>`coalesce(sum(cast(${invoices.paidAmount} as numeric)), 0)`,
        })
        .from(invoices)
        .where(eq(invoices.tenantId, ctx.auth.orgId));

      const invoiced = Number(totals?.totalInvoiced ?? 0);
      const collected = Number(totals?.totalCollected ?? 0);
      const collectionRate = invoiced > 0 ? Math.round((collected / invoiced) * 100) : 0;

      return {
        buckets: buckets.map((b) => ({
          bucket: b.bucket,
          count: b.count,
          totalAmount: b.totalAmount,
        })),
        collectionRate,
      };
    } catch (error) {
      console.error("[analytics.feeAging]", error);
      return { buckets: [], collectionRate: 0 };
    }
  }),

  // 5. Teacher Workload — count sections and students per teacher
  teacherWorkload: adminProcedure.query(async ({ ctx }) => {
    try {
      const { classSections } = await import("@school-saas/db/schema");
      const { userProfiles } = await import("@school-saas/db/schema");

      const result = await ctx.db
        .select({
          teacherId: classSections.teacherId,
          sectionCount: sql<number>`count(distinct ${classSections.id})::int`,
          studentCount: sql<number>`count(distinct ${classEnrollments.studentId})::int`,
        })
        .from(classSections)
        .leftJoin(classEnrollments, eq(classSections.classId, classEnrollments.classId))
        .where(
          and(
            eq(classSections.tenantId, ctx.auth.orgId),
            sql`${classSections.teacherId} is not null`
          )
        )
        .groupBy(classSections.teacherId);

      return result.map((r) => ({
        teacherId: r.teacherId ?? "",
        sectionCount: r.sectionCount,
        studentCount: r.studentCount,
      }));
    } catch (error) {
      console.error("[analytics.teacherWorkload]", error);
      return [];
    }
  }),

  // 6. Export CSV — generate CSV string for download
  exportCsv: adminProcedure
    .input(
      z.object({
        type: z.enum(["enrollment", "attendance", "grades", "fees"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        if (input.type === "enrollment") {
          const rows = await ctx.db
            .select({
              firstName: students.firstName,
              lastName: students.lastName,
              gradeLevel: gradeLevels.name,
              enrolledAt: classEnrollments.enrolledAt,
            })
            .from(classEnrollments)
            .innerJoin(students, eq(classEnrollments.studentId, students.id))
            .innerJoin(classes, eq(classEnrollments.classId, classes.id))
            .innerJoin(gradeLevels, eq(classes.gradeLevelId, gradeLevels.id))
            .where(eq(students.tenantId, ctx.auth.orgId))
            .orderBy(students.lastName, students.firstName);

          const header = "First Name,Last Name,Grade Level,Enrollment Date";
          const lines = rows.map(
            (r) =>
              `"${r.firstName}","${r.lastName}","${r.gradeLevel}","${r.enrolledAt?.toISOString().split("T")[0] ?? ""}"`
          );
          return [header, ...lines].join("\n");
        }

        if (input.type === "attendance") {
          const rows = await ctx.db
            .select({
              firstName: students.firstName,
              lastName: students.lastName,
              total: sql<number>`count(*)::int`,
              present: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'present')::int`,
              absent: sql<number>`count(*) filter (where ${attendanceRecords.status} = 'absent')::int`,
            })
            .from(attendanceRecords)
            .innerJoin(students, eq(attendanceRecords.studentId, students.id))
            .where(eq(attendanceRecords.tenantId, ctx.auth.orgId))
            .groupBy(students.id, students.firstName, students.lastName)
            .orderBy(students.lastName, students.firstName);

          const header = "First Name,Last Name,Present Days,Absent Days,Rate (%)";
          const lines = rows.map((r) => {
            const rate = r.total > 0 ? Math.round((r.present / r.total) * 100) : 0;
            return `"${r.firstName}","${r.lastName}",${r.present},${r.absent},${rate}`;
          });
          return [header, ...lines].join("\n");
        }

        if (input.type === "grades") {
          const rows = await ctx.db
            .select({
              firstName: students.firstName,
              lastName: students.lastName,
              assessmentName: assessments.name,
              score: grades.score,
              letterGrade: grades.letterGrade,
            })
            .from(grades)
            .innerJoin(students, eq(grades.studentId, students.id))
            .innerJoin(assessments, eq(grades.assessmentId, assessments.id))
            .where(eq(grades.tenantId, ctx.auth.orgId))
            .orderBy(students.lastName, students.firstName);

          const header = "First Name,Last Name,Assessment,Score,Letter Grade";
          const lines = rows.map(
            (r) =>
              `"${r.firstName}","${r.lastName}","${r.assessmentName}",${r.score ?? ""},${r.letterGrade ?? ""}`
          );
          return [header, ...lines].join("\n");
        }

        if (input.type === "fees") {
          const rows = await ctx.db
            .select({
              firstName: students.firstName,
              lastName: students.lastName,
              amount: invoices.amount,
              paidAmount: invoices.paidAmount,
              dueDate: invoices.dueDate,
              status: invoices.status,
            })
            .from(invoices)
            .innerJoin(students, eq(invoices.studentId, students.id))
            .where(eq(invoices.tenantId, ctx.auth.orgId))
            .orderBy(desc(invoices.dueDate));

          const header = "First Name,Last Name,Amount,Paid Amount,Due Date,Status";
          const lines = rows.map(
            (r) =>
              `"${r.firstName}","${r.lastName}",${r.amount},${r.paidAmount},"${r.dueDate?.toISOString().split("T")[0] ?? ""}","${r.status}"`
          );
          return [header, ...lines].join("\n");
        }

        return "";
      } catch (error) {
        console.error("[analytics.exportCsv]", error);
        return "";
      }
    }),
});
