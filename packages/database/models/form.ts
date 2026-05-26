import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  pgEnum,
  unique,
  boolean,
  index,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { usersTable } from "./user";
import { formVersionsTable } from "./form-versions";


export const FormStats = pgEnum("form_status", ["draft", "published", "archived", "closed"])

export const FormVisibility = pgEnum("form_visibility", ["PUBLIC", "UNLISTED"])

export const formTable = pgTable("forms", {
    id: uuid("id").primaryKey().defaultRandom(),

    title: varchar("title", { length: 55 }).notNull(),
    description: varchar("description", { length: 255 }),

    slug: varchar("slug", { length: 255 }).notNull(),
    createdBy: uuid("created_by").references(() => usersTable.id).notNull(),

    status: FormStats().notNull().default("draft"),

    visibility: FormVisibility().notNull().default("UNLISTED"),

    publishedVersionId: uuid("published_version_id").references((): AnyPgColumn => formVersionsTable.id),

    isDeleted: boolean("is_deleted").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  unique("forms_created_by_slug_unique").on(table.createdBy, table.slug),
  index("forms_created_by_idx").on(table.createdBy),
  index("forms_published_version_id_idx").on(table.publishedVersionId),
])