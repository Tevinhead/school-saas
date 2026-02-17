import { pgTable, uuid, varchar, text, integer, timestamp } from "drizzle-orm/pg-core";
import { tenants, academicYears } from "./tenant";
import { userProfiles } from "./user";

export const gradeLevels = pgTable("grade_levels", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  curriculum: varchar("curriculum", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classes = pgTable("classes", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  gradeLevelId: uuid("grade_level_id").notNull().references(() => gradeLevels.id, { onDelete: "cascade" }),
  academicYearId: uuid("academic_year_id").notNull().references(() => academicYears.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  homeroomTeacherId: uuid("homeroom_teacher_id").references(() => userProfiles.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  code: varchar("code", { length: 20 }).notNull(),
  department: varchar("department", { length: 100 }),
  curriculum: varchar("curriculum", { length: 50 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const classSections = pgTable("class_sections", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  classId: uuid("class_id").notNull().references(() => classes.id, { onDelete: "cascade" }),
  subjectId: uuid("subject_id").notNull().references(() => subjects.id, { onDelete: "cascade" }),
  teacherId: uuid("teacher_id").references(() => userProfiles.id),
  termId: uuid("term_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
