import { z } from "zod";

export const studentStatusEnum = ["active", "inactive", "graduated", "transferred"] as const;

export const createStudentSchema = z.object({
  studentNumber: z.string().min(1, "Student number is required").max(50),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.date().optional(),
  nationality: z.string().max(100).optional(),
  passportNumber: z.string().max(50).optional(),
  visaStatus: z.string().max(50).optional(),
  primaryLanguage: z.string().max(50).optional(),
  enrollmentDate: z.date().optional(),
  status: z.enum(studentStatusEnum).default("active"),
  metadata: z.record(z.unknown()).optional(),
});

export const updateStudentSchema = createStudentSchema.partial().extend({
  id: z.string().uuid(),
});

export const createGuardianSchema = z.object({
  studentId: z.string().uuid(),
  firstName: z.string().min(1, "First name is required").max(100),
  lastName: z.string().min(1, "Last name is required").max(100),
  relationship: z.string().min(1, "Relationship is required").max(50),
  phone: z.string().max(50).optional(),
  email: z.string().email("Invalid email address").optional(),
  isEmergencyContact: z.boolean().default(false),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateGuardianInput = z.infer<typeof createGuardianSchema>;
