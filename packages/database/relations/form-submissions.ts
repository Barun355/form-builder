import { relations } from "drizzle-orm";
import { formSubmissionsTable } from "../models/form-submissions";
import { formTable } from "../models/form";
import { formVersionsTable } from "../models/form-versions";

export const formSubmissionsRelations = relations(formSubmissionsTable, ({ one }) => ({
  form: one(formTable, {
    fields: [formSubmissionsTable.formId],
    references: [formTable.id],
  }),
  version: one(formVersionsTable, {
    fields: [formSubmissionsTable.formVersionId],
    references: [formVersionsTable.id],
  }),
}));
