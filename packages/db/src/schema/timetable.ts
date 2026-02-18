import { pgTable, uuid, varchar, text, integer, timestamp, boolean, unique, time } from "drizzle-orm/pg-core";
import { tenants, terms } from "./tenant";
import { classes, subjects, classSections } from "./academic";
import { userProfiles } from "./user";

export const periods = pgTable("periods", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  shortName: varchar("short_name", { length: 20 }).notNull(),
  sortOrder: integer("sort_order").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  isBreak: boolean("is_break").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("periods_tenant_sort_order").on(t.tenantId, t.sortOrder),
]);

export const timetableEntries = pgTable("timetable_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  periodId: uuid("period_id").notNull().references(() => periods.id, { onDelete: "cascade" }),
  dayOfWeek: varchar("day_of_week", { length: 10 }).notNull(),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").notNull().references(() => userProfiles.id),
  room: varchar("room", { length: 50 }),
  classSectionId: uuid("class_section_id").references(() => classSections.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique("timetable_entries_unique_slot").on(t.termId, t.classId, t.periodId, t.dayOfWeek),
]);

export const substitutions = pgTable("substitutions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  timetableEntryId: uuid("timetable_entry_id").notNull().references(() => timetableEntries.id, { onDelete: "cascade" }),
  date: timestamp("date", { mode: "date" }).notNull(),
  originalTeacherId: uuid("original_teacher_id").notNull().references(() => userProfiles.id),
  substituteTeacherId: uuid("substitute_teacher_id").notNull().references(() => userProfiles.id),
  reason: varchar("reason", { length: 255 }),
  notes: text("notes"),
  createdById: uuid("created_by_id").references(() => userProfiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
