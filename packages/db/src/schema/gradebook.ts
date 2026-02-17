import { pgTable, uuid, varchar, text, timestamp, boolean, jsonb, numeric, integer, unique } from "drizzle-orm/pg-core";
import { tenants, terms } from "./tenant";
import { classSections } from "./academic";
import { students } from "./student";
import { userProfiles } from "./user";

export const gradingScales = pgTable("grading_scales", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(),
  type: varchar("type", { length: 20 }).notNull(), // numeric, letter, percentage
  scaleDefinition: jsonb("scale_definition").notNull().$type<Record<string, unknown>>(),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const assessments = pgTable("assessments", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  classSectionId: uuid("class_section_id").notNull().references(() => classSections.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 50 }).notNull(), // homework, quiz, test, exam, project
  gradingScaleId: uuid("grading_scale_id").references(() => gradingScales.id),
  maxScore: numeric("max_score", { precision: 10, scale: 2 }),
  weight: numeric("weight", { precision: 5, scale: 2 }),
  dueDate: timestamp("due_date", { mode: "date" }),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const grades = pgTable(
  "grades",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    assessmentId: uuid("assessment_id").notNull().references(() => assessments.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    score: numeric("score", { precision: 10, scale: 2 }),
    letterGrade: varchar("letter_grade", { length: 5 }),
    comments: text("comments"),
    gradedById: uuid("graded_by_id").references(() => userProfiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("grades_assessment_student").on(table.assessmentId, table.studentId),
  ]
);

export const reportCards = pgTable("report_cards", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  termId: uuid("term_id").notNull().references(() => terms.id, { onDelete: "cascade" }),
  status: varchar("status", { length: 20 }).notNull().default("draft"), // draft, submitted, approved, published
  comments: jsonb("comments").$type<Array<{ classSectionId: string; subjectName: string; comment: string }>>(),
  rejectionNote: text("rejection_note"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
