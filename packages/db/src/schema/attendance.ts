import { pgTable, uuid, varchar, text, timestamp, integer, unique } from "drizzle-orm/pg-core";
import { tenants } from "./tenant";
import { students } from "./student";
import { classSections } from "./academic";
import { userProfiles } from "./user";

export const attendanceStatusEnum = ["present", "absent", "late", "excused"] as const;
export type AttendanceStatus = (typeof attendanceStatusEnum)[number];

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
    classSectionId: uuid("class_section_id").references(() => classSections.id, { onDelete: "cascade" }),
    date: timestamp("date", { mode: "date" }).notNull(),
    status: varchar("status", { length: 20 }).notNull().$type<AttendanceStatus>(),
    period: integer("period"),
    notes: text("notes"),
    recordedById: uuid("recorded_by_id").references(() => userProfiles.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique("attendance_unique").on(table.studentId, table.date, table.period, table.classSectionId),
  ]
);
