import { pgTable, uuid, varchar, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { tenants, academicYears } from "./tenant";
import { gradeLevels } from "./academic";
import { students } from "./student";

export const feeStructures = pgTable("fee_structures", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  academicYearId: uuid("academic_year_id").notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  gradeLevelId: uuid("grade_level_id").references(() => gradeLevels.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  frequency: varchar("frequency", { length: 20 }).notNull().default("annual"), // annual, semester, monthly
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  feeStructureId: uuid("fee_structure_id").notNull().references(() => feeStructures.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).notNull().default("USD"),
  dueDate: timestamp("due_date", { mode: "date" }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default("pending"), // pending, partial, paid, overdue, cancelled
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable("payments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  invoiceId: uuid("invoice_id").notNull().references(() => invoices.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  method: varchar("method", { length: 50 }).notNull(), // cash, bank_transfer, card, cheque
  referenceNumber: varchar("reference_number", { length: 100 }),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
