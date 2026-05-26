import { relations } from "drizzle-orm";
import { usersTable } from "../models/user";
import { formTable } from "../models/form";

export const usersRelations = relations(usersTable, ({ many }) => ({
  forms: many(formTable),
}));
