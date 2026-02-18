import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  body: z.string().min(1, "Body is required"),
  audience: z.enum(["all", "teachers", "parents", "specific_class"]).default("all"),
  audienceTargetId: z.string().uuid().optional(),
  isPublished: z.boolean().default(false),
});

export const updateAnnouncementSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255).optional(),
  body: z.string().min(1).optional(),
  audience: z.enum(["all", "teachers", "parents", "specific_class"]).optional(),
  audienceTargetId: z.string().uuid().nullable().optional(),
  isPublished: z.boolean().optional(),
});

export const sendMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  subject: z.string().max(255).optional(),
  recipientIds: z.array(z.string().uuid()).min(1, "At least one recipient is required"),
  body: z.string().min(1, "Message body is required"),
});
