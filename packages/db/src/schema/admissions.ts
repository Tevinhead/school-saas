import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tenants, academicYears } from "./tenant";
import { gradeLevels } from "./academic";

export const applications = pgTable("applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("inquiry"),
  studentFirstName: varchar("student_first_name", { length: 100 }).notNull(),
  studentLastName: varchar("student_last_name", { length: 100 }).notNull(),
  dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
  gradeLevelId: uuid("grade_level_id").references(() => gradeLevels.id),
  academicYearId: uuid("academic_year_id").references(() => academicYears.id),
  guardianName: varchar("guardian_name", { length: 200 }).notNull(),
  guardianEmail: varchar("guardian_email", { length: 255 }).notNull(),
  guardianPhone: varchar("guardian_phone", { length: 50 }),
  notes: text("notes"),
  appliedAt: timestamp("applied_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applicationDocuments = pgTable("application_documents", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 30 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileUrl: text("file_url").notNull(),
  mimeType: varchar("mime_type", { length: 100 }).notNull(),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applicationInterviews = pgTable("application_interviews", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  interviewedBy: text("interviewed_by"),
  notes: text("notes"),
  outcome: varchar("outcome", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const waitlistEntries = pgTable("waitlist_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").notNull().references(() => applications.id, { onDelete: "cascade" }),
  gradeLevelId: uuid("grade_level_id").notNull().references(() => gradeLevels.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  offeredAt: timestamp("offered_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
