import { z } from "zod";
import { eq, and, sql, ne, desc, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure, adminProcedure, teacherProcedure } from "../trpc";
import {
  periods,
  timetableEntries,
  substitutions,
  subjects,
  classes,
  userProfiles,
  classSections,
  classEnrollments,
  students,
  terms,
} from "@school-saas/db/schema";
import {
  createPeriodSchema,
  updatePeriodSchema,
  createTimetableEntrySchema,
  updateTimetableEntrySchema,
  bulkCreateTimetableEntriesSchema,
  duplicateTimetableSchema,
  createSubstitutionSchema,
  bulkCreateSubstitutionsSchema,
  dayOfWeekEnum,
} from "@school-saas/validators";

// Helper: detect conflicts for a given slot
async function detectConflicts(
  db: any,
  tenantId: string,
  termId: string,
  periodId: string,
  dayOfWeek: string,
  teacherId?: string,
  room?: string | null,
  excludeEntryId?: string
) {
  const conflicts: { type: "teacher" | "room"; entry: any }[] = [];

  // Teacher double-booking check
  if (teacherId) {
    const teacherConditions = [
      eq(timetableEntries.tenantId, tenantId),
      eq(timetableEntries.termId, termId),
      eq(timetableEntries.periodId, periodId),
      eq(timetableEntries.dayOfWeek, dayOfWeek),
      eq(timetableEntries.teacherId, teacherId),
    ];
    if (excludeEntryId) {
      teacherConditions.push(ne(timetableEntries.id, excludeEntryId));
    }

    const teacherConflicts = await db
      .select({
        id: timetableEntries.id,
        className: classes.name,
        subjectName: subjects.name,
        teacherFirst: userProfiles.firstName,
        teacherLast: userProfiles.lastName,
      })
      .from(timetableEntries)
      .innerJoin(classes, eq(timetableEntries.classId, classes.id))
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .innerJoin(userProfiles, eq(timetableEntries.teacherId, userProfiles.id))
      .where(and(...teacherConditions));

    for (const c of teacherConflicts) {
      conflicts.push({ type: "teacher", entry: c });
    }
  }

  // Room overlap check
  if (room) {
    const roomConditions = [
      eq(timetableEntries.tenantId, tenantId),
      eq(timetableEntries.termId, termId),
      eq(timetableEntries.periodId, periodId),
      eq(timetableEntries.dayOfWeek, dayOfWeek),
      eq(timetableEntries.room, room),
    ];
    if (excludeEntryId) {
      roomConditions.push(ne(timetableEntries.id, excludeEntryId));
    }

    const roomConflicts = await db
      .select({
        id: timetableEntries.id,
        className: classes.name,
        subjectName: subjects.name,
        teacherFirst: userProfiles.firstName,
        teacherLast: userProfiles.lastName,
        room: timetableEntries.room,
      })
      .from(timetableEntries)
      .innerJoin(classes, eq(timetableEntries.classId, classes.id))
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .innerJoin(userProfiles, eq(timetableEntries.teacherId, userProfiles.id))
      .where(and(...roomConditions));

    for (const c of roomConflicts) {
      conflicts.push({ type: "room", entry: c });
    }
  }

  return conflicts;
}

