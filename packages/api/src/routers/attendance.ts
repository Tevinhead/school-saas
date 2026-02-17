import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";
import { router, protectedProcedure, teacherProcedure } from "../trpc";
import { attendanceRecords } from "@school-saas/db/schema";

export const attendanceRouter = router({
  getByClassAndDate: protectedProcedure
    .input(
      z.object({
        classSectionId: z.string().uuid(),
        date: z.date(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.query.attendanceRecords.findMany({
        where: and(
          eq(attendanceRecords.tenantId, ctx.auth.orgId),
          eq(attendanceRecords.classSectionId, input.classSectionId),
          eq(attendanceRecords.date, input.date)
        ),
      });
    }),

  getByStudent: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(attendanceRecords.tenantId, ctx.auth.orgId),
        eq(attendanceRecords.studentId, input.studentId),
      ];

      if (input.startDate) {
        conditions.push(sql`${attendanceRecords.date} >= ${input.startDate}`);
      }
      if (input.endDate) {
        conditions.push(sql`${attendanceRecords.date} <= ${input.endDate}`);
      }

      return ctx.db.query.attendanceRecords.findMany({
        where: and(...conditions),
        orderBy: (r, { desc }) => [desc(r.date)],
      });
    }),

  batchMark: teacherProcedure
    .input(
      z.object({
        classSectionId: z.string().uuid(),
        date: z.date(),
        period: z.number().int().optional(),
        records: z.array(
          z.object({
            studentId: z.string().uuid(),
            status: z.enum(["present", "absent", "late", "excused"]),
            notes: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.records.map((record) => ({
        tenantId: ctx.auth.orgId,
        studentId: record.studentId,
        classSectionId: input.classSectionId,
        date: input.date,
        status: record.status,
        period: input.period,
        notes: record.notes,
        recordedById: ctx.auth.userId,
      }));

      // Upsert: insert or update on conflict
      const result = await ctx.db
        .insert(attendanceRecords)
        .values(values)
        .onConflictDoUpdate({
          target: [attendanceRecords.studentId, attendanceRecords.date, attendanceRecords.period, attendanceRecords.classSectionId],
          set: {
            status: sql`EXCLUDED.status`,
            notes: sql`EXCLUDED.notes`,
            recordedById: sql`EXCLUDED.recorded_by_id`,
            updatedAt: new Date(),
          },
        })
        .returning();

      return result;
    }),

  dailySummary: protectedProcedure
    .input(z.object({ date: z.date() }))
    .query(async ({ ctx, input }) => {
      const summary = await ctx.db
        .select({
          status: attendanceRecords.status,
          count: sql<number>`count(*)`,
        })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.tenantId, ctx.auth.orgId),
            eq(attendanceRecords.date, input.date)
          )
        )
        .groupBy(attendanceRecords.status);

      return summary;
    }),

  getStudentStats: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(attendanceRecords.tenantId, ctx.auth.orgId),
        eq(attendanceRecords.studentId, input.studentId),
      ];

      if (input.startDate) {
        conditions.push(sql`${attendanceRecords.date} >= ${input.startDate}`);
      }
      if (input.endDate) {
        conditions.push(sql`${attendanceRecords.date} <= ${input.endDate}`);
      }

      const rows = await ctx.db
        .select({
          status: attendanceRecords.status,
          count: sql<number>`count(*)`,
        })
        .from(attendanceRecords)
        .where(and(...conditions))
        .groupBy(attendanceRecords.status);

      const stats = { present: 0, absent: 0, late: 0, excused: 0 };
      for (const row of rows) {
        const key = row.status as keyof typeof stats;
        if (key in stats) {
          stats[key] = Number(row.count);
        }
      }
      const total = stats.present + stats.absent + stats.late + stats.excused;
      const presentPercentage = total > 0 ? Math.round((stats.present / total) * 100) : 0;

      return { ...stats, total, presentPercentage };
    }),
});
