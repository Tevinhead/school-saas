import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { router, protectedProcedure, teacherProcedure } from "../trpc";
import { announcements, messageThreads, messages, messageRecipients } from "@school-saas/db/schema";

export const communicationRouter = router({
  // Announcements
  listAnnouncements: protectedProcedure
    .input(
      z.object({
        publishedOnly: z.boolean().default(true),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(announcements.tenantId, ctx.auth.orgId)];
      if (input?.publishedOnly) {
        conditions.push(eq(announcements.isPublished, true));
      }
      return ctx.db.query.announcements.findMany({
        where: and(...conditions),
        orderBy: (a, { desc: d }) => [d(a.createdAt)],
      });
    }),

  createAnnouncement: teacherProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        body: z.string().min(1),
        audience: z.enum(["all", "teachers", "parents", "specific_class"]).default("all"),
        audienceTargetId: z.string().uuid().optional(),
        isPublished: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [announcement] = await ctx.db
        .insert(announcements)
        .values({
          ...input,
          tenantId: ctx.auth.orgId,
          authorId: ctx.auth.userId,
          publishedAt: input.isPublished ? new Date() : null,
        })
        .returning();
      return announcement;
    }),

  // Messages
  listThreads: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.messageThreads.findMany({
      where: eq(messageThreads.tenantId, ctx.auth.orgId),
      orderBy: (t, { desc: d }) => [d(t.updatedAt)],
    });
  }),

  getThread: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const thread = await ctx.db.query.messageThreads.findFirst({
        where: and(
          eq(messageThreads.id, input.threadId),
          eq(messageThreads.tenantId, ctx.auth.orgId)
        ),
      });

      const threadMessages = await ctx.db.query.messages.findMany({
        where: eq(messages.threadId, input.threadId),
        orderBy: (m, { asc }) => [asc(m.createdAt)],
      });

      return { thread, messages: threadMessages };
    }),

  sendMessage: protectedProcedure
    .input(
      z.object({
        threadId: z.string().uuid().optional(),
        subject: z.string().max(255).optional(),
        recipientIds: z.array(z.string().uuid()),
        body: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let threadId = input.threadId;

      if (!threadId) {
        const [thread] = await ctx.db
          .insert(messageThreads)
          .values({
            tenantId: ctx.auth.orgId,
            subject: input.subject,
          })
          .returning();
        threadId = thread.id;
      }

      const [message] = await ctx.db
        .insert(messages)
        .values({
          tenantId: ctx.auth.orgId,
          threadId,
          senderId: ctx.auth.userId,
          body: input.body,
        })
        .returning();

      // Create recipient entries
      if (input.recipientIds.length > 0) {
        await ctx.db.insert(messageRecipients).values(
          input.recipientIds.map((recipientId) => ({
            messageId: message.id,
            recipientId,
          }))
        );
      }

      // Update thread timestamp
      await ctx.db
        .update(messageThreads)
        .set({ updatedAt: new Date() })
        .where(eq(messageThreads.id, threadId));

      return message;
    }),
});
