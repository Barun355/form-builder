import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  boolean,
  text,
  jsonb,
  pgEnum,
  index,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";

// Token document types and the font allow-list live in @repo/theme so
// they can be shared by both server and client without dragging this
// package's Drizzle/pg deps into a browser bundle. This file is the
// storage layer (Drizzle table + pgEnum + indexes) only.
import type { ThemeTokensI } from "@repo/theme";

export const ThemeCategory = pgEnum("theme_category", [
  "standard",
  "branded",
  "event",
  "retro",
  "dark",
  "high_contrast",
  "minimal",
  "other",
]);

export const ThemeVisibility = pgEnum("theme_visibility", ["PRIVATE", "PUBLIC"]);

// Backward-compat alias for the Drizzle `$type<>()` narrowing in
// form-versions.ts. Identical to `ThemeTokensI` from @repo/theme; kept
// here so consumers that previously imported from this file keep working
// through the migration. Safe to remove once every consumer imports
// directly from @repo/theme.
export type ThemeTokensType = ThemeTokensI;

// ─── Table ──────────────────────────────────────────────────────────────

export const themesTable = pgTable("themes", {
  id: uuid("id").primaryKey().defaultRandom(),

  createdBy: uuid("created_by").references(() => usersTable.id).notNull(),

  name: varchar("name", { length: 80 }).notNull(),
  description: varchar("description", { length: 255 }),

  category: ThemeCategory().notNull().default("standard"),

  coverImageUrl: text("cover_image_url"),

  visibility: ThemeVisibility().notNull().default("PRIVATE"),

  tokens: jsonb("tokens").$type<ThemeTokensType>().notNull(),

  isDeleted: boolean("is_deleted").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  index("themes_created_by_idx").on(table.createdBy),
  index("themes_visibility_idx").on(table.visibility),
]);

export type SelectTheme = typeof themesTable.$inferSelect;
export type InsertTheme = typeof themesTable.$inferInsert;
