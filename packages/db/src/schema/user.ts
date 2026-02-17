import { pgTable, uuid, varchar, text, timestamp } from "drizzle-orm/pg-core";
import { tenants } from "./tenant";

export const userRoleEnum = ["super_admin", "school_admin", "teacher", "student", "parent"] as const;
export type UserRole = (typeof userRoleEnum)[number];

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  tenantId: text("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
  clerkUserId: varchar("clerk_user_id", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().$type<UserRole>(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  locale: varchar("locale", { length: 10 }).notNull().default("en"),
  avatarUrl: varchar("avatar_url", { length: 500 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
