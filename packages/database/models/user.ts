import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  pgEnum,
} from "drizzle-orm/pg-core";

const userRoles = pgEnum("user_role", ["user", "admin"]);
const userPlans = pgEnum("user_plan", ["free", "pro", "business"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  fullName: varchar("full_name", { length: 80 }).notNull(),

  email: varchar("email", { length: 255 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),

  profileImageUrl: text("profile_image_url"),

  salt: text('salt'),
  password: text('password'),

  role: userRoles("role").notNull().default("user"),

  // Subscription plan. Drives form-creation caps and submission visibility
  // limits in dashboard/analytics queries. Public submission acceptance is
  // never affected by plan.
  plan: userPlans("plan").notNull().default("free"),

  userGlobalFormSlug: varchar("user_global_form_slug", { length: 255 }).notNull().unique(),

  passwordChangedAt: timestamp("password_changed_at").notNull().defaultNow(),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
});

export type SelectUser = typeof usersTable.$inferSelect;
export type InsertUser = typeof usersTable.$inferInsert;
