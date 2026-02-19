import { z } from "zod";

export const applicationStatusEnum = z.enum([
  "inquiry",
  "applied",
  "interviewed",
  "accepted",
  "enrolled",
  "rejected",
  "waitlisted",
]);

export const documentTypeEnum = z.enum([
  "birth_cert",
  "transcript",
  "passport_photo",
  "visa",
  "other",
]);

export const createApplicationSchema = z.object({
  studentFirstName: z.string().min(1, "First name is required").max(100),
  studentLastName: z.string().min(1, "Last name is required").max(100),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gradeLevelId: z.string().uuid().optional(),
  academicYearId: z.string().uuid().optional(),
  guardianName: z.string().min(1, "Guardian name is required").max(200),
  guardianEmail: z.string().email("Invalid email address").max(255),
  guardianPhone: z.string().max(50).optional(),
  notes: z.string().optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial().extend({
  id: z.string().uuid(),
});

export const updateApplicationStatusSchema = z.object({
  id: z.string().uuid(),
  status: applicationStatusEnum,
});

export const createInterviewSchema = z.object({
  applicationId: z.string().uuid(),
  scheduledAt: z.string(),
  notes: z.string().optional(),
  outcome: z.string().optional(),
});

export const uploadDocumentSchema = z.object({
  applicationId: z.string().uuid(),
  type: documentTypeEnum,
  fileName: z.string(),
  fileUrl: z.string().url(),
  mimeType: z.string(),
});

export const waitlistEntrySchema = z.object({
  applicationId: z.string().uuid(),
  gradeLevelId: z.string().uuid(),
  rank: z.number().int().positive(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type CreateInterviewInput = z.infer<typeof createInterviewSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
export type WaitlistEntryInput = z.infer<typeof waitlistEntrySchema>;
