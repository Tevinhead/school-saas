import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { tenants } from "./tenant";
import { classes } from "./academic";
import { userProfiles } from "./user";

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentNumber: varchar("student_number", { length: 50 }).notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  dateOfBirth: timestamp("date_of_birth", { mode: "date" }),
  nationality: varchar("nationality", { length: 100 }),
  passportNumber: varchar("passport_number", { length: 50 }),
  visaStatus: varchar("visa_status", { length: 50 }),
  primaryLanguage: varchar("primary_language", { length: 50 }),
  enrollmentDate: timestamp("enrollment_date", { mode: "date" }),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>(),
  userProfileId: uuid("user_profile_id").references(() => userProfiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const guardians = pgTable("guardians", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  relationship: varchar("relationship", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  email: varchar("email", { length: 255 }),
  isEmergencyContact: boolean("is_emergency_contact").notNull().default(false),
  userProfileId: uuid("user_profile_id").references(() => userProfiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studentGuardians = pgTable("student_guardians", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  guardianId: uuid("guardian_id").notNull().references(() => guardians.id, { onDelete: "cascade" }),
});

export const classEnrollments = pgTable("class_enrollments", {
  id: uuid("id").defaultRandom().primaryKey(),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  enrolledAt: timestamp("enrolled_at", { withTimezone: true }).notNull().defaultNow(),
});
