import { z } from "zod";
import { eq, and, desc, sql, ilike, or } from "drizzle-orm";
import { router, protectedProcedure, teacherProcedure } from "../trpc";
import {
  announcements,
  messageThreads,
  messages,
  messageRecipients,
  threadParticipants,
  userProfiles,
} from "@school-saas/db/schema";

// Helper: resolve Clerk userId → userProfiles.id
async function resolveUserProfileId(
  db: any,
  clerkUserId: string,
  tenantId: string
): Promise<string> {
  const profile = await db.query.userProfiles.findFirst({
    where: and(
      eq(userProfiles.clerkUserId, clerkUserId),
      eq(userProfiles.tenantId, tenantId)
    ),
    columns: { id: true },
  });
  if (!profile) {
    throw new Error("User profile not found");
  }
  return profile.id;
}

export const communicationRouter = router({
  // === Announcements ===

  listAnnouncements: protectedProcedure
    .input(
      z
        .object({
          publishedOnly: z.boolean().default(true),
          audience: z.enum(["all", "teachers", "parents", "specific_class"]).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(announcements.tenantId, ctx.auth.orgId)];
      if (input?.publishedOnly) {
        conditions.push(eq(announcements.isPublished, true));
      }
      if (input?.audience) {
        conditions.push(eq(announcements.audience, input.audience));
      }

      const rows = await ctx.db
        .select({
          id: announcements.id,
          tenantId: announcements.tenantId,
          title: announcements.title,
          body: announcements.body,
          authorId: announcements.authorId,
          audience: announcements.audience,
          audienceTargetId: announcements.audienceTargetId,
          isPublished: announcements.isPublished,
          publishedAt: announcements.publishedAt,
          createdAt: announcements.createdAt,
          updatedAt: announcements.updatedAt,
          authorFirstName: userProfiles.firstName,
          authorLastName: userProfiles.lastName,
        })
        .from(announcements)
        .leftJoin(userProfiles, eq(announcements.authorId, userProfiles.id))
        .where(and(...conditions))
        .orderBy(desc(announcements.createdAt));

      return rows;
    }),

  getAnnouncement: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rows = await ctx.db
        .select({
          id: announcements.id,
          tenantId: announcements.tenantId,
          title: announcements.title,
          body: announcements.body,
          authorId: announcements.authorId,
          audience: announcements.audience,
          audienceTargetId: announcements.audienceTargetId,
          isPublished: announcements.isPublished,
          publishedAt: announcements.publishedAt,
          createdAt: announcements.createdAt,
          updatedAt: announcements.updatedAt,
          authorFirstName: userProfiles.firstName,
          authorLastName: userProfiles.lastName,
        })
        .from(announcements)
        .leftJoin(userProfiles, eq(announcements.authorId, userProfiles.id))
        .where(
          and(
            eq(announcements.id, input.id),
            eq(announcements.tenantId, ctx.auth.orgId)
          )
        )
        .limit(1);

      return rows[0] ?? null;
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
      // Bug fix: resolve Clerk userId → userProfiles.id
      const authorId = await resolveUserProfileId(ctx.db, ctx.auth.userId, ctx.auth.orgId);

      const [announcement] = await ctx.db
        .insert(announcements)
        .values({
          ...input,
          tenantId: ctx.auth.orgId,
          authorId,
          publishedAt: input.isPublished ? new Date() : null,
        })
        .returning();
      return announcement;
    }),

  updateAnnouncement: teacherProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(255).optional(),
        body: z.string().min(1).optional(),
        audience: z.enum(["all", "teachers", "parents", "specific_class"]).optional(),
        audienceTargetId: z.string().uuid().nullable().optional(),
        isPublished: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const setData: Record<string, any> = { ...updates, updatedAt: new Date() };

      // If publishing, set publishedAt
      if (updates.isPublished === true) {
        setData.publishedAt = new Date();
      } else if (updates.isPublished === false) {
        setData.publishedAt = null;
      }

      const [updated] = await ctx.db
        .update(announcements)
        .set(setData)
        .where(
          and(
            eq(announcements.id, id),
            eq(announcements.tenantId, ctx.auth.orgId)
          )
        )
        .returning();
      return updated;
    }),

  deleteAnnouncement: teacherProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(announcements)
        .where(
          and(
            eq(announcements.id, input.id),
            eq(announcements.tenantId, ctx.auth.orgId)
          )
        );
      return { success: true };
    }),

  // === Messages ===

  listThreads: protectedProcedure.query(async ({ ctx }) => {
    // Bug fix: filter by threadParticipants for current user
    const userProfileId = await resolveUserProfileId(ctx.db, ctx.auth.userId, ctx.auth.orgId);

    // Get threads where user is a participant
    const threads = await ctx.db
      .select({
        id: messageThreads.id,
        subject: messageThreads.subject,
        createdAt: messageThreads.createdAt,
        updatedAt: messageThreads.updatedAt,
      })
      .from(messageThreads)
      .innerJoin(
        threadParticipants,
        eq(messageThreads.id, threadParticipants.threadId)
      )
      .where(
        and(
          eq(messageThreads.tenantId, ctx.auth.orgId),
          eq(threadParticipants.userId, userProfileId)
        )
      )
      .orderBy(desc(messageThreads.updatedAt));

    // For each thread, get last message preview, unread count, and participant names
    const threadsWithDetails = await Promise.all(
      threads.map(async (thread) => {
        // Last message
        const lastMessages = await ctx.db
          .select({
            body: messages.body,
            createdAt: messages.createdAt,
            senderFirstName: userProfiles.firstName,
            senderLastName: userProfiles.lastName,
          })
          .from(messages)
          .leftJoin(userProfiles, eq(messages.senderId, userProfiles.id))
          .where(eq(messages.threadId, thread.id))
          .orderBy(desc(messages.createdAt))
          .limit(1);

        // Unread count
        const unreadResult = await ctx.db
          .select({ count: sql<number>`count(*)::int` })
          .from(messageRecipients)
          .innerJoin(messages, eq(messageRecipients.messageId, messages.id))
          .where(
            and(
              eq(messages.threadId, thread.id),
              eq(messageRecipients.recipientId, userProfileId),
              eq(messageRecipients.isRead, false)
            )
          );

        // Participants
        const participants = await ctx.db
          .select({
            firstName: userProfiles.firstName,
            lastName: userProfiles.lastName,
            userId: threadParticipants.userId,
          })
          .from(threadParticipants)
          .innerJoin(userProfiles, eq(threadParticipants.userId, userProfiles.id))
          .where(eq(threadParticipants.threadId, thread.id));

        return {
          ...thread,
          lastMessage: lastMessages[0] ?? null,
          unreadCount: unreadResult[0]?.count ?? 0,
          participants,
        };
      })
    );

    return threadsWithDetails;
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

      // Get messages with sender names
      const threadMessages = await ctx.db
        .select({
          id: messages.id,
          threadId: messages.threadId,
          senderId: messages.senderId,
          body: messages.body,
          createdAt: messages.createdAt,
          senderFirstName: userProfiles.firstName,
          senderLastName: userProfiles.lastName,
        })
        .from(messages)
        .leftJoin(userProfiles, eq(messages.senderId, userProfiles.id))
        .where(eq(messages.threadId, input.threadId))
        .orderBy(messages.createdAt);

      // Get participants
      const participants = await ctx.db
        .select({
          userId: threadParticipants.userId,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
        })
        .from(threadParticipants)
        .innerJoin(userProfiles, eq(threadParticipants.userId, userProfiles.id))
        .where(eq(threadParticipants.threadId, input.threadId));

      return { thread, messages: threadMessages, participants };
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
      // Bug fix: resolve Clerk userId → userProfiles.id
      const senderProfileId = await resolveUserProfileId(ctx.db, ctx.auth.userId, ctx.auth.orgId);

      let threadId = input.threadId;

      if (!threadId) {
        // Create new thread
        const [thread] = await ctx.db
          .insert(messageThreads)
          .values({
            tenantId: ctx.auth.orgId,
            subject: input.subject,
          })
          .returning();
        threadId = thread.id;

        // Add all participants (sender + recipients) to threadParticipants
        const newThreadId = threadId;
        const allParticipantIds = new Set([senderProfileId, ...input.recipientIds]);
        await ctx.db.insert(threadParticipants).values(
          Array.from(allParticipantIds).map((userId) => ({
            threadId: newThreadId,
            userId,
          }))
        );
      }

      // Insert message with resolved profile ID
      const [message] = await ctx.db
        .insert(messages)
        .values({
          tenantId: ctx.auth.orgId,
          threadId,
          senderId: senderProfileId,
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

  markMessagesRead: protectedProcedure
    .input(z.object({ threadId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const userProfileId = await resolveUserProfileId(ctx.db, ctx.auth.userId, ctx.auth.orgId);

      // Get all message IDs in the thread
      const threadMessages = await ctx.db
        .select({ id: messages.id })
        .from(messages)
        .where(eq(messages.threadId, input.threadId));

      if (threadMessages.length === 0) return { updated: 0 };

      const messageIds = threadMessages.map((m) => m.id);

      // Mark all messageRecipients as read for this user in this thread
      const result = await ctx.db
        .update(messageRecipients)
        .set({ isRead: true, readAt: new Date() })
        .where(
          and(
            eq(messageRecipients.recipientId, userProfileId),
            eq(messageRecipients.isRead, false),
            sql`${messageRecipients.messageId} = ANY(${messageIds})`
          )
        );

      return { updated: messageIds.length };
    }),

  listUsers: protectedProcedure
    .input(
      z
        .object({
          role: z.enum(["super_admin", "school_admin", "teacher", "student", "parent"]).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(userProfiles.tenantId, ctx.auth.orgId)];

      if (input?.role) {
        conditions.push(eq(userProfiles.role, input.role));
      }

      if (input?.search) {
        conditions.push(
          or(
            ilike(userProfiles.firstName, `%${input.search}%`),
            ilike(userProfiles.lastName, `%${input.search}%`),
            ilike(userProfiles.email, `%${input.search}%`)
          )!
        );
      }

      return ctx.db
        .select({
          id: userProfiles.id,
          firstName: userProfiles.firstName,
          lastName: userProfiles.lastName,
          email: userProfiles.email,
          role: userProfiles.role,
        })
        .from(userProfiles)
        .where(and(...conditions))
        .orderBy(userProfiles.lastName, userProfiles.firstName);
    }),
});
