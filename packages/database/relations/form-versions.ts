import { relations } from "drizzle-orm";
import { formVersionsTable } from "../models/form-versions";
import { formTable } from "../models/form";
import { formSubmissionsTable } from "../models/form-submissions";

export const formVersionsRelations = relations(formVersionsTable, ({ one, many }) => ({
  form: one(formTable, {
    fields: [formVersionsTable.formId],
    references: [formTable.id],
  }),
  submissions: many(formSubmissionsTable),
}));
