import { z } from "zod";

export const dayOfWeekEnum = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const createPeriodSchema = z.object({
  name: z.string().min(1).max(100),
  shortName: z.string().min(1).max(20),
  sortOrder: z.number().int().min(0),
  startTime: z.string().regex(timeRegex, "Must be HH:MM format"),
  endTime: z.string().regex(timeRegex, "Must be HH:MM format"),
  isBreak: z.boolean(),
});

export const updatePeriodSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100).optional(),
  shortName: z.string().min(1).max(20).optional(),
  sortOrder: z.number().int().min(0).optional(),
  startTime: z.string().regex(timeRegex, "Must be HH:MM format").optional(),
  endTime: z.string().regex(timeRegex, "Must be HH:MM format").optional(),
  isBreak: z.boolean().optional(),
});

export const createTimetableEntrySchema = z.object({
  termId: z.string().uuid(),
  classId: z.string().uuid(),
  periodId: z.string().uuid(),
  dayOfWeek: z.enum(dayOfWeekEnum),
  subjectId: z.string().uuid(),
  teacherId: z.string().uuid(),
  room: z.string().max(50).optional().nullable(),
  classSectionId: z.string().uuid().optional().nullable(),
});

export const updateTimetableEntrySchema = z.object({
  id: z.string().uuid(),
  subjectId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  room: z.string().max(50).optional().nullable(),
  classSectionId: z.string().uuid().optional().nullable(),
});

export const bulkCreateTimetableEntriesSchema = z.object({
  termId: z.string().uuid(),
  classId: z.string().uuid(),
  entries: z.array(
    z.object({
      periodId: z.string().uuid(),
      dayOfWeek: z.enum(dayOfWeekEnum),
      subjectId: z.string().uuid(),
      teacherId: z.string().uuid(),
      room: z.string().max(50).optional().nullable(),
      classSectionId: z.string().uuid().optional().nullable(),
    })
  ),
});

export const duplicateTimetableSchema = z.object({
  fromTermId: z.string().uuid(),
  toTermId: z.string().uuid(),
  classId: z.string().uuid().optional(),
});

export const createSubstitutionSchema = z.object({
  timetableEntryId: z.string().uuid(),
  date: z.date(),
  substituteTeacherId: z.string().uuid(),
  reason: z.string().max(255).optional(),
  notes: z.string().optional(),
});

export const bulkCreateSubstitutionsSchema = z.object({
  date: z.date(),
  originalTeacherId: z.string().uuid(),
  substituteTeacherId: z.string().uuid(),
  reason: z.string().max(255).optional(),
});

export type CreatePeriodInput = z.infer<typeof createPeriodSchema>;
export type UpdatePeriodInput = z.infer<typeof updatePeriodSchema>;
export type CreateTimetableEntryInput = z.infer<typeof createTimetableEntrySchema>;
export type UpdateTimetableEntryInput = z.infer<typeof updateTimetableEntrySchema>;
export type BulkCreateTimetableEntriesInput = z.infer<typeof bulkCreateTimetableEntriesSchema>;
export type DuplicateTimetableInput = z.infer<typeof duplicateTimetableSchema>;
export type CreateSubstitutionInput = z.infer<typeof createSubstitutionSchema>;
export type BulkCreateSubstitutionsInput = z.infer<typeof bulkCreateSubstitutionsSchema>;
