import { relations } from "drizzle-orm";
import { formTable } from "../models/form";
import { usersTable } from "../models/user";
import { formVersionsTable } from "../models/form-versions";
import { formSubmissionsTable } from "../models/form-submissions";
import { themesTable } from "../models/theme";

export const formRelations = relations(formTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [formTable.createdBy],
    references: [usersTable.id],
  }),
  versions: many(formVersionsTable),
  submissions: many(formSubmissionsTable),
  // Live theme attachment — see formService.getByPublicSlug for how the
  // JOIN materializes the current tokens on every public render.
  theme: one(themesTable, {
    fields: [formTable.themeId],
    references: [themesTable.id],
  }),
}));
