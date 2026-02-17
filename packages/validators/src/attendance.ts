import { z } from "zod";

export const attendanceStatusEnum = ["present", "absent", "late", "excused"] as const;

export const markAttendanceSchema = z.object({
  classSectionId: z.string().uuid(),
  date: z.date(),
  period: z.number().int().optional(),
  records: z.array(
    z.object({
      studentId: z.string().uuid(),
      status: z.enum(attendanceStatusEnum),
      notes: z.string().optional(),
    })
  ),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
