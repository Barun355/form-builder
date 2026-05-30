import { relations } from "drizzle-orm";
import { themesTable } from "../models/theme";
import { usersTable } from "../models/user";
import { formVersionsTable } from "../models/form-versions";

export const themeRelations = relations(themesTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [themesTable.createdBy],
    references: [usersTable.id],
  }),
  formVersions: many(formVersionsTable),
}));
