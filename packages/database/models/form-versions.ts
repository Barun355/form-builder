import {
  pgTable,
  uuid,
  timestamp,
  integer,
  jsonb,
  boolean,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { formTable } from "./form";

export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "email"
  | "phone"
  | "select"
  | "checkbox"
  | "radio"
  | "date"
  | "datetime"
  | "file"

export interface FieldValidation {
  min?: number

  max?: number

  minLength?: number

  maxLength?: number

  regex?: string
}

export interface FieldOption {
  id: string

  label: string

  value: string
}

export interface PageSchemaI {
  id: string

  title: string

  description?: string

  order: number

  sectionIds: string[]
}

export interface SectionSchemaI {
  id: string

  title: string

  description?: string

  order: number

  pageId: string

  fieldIds: string[]
}

export interface FieldSchemaI {
  id: string

  type: FieldType

  name: string

  label: string

  placeholder?: string

  helpText?: string

  required?: boolean

  defaultValue?: any

  disabled?: boolean

  order: number

  sectionId: string

  options?: FieldOption[]

  validation?: FieldValidation
}

export interface ThankYouConfig {
  title?: string;
  message?: string;
  showSubmitAnotherButton?: boolean;
  redirectUrl?: string;
  redirectDelayMs?: number;
}

export interface FormSchemaI {
  pages: PageSchemaI[];
  sections: SectionSchemaI[];
  fields: FieldSchemaI[];
  thankYou?: ThankYouConfig;
}

export type FormSchemaType = FormSchemaI;

export const formVersionsTable = pgTable("form_versions", {
  id: uuid("id").primaryKey().defaultRandom(),

  formId: uuid("form_id").references(() => formTable.id).notNull(),

  version: integer("version").notNull(),

  schema: jsonb("schema").$type<FormSchemaType>().notNull(),

  isDeleted: boolean("is_deleted").notNull().default(false),

  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
}, (table) => [
  unique("form_id_version_unique").on(table.formId, table.version),
  index("form_versions_form_id_idx").on(table.formId),
]);
