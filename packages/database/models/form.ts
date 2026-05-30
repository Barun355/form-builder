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
import { themesTable } from "./theme";


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

    // Live theme attachment. Lives on the form (not the version row) so
    // theme swaps take effect on the public URL immediately, without
    // re-publishing. Schema versioning (form_versions) and visual
    // theming are intentionally separate concerns: versioning is for
    // history-preserving form structure changes; theme is a current-
    // state cosmetic attribute. See form/index.ts:getByPublicSlug.
    themeId: uuid("theme_id").references(() => themesTable.id),

    isDeleted: boolean("is_deleted").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  unique("forms_created_by_slug_unique").on(table.createdBy, table.slug),
  index("forms_created_by_idx").on(table.createdBy),
  index("forms_published_version_id_idx").on(table.publishedVersionId),
  index("forms_theme_id_idx").on(table.themeId),
])