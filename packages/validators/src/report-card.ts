import { z } from "zod";

export const reportCardStatusEnum = ["draft", "submitted", "approved", "published"] as const;

export const reportCardCommentSchema = z.object({
  classSectionId: z.string().uuid(),
  subjectName: z.string(),
  comment: z.string(),
});

export const createReportCardSchema = z.object({
  studentId: z.string().uuid(),
  termId: z.string().uuid(),
});

export const bulkCreateReportCardSchema = z.object({
  termId: z.string().uuid(),
  studentIds: z.array(z.string().uuid()).min(1),
});

export const updateReportCardCommentsSchema = z.object({
  id: z.string().uuid(),
  comments: z.array(reportCardCommentSchema),
});

export type ReportCardComment = z.infer<typeof reportCardCommentSchema>;
export type CreateReportCardInput = z.infer<typeof createReportCardSchema>;
export type BulkCreateReportCardInput = z.infer<typeof bulkCreateReportCardSchema>;
