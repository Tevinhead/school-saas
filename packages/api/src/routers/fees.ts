import { z } from "zod";
import { eq, and, sql, lt } from "drizzle-orm";
import { router, protectedProcedure, adminProcedure } from "../trpc";
import { feeStructures, invoices, payments, students } from "@school-saas/db/schema";

export const feesRouter = router({
  // Fee Structures
  listFeeStructures: protectedProcedure
    .input(z.object({ academicYearId: z.string().uuid().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const conditions = [eq(feeStructures.tenantId, ctx.auth.orgId)];
      if (input?.academicYearId) {
        conditions.push(eq(feeStructures.academicYearId, input.academicYearId));
      }
      return ctx.db.query.feeStructures.findMany({
        where: and(...conditions),
      });
    }),

  createFeeStructure: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        academicYearId: z.string().uuid(),
        gradeLevelId: z.string().uuid().optional(),
        amount: z.number().positive(),
        currency: z.string().length(3).default("USD"),
        frequency: z.enum(["annual", "semester", "monthly"]).default("annual"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [structure] = await ctx.db
        .insert(feeStructures)
        .values({
          ...input,
          tenantId: ctx.auth.orgId,
          amount: input.amount.toString(),
        })
        .returning();
      return structure;
    }),

  updateFeeStructure: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(255).optional(),
        amount: z.number().positive().optional(),
        currency: z.string().length(3).optional(),
        frequency: z.enum(["annual", "semester", "monthly"]).optional(),
        gradeLevelId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, amount, ...rest } = input;
      const data: Record<string, unknown> = { ...rest, updatedAt: new Date() };
      if (amount !== undefined) data.amount = amount.toString();
      const [updated] = await ctx.db
        .update(feeStructures)
        .set(data)
        .where(and(eq(feeStructures.id, id), eq(feeStructures.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  deleteFeeStructure: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(feeStructures)
        .where(and(eq(feeStructures.id, input.id), eq(feeStructures.tenantId, ctx.auth.orgId)));
      return { success: true };
    }),

  // Invoices
  listInvoices: protectedProcedure
    .input(
      z.object({
        studentId: z.string().uuid().optional(),
        status: z.enum(["pending", "partial", "paid", "overdue", "cancelled"]).optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const conditions = [eq(invoices.tenantId, ctx.auth.orgId)];
      if (input?.studentId) conditions.push(eq(invoices.studentId, input.studentId));
      if (input?.status) conditions.push(eq(invoices.status, input.status));
      if (input?.startDate) conditions.push(sql`${invoices.dueDate} >= ${input.startDate}`);
      if (input?.endDate) conditions.push(sql`${invoices.dueDate} <= ${input.endDate}`);

      const rows = await ctx.db
        .select({
          id: invoices.id,
          studentId: invoices.studentId,
          feeStructureId: invoices.feeStructureId,
          amount: invoices.amount,
          currency: invoices.currency,
          dueDate: invoices.dueDate,
          status: invoices.status,
          paidAmount: invoices.paidAmount,
          createdAt: invoices.createdAt,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          studentNumber: students.studentNumber,
          feeStructureName: feeStructures.name,
        })
        .from(invoices)
        .innerJoin(students, eq(invoices.studentId, students.id))
        .innerJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
        .where(and(...conditions))
        .orderBy(sql`${invoices.dueDate} DESC`);

      return rows;
    }),

  getInvoiceById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [invoice] = await ctx.db
        .select({
          id: invoices.id,
          studentId: invoices.studentId,
          feeStructureId: invoices.feeStructureId,
          amount: invoices.amount,
          currency: invoices.currency,
          dueDate: invoices.dueDate,
          status: invoices.status,
          paidAmount: invoices.paidAmount,
          createdAt: invoices.createdAt,
          studentFirstName: students.firstName,
          studentLastName: students.lastName,
          studentNumber: students.studentNumber,
          feeStructureName: feeStructures.name,
        })
        .from(invoices)
        .innerJoin(students, eq(invoices.studentId, students.id))
        .innerJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
        .where(
          and(eq(invoices.id, input.id), eq(invoices.tenantId, ctx.auth.orgId))
        );

      if (!invoice) return null;

      const invoicePayments = await ctx.db.query.payments.findMany({
        where: and(
          eq(payments.tenantId, ctx.auth.orgId),
          eq(payments.invoiceId, input.id)
        ),
        orderBy: (p, { desc }) => [desc(p.receivedAt)],
      });

      return { ...invoice, payments: invoicePayments };
    }),

  createInvoice: adminProcedure
    .input(
      z.object({
        studentId: z.string().uuid(),
        feeStructureId: z.string().uuid(),
        amount: z.number().positive(),
        currency: z.string().length(3).default("USD"),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [invoice] = await ctx.db
        .insert(invoices)
        .values({
          ...input,
          tenantId: ctx.auth.orgId,
          amount: input.amount.toString(),
        })
        .returning();
      return invoice;
    }),

  bulkCreateInvoices: adminProcedure
    .input(
      z.object({
        feeStructureId: z.string().uuid(),
        studentIds: z.array(z.string().uuid()).min(1),
        amount: z.number().positive(),
        currency: z.string().length(3).default("USD"),
        dueDate: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const values = input.studentIds.map((studentId) => ({
        tenantId: ctx.auth.orgId,
        studentId,
        feeStructureId: input.feeStructureId,
        amount: input.amount.toString(),
        currency: input.currency,
        dueDate: input.dueDate,
      }));
      const result = await ctx.db.insert(invoices).values(values).returning();
      return result;
    }),

  updateInvoice: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(["pending", "partial", "paid", "overdue", "cancelled"]).optional(),
        dueDate: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const [updated] = await ctx.db
        .update(invoices)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(invoices.id, id), eq(invoices.tenantId, ctx.auth.orgId)))
        .returning();
      return updated;
    }),

  // Payments
  recordPayment: adminProcedure
    .input(
      z.object({
        invoiceId: z.string().uuid(),
        amount: z.number().positive(),
        method: z.enum(["cash", "bank_transfer", "card", "cheque"]),
        referenceNumber: z.string().max(100).optional(),
        receivedAt: z.date(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const [payment] = await ctx.db
        .insert(payments)
        .values({
          ...input,
          tenantId: ctx.auth.orgId,
          amount: input.amount.toString(),
        })
        .returning();

      // Update invoice paid amount using proper SQL expression
      await ctx.db
        .update(invoices)
        .set({
          paidAmount: sql`CAST(${invoices.paidAmount} AS NUMERIC) + ${input.amount}`,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId));

      // Auto-update status based on paid vs total
      const [inv] = await ctx.db
        .select({ amount: invoices.amount, paidAmount: invoices.paidAmount })
        .from(invoices)
        .where(eq(invoices.id, input.invoiceId));

      if (inv) {
        const total = parseFloat(inv.amount);
        const paid = parseFloat(inv.paidAmount);
        const newStatus = paid >= total ? "paid" : paid > 0 ? "partial" : "pending";
        await ctx.db
          .update(invoices)
          .set({ status: newStatus })
          .where(eq(invoices.id, input.invoiceId));
      }

      return payment;
    }),

  listPaymentsByInvoice: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.query.payments.findMany({
        where: and(
          eq(payments.tenantId, ctx.auth.orgId),
          eq(payments.invoiceId, input.invoiceId)
        ),
        orderBy: (p, { desc }) => [desc(p.receivedAt)],
      });
    }),

  getOverdueInvoices: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db
      .select({
        id: invoices.id,
        studentId: invoices.studentId,
        amount: invoices.amount,
        paidAmount: invoices.paidAmount,
        dueDate: invoices.dueDate,
        status: invoices.status,
        studentFirstName: students.firstName,
        studentLastName: students.lastName,
      })
      .from(invoices)
      .innerJoin(students, eq(invoices.studentId, students.id))
      .where(
        and(
          eq(invoices.tenantId, ctx.auth.orgId),
          lt(invoices.dueDate, new Date()),
          sql`${invoices.status} IN ('pending', 'partial')`
        )
      )
      .orderBy(invoices.dueDate);
    return rows;
  }),

  getFeeStats: protectedProcedure.query(async ({ ctx }) => {
    const [result] = await ctx.db
      .select({
        totalInvoiced: sql<string>`COALESCE(SUM(CAST(${invoices.amount} AS NUMERIC)), 0)`,
        totalCollected: sql<string>`COALESCE(SUM(CAST(${invoices.paidAmount} AS NUMERIC)), 0)`,
        invoiceCount: sql<number>`COUNT(*)`,
      })
      .from(invoices)
      .where(eq(invoices.tenantId, ctx.auth.orgId));

    const [overdueResult] = await ctx.db
      .select({ count: sql<number>`COUNT(*)` })
      .from(invoices)
      .where(
        and(
          eq(invoices.tenantId, ctx.auth.orgId),
          lt(invoices.dueDate, new Date()),
          sql`${invoices.status} IN ('pending', 'partial')`
        )
      );

    const totalInvoiced = parseFloat(result?.totalInvoiced ?? "0");
    const totalCollected = parseFloat(result?.totalCollected ?? "0");

    return {
      totalInvoiced,
      totalCollected,
      totalOutstanding: totalInvoiced - totalCollected,
      overdueCount: Number(overdueResult?.count ?? 0),
      invoiceCount: Number(result?.invoiceCount ?? 0),
    };
  }),
});
