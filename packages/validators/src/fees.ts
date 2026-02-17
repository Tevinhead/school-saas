import { z } from "zod";

export const feeFrequencyEnum = ["annual", "semester", "monthly"] as const;
export const invoiceStatusEnum = ["pending", "partial", "paid", "overdue", "cancelled"] as const;
export const paymentMethodEnum = ["cash", "bank_transfer", "card", "cheque"] as const;

export const createFeeStructureSchema = z.object({
  name: z.string().min(1).max(255),
  academicYearId: z.string().uuid(),
  gradeLevelId: z.string().uuid().optional(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  frequency: z.enum(feeFrequencyEnum).default("annual"),
});

export const createInvoiceSchema = z.object({
  studentId: z.string().uuid(),
  feeStructureId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default("USD"),
  dueDate: z.date(),
});

export const recordPaymentSchema = z.object({
  invoiceId: z.string().uuid(),
  amount: z.number().positive(),
  method: z.enum(paymentMethodEnum),
  referenceNumber: z.string().max(100).optional(),
  receivedAt: z.date(),
});

export type CreateFeeStructureInput = z.infer<typeof createFeeStructureSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
