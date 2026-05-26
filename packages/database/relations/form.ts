import { relations } from "drizzle-orm";
import { formTable } from "../models/form";
import { usersTable } from "../models/user";
import { formVersionsTable } from "../models/form-versions";
import { formSubmissionsTable } from "../models/form-submissions";

export const formRelations = relations(formTable, ({ one, many }) => ({
  creator: one(usersTable, {
    fields: [formTable.createdBy],
    references: [usersTable.id],
  }),
  versions: many(formVersionsTable),
  submissions: many(formSubmissionsTable),
}));