export const timetableRouter = router({
  // ---- Terms list (for dropdowns) ----

  listTerms: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(terms)
      .where(eq(terms.tenantId, ctx.auth.orgId))
      .orderBy(terms.startDate);
  }),

  // ---- Teachers list (for dropdowns) ----

  listTeachers: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select({
        id: userProfiles.id,
        firstName: userProfiles.firstName,
        lastName: userProfiles.lastName,
        email: userProfiles.email,
      })
      .from(userProfiles)
      .where(
        and(
          eq(userProfiles.tenantId, ctx.auth.orgId),
          eq(userProfiles.role, "teacher")
        )
      )
      .orderBy(userProfiles.lastName, userProfiles.firstName);
  }),

  // ---- Period CRUD ----

  listPeriods: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(periods)
      .where(eq(periods.tenantId, ctx.auth.orgId))
      .orderBy(periods.sortOrder);
  }),

  createPeriod: adminProcedure
    .input(createPeriodSchema)
    .mutation(async ({ ctx, input }) => {
      const [period] = await ctx.db
        .insert(periods)
        .values({
          tenantId: ctx.auth.orgId,
          name: input.name,
          shortName: input.shortName,
          sortOrder: input.sortOrder,
          startTime: input.startTime,
          endTime: input.endTime,
          isBreak: input.isBreak,
        })
        .returning();
      return period;
    }),

  updatePeriod: adminProcedure
    .input(updatePeriodSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const filtered = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );
      if (Object.keys(filtered).length === 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No fields to update" });
      }
      const [updated] = await ctx.db
        .update(periods)
        .set({ ...filtered, updatedAt: new Date() })
        .where(and(eq(periods.id, id), eq(periods.tenantId, ctx.auth.orgId)))
        .returning();
      if (!updated) throw new TRPCError({ code: "NOT_FOUND", message: "Period not found" });
      return updated;
    }),

  deletePeriod: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(periods)
        .where(and(eq(periods.id, input.id), eq(periods.tenantId, ctx.auth.orgId)))
        .returning();
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Period not found" });
      return deleted;
    }),

  reorderPeriods: adminProcedure
    .input(z.object({ orderedIds: z.array(z.string().uuid()) }))
    .mutation(async ({ ctx, input }) => {
      for (let i = 0; i < input.orderedIds.length; i++) {
        await ctx.db
          .update(periods)
          .set({ sortOrder: i, updatedAt: new Date() })
          .where(and(eq(periods.id, input.orderedIds[i]), eq(periods.tenantId, ctx.auth.orgId)));
      }
      return { success: true };
    }),

  // ---- Timetable Entry Management ----

  listEntries: protectedProcedure
    .input(z.object({ termId: z.string().uuid(), classId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          id: timetableEntries.id,
          termId: timetableEntries.termId,
          classId: timetableEntries.classId,
          periodId: timetableEntries.periodId,
          dayOfWeek: timetableEntries.dayOfWeek,
          subjectId: timetableEntries.subjectId,
          teacherId: timetableEntries.teacherId,
          room: timetableEntries.room,
          classSectionId: timetableEntries.classSectionId,
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
            eq(timetableEntries.classId, input.classId)
          )
        )
        .orderBy(periods.sortOrder);
    }),

  createEntry: adminProcedure
    .input(createTimetableEntrySchema)
    .mutation(async ({ ctx, input }) => {
      // Check conflicts
      const conflicts = await detectConflicts(
        ctx.db, ctx.auth.orgId, input.termId, input.periodId,
        input.dayOfWeek, input.teacherId, input.room
      );
      if (conflicts.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Scheduling conflict detected: ${conflicts.map(c => `${c.type} conflict with ${c.entry.className} - ${c.entry.subjectName}`).join("; ")}`,
        });
      }

      const [entry] = await ctx.db
        .insert(timetableEntries)
        .values({
          tenantId: ctx.auth.orgId,
          termId: input.termId,
          classId: input.classId,
          periodId: input.periodId,
          dayOfWeek: input.dayOfWeek,
          subjectId: input.subjectId,
          teacherId: input.teacherId,
          room: input.room ?? null,
          classSectionId: input.classSectionId ?? null,
        })
        .returning();
      return entry;
    }),

  updateEntry: adminProcedure
    .input(updateTimetableEntrySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;

      // Get current entry to know period/day/term for conflict check
      const existing = await ctx.db
        .select()
        .from(timetableEntries)
        .where(and(eq(timetableEntries.id, id), eq(timetableEntries.tenantId, ctx.auth.orgId)));

      if (!existing[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      const entry = existing[0];

      const newTeacherId = updates.teacherId ?? entry.teacherId;
      const newRoom = updates.room !== undefined ? updates.room : entry.room;

      const conflicts = await detectConflicts(
        ctx.db, ctx.auth.orgId, entry.termId, entry.periodId,
        entry.dayOfWeek, newTeacherId, newRoom, id
      );
      if (conflicts.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: `Scheduling conflict detected: ${conflicts.map(c => `${c.type} conflict with ${c.entry.className} - ${c.entry.subjectName}`).join("; ")}`,
        });
      }

      const filtered = Object.fromEntries(
        Object.entries(updates).filter(([, v]) => v !== undefined)
      );
      const [updated] = await ctx.db
        .update(timetableEntries)
        .set({ ...filtered, updatedAt: new Date() })
        .where(and(eq(timetableEntries.id, id), eq(timetableEntries.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteEntry: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(timetableEntries)
        .where(and(eq(timetableEntries.id, input.id), eq(timetableEntries.tenantId, ctx.auth.orgId)))
        .returning();
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      return deleted;
    }),

  bulkCreateEntries: adminProcedure
    .input(bulkCreateTimetableEntriesSchema)
    .mutation(async ({ ctx, input }) => {
      // Delete existing entries for this class/term first
      await ctx.db
        .delete(timetableEntries)
        .where(
          and(
            eq(timetableEntries.tenantId, ctx.auth.orgId),
            eq(timetableEntries.termId, input.termId),
            eq(timetableEntries.classId, input.classId)
          )
        );

      if (input.entries.length === 0) return [];

      const values = input.entries.map((e) => ({
        tenantId: ctx.auth.orgId,
        termId: input.termId,
        classId: input.classId,
        periodId: e.periodId,
        dayOfWeek: e.dayOfWeek,
        subjectId: e.subjectId,
        teacherId: e.teacherId,
        room: e.room ?? null,
        classSectionId: e.classSectionId ?? null,
      }));

      return ctx.db.insert(timetableEntries).values(values).returning();
    }),

  clearClassTimetable: adminProcedure
    .input(z.object({ termId: z.string().uuid(), classId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(timetableEntries)
        .where(
          and(
            eq(timetableEntries.tenantId, ctx.auth.orgId),
            eq(timetableEntries.termId, input.termId),
            eq(timetableEntries.classId, input.classId)
          )
        )
        .returning();
      return { deletedCount: deleted.length };
    }),

  duplicateTimetable: adminProcedure
    .input(duplicateTimetableSchema)
    .mutation(async ({ ctx, input }) => {
      const conditions = [
        eq(timetableEntries.tenantId, ctx.auth.orgId),
        eq(timetableEntries.termId, input.fromTermId),
      ];
      if (input.classId) {
        conditions.push(eq(timetableEntries.classId, input.classId));
      }

      const sourceEntries = await ctx.db
        .select()
        .from(timetableEntries)
        .where(and(...conditions));

      if (sourceEntries.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No entries found to duplicate" });
      }

      const newValues = sourceEntries.map((e: any) => ({
        tenantId: ctx.auth.orgId,
        termId: input.toTermId,
        classId: e.classId,
        periodId: e.periodId,
        dayOfWeek: e.dayOfWeek,
        subjectId: e.subjectId,
        teacherId: e.teacherId,
        room: e.room,
        classSectionId: e.classSectionId,
      }));

      const inserted = await ctx.db
        .insert(timetableEntries)
        .values(newValues)
        .onConflictDoNothing()
        .returning();

      return { duplicatedCount: inserted.length };
    }),

  // ---- Conflict Detection ----

  checkConflicts: protectedProcedure
    .input(
      z.object({
        termId: z.string().uuid(),
        periodId: z.string().uuid(),
        dayOfWeek: z.enum(dayOfWeekEnum),
        teacherId: z.string().uuid().optional(),
        room: z.string().optional(),
        excludeEntryId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      return detectConflicts(
        ctx.db, ctx.auth.orgId, input.termId, input.periodId,
        input.dayOfWeek, input.teacherId, input.room ?? null,
        input.excludeEntryId
      );
    }),

  // ---- Personal Views ----

  getTeacherTimetable: protectedProcedure
    .input(z.object({ termId: z.string().uuid(), teacherId: z.string().uuid().optional() }))
    .query(async ({ ctx, input }) => {
      // If no teacherId provided, resolve from current user
      let teacherId = input.teacherId;
      if (!teacherId) {
        const profile = await ctx.db.query.userProfiles.findFirst({
          where: and(
            eq(userProfiles.clerkUserId, ctx.auth.userId),
            eq(userProfiles.tenantId, ctx.auth.orgId)
          ),
        });
        if (!profile) throw new TRPCError({ code: "NOT_FOUND", message: "User profile not found" });
        teacherId = profile.id;
      }

      const entries = await ctx.db
        .select({
          id: timetableEntries.id,
          termId: timetableEntries.termId,
          classId: timetableEntries.classId,
          periodId: timetableEntries.periodId,
          dayOfWeek: timetableEntries.dayOfWeek,
          subjectId: timetableEntries.subjectId,
          teacherId: timetableEntries.teacherId,
          room: timetableEntries.room,
          className: classes.name,
          subjectName: subjects.name,
          subjectCode: subjects.code,
          periodName: periods.name,
          periodShortName: periods.shortName,
          periodSortOrder: periods.sortOrder,
          periodStartTime: periods.startTime,
          periodEndTime: periods.endTime,
          periodIsBreak: periods.isBreak,
        })
        .from(timetableEntries)
        .innerJoin(classes, eq(timetableEntries.classId, classes.id))
        .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
        .innerJoin(periods, eq(timetableEntries.periodId, periods.id))
        .where(
          and(
            eq(timetableEntries.tenantId, ctx.auth.orgId),
            eq(timetableEntries.termId, input.termId),
            eq(timetableEntries.teacherId, teacherId)
          )
        )
        .orderBy(periods.sortOrder);

      return entries;
    }),

  getStudentTimetable: protectedProcedure
    .input(z.object({ termId: z.string().uuid(), studentId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // Get student's class enrollment
      const enrollment = await ctx.db
        .select({ classId: classEnrollments.classId })
        .from(classEnrollments)
        .innerJoin(classes, eq(classEnrollments.classId, classes.id))
        .where(eq(classEnrollments.studentId, input.studentId))
        .limit(1);

      if (enrollment.length === 0) {
        return [];
      }

      const classId = enrollment[0].classId;

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
            eq(timetableEntries.classId, classId)
          )
        )
        .orderBy(periods.sortOrder);
    }),

  getTeacherWorkload: protectedProcedure
    .input(z.object({ termId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db
        .select({
          teacherId: timetableEntries.teacherId,
          teacherFirstName: userProfiles.firstName,
          teacherLastName: userProfiles.lastName,
          periodCount: sql<number>`count(*)::int`,
        })
        .from(timetableEntries)
        .innerJoin(userProfiles, eq(timetableEntries.teacherId, userProfiles.id))
        .where(
          and(
            eq(timetableEntries.tenantId, ctx.auth.orgId),
            eq(timetableEntries.termId, input.termId)
          )
        )
        .groupBy(timetableEntries.teacherId, userProfiles.firstName, userProfiles.lastName)
        .orderBy(desc(sql`count(*)`));
    }),

  // ---- Substitutions ----

  listSubstitutions: protectedProcedure
    .input(
      z.object({
        date: z.date().optional(),
        teacherId: z.string().uuid().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(substitutions.tenantId, ctx.auth.orgId)];
      if (input.date) {
        conditions.push(eq(substitutions.date, input.date));
      }
      if (input.teacherId) {
        conditions.push(eq(substitutions.originalTeacherId, input.teacherId));
      }

      return ctx.db
        .select({
          id: substitutions.id,
          timetableEntryId: substitutions.timetableEntryId,
          date: substitutions.date,
          reason: substitutions.reason,
          notes: substitutions.notes,
          originalTeacherFirst: sql<string>`orig.first_name`,
          originalTeacherLast: sql<string>`orig.last_name`,
          substituteTeacherFirst: sql<string>`sub.first_name`,
          substituteTeacherLast: sql<string>`sub.last_name`,
          className: classes.name,
          subjectName: subjects.name,
          periodName: periods.name,
          dayOfWeek: timetableEntries.dayOfWeek,
          periodStartTime: periods.startTime,
          periodEndTime: periods.endTime,
        })
        .from(substitutions)
        .innerJoin(timetableEntries, eq(substitutions.timetableEntryId, timetableEntries.id))
        .innerJoin(classes, eq(timetableEntries.classId, classes.id))
        .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
        .innerJoin(periods, eq(timetableEntries.periodId, periods.id))
        .innerJoin(
          sql`${userProfiles} as orig`,
          sql`orig.id = ${substitutions.originalTeacherId}`
        )
        .innerJoin(
          sql`${userProfiles} as sub`,
          sql`sub.id = ${substitutions.substituteTeacherId}`
        )
        .where(and(...conditions))
        .orderBy(substitutions.date, periods.sortOrder);
    }),

  createSubstitution: adminProcedure
    .input(createSubstitutionSchema)
    .mutation(async ({ ctx, input }) => {
      // Get the timetable entry to find original teacher
      const entry = await ctx.db
        .select()
        .from(timetableEntries)
        .where(
          and(
            eq(timetableEntries.id, input.timetableEntryId),
            eq(timetableEntries.tenantId, ctx.auth.orgId)
          )
        );

      if (!entry[0]) throw new TRPCError({ code: "NOT_FOUND", message: "Timetable entry not found" });

      // Get createdBy profile
      const profile = await ctx.db.query.userProfiles.findFirst({
        where: and(
          eq(userProfiles.clerkUserId, ctx.auth.userId),
          eq(userProfiles.tenantId, ctx.auth.orgId)
        ),
      });

      const [sub] = await ctx.db
        .insert(substitutions)
        .values({
          tenantId: ctx.auth.orgId,
          timetableEntryId: input.timetableEntryId,
          date: input.date,
          originalTeacherId: entry[0].teacherId,
          substituteTeacherId: input.substituteTeacherId,
          reason: input.reason,
          notes: input.notes,
          createdById: profile?.id ?? null,
        })
        .returning();
      return sub;
    }),

  bulkCreateSubstitutions: adminProcedure
    .input(bulkCreateSubstitutionsSchema)
    .mutation(async ({ ctx, input }) => {
      // Find what day of week the date is
      const dayIndex = input.date.getDay();
      const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const dayOfWeek = dayNames[dayIndex];

      // Find all entries for this teacher on that day of week
      const entries = await ctx.db
        .select()
        .from(timetableEntries)
        .where(
          and(
            eq(timetableEntries.tenantId, ctx.auth.orgId),
            eq(timetableEntries.teacherId, input.originalTeacherId),
            eq(timetableEntries.dayOfWeek, dayOfWeek)
          )
        );

      if (entries.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No timetable entries found for this teacher on that day" });
      }

      const profile = await ctx.db.query.userProfiles.findFirst({
        where: and(
          eq(userProfiles.clerkUserId, ctx.auth.userId),
          eq(userProfiles.tenantId, ctx.auth.orgId)
        ),
      });

      const values = entries.map((e: any) => ({
        tenantId: ctx.auth.orgId,
        timetableEntryId: e.id,
        date: input.date,
        originalTeacherId: input.originalTeacherId,
        substituteTeacherId: input.substituteTeacherId,
        reason: input.reason ?? null,
        createdById: profile?.id ?? null,
      }));

      const inserted = await ctx.db
        .insert(substitutions)
        .values(values)
        .returning();

      return inserted;
    }),

  deleteSubstitution: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const [deleted] = await ctx.db
        .delete(substitutions)
        .where(and(eq(substitutions.id, input.id), eq(substitutions.tenantId, ctx.auth.orgId)))
        .returning();
      if (!deleted) throw new TRPCError({ code: "NOT_FOUND", message: "Substitution not found" });
      return deleted;
    }),
});
