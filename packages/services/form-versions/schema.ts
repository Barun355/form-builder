import { z } from "zod";

// Runtime Zod mirrors of the FormSchemaI interface tree
// (packages/database/models/form-versions.ts).
// Shape-only validation: cross-reference integrity (e.g. `field.sectionId`
// must reference an existing `section.id`) is NOT enforced server-side at v1.

const fieldTypeEnum = z.enum([
  "text",
  "textarea",
  "number",
  "email",
  "phone",
  "select",
  "checkbox",
  "radio",
  "date",
  "datetime",
  "file",
]);

const fieldValidationSchema = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  minLength: z.number().int().optional(),
  maxLength: z.number().int().optional(),
  regex: z.string().optional(),
});

const fieldOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
  value: z.string(),
});

const pageSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  sectionIds: z.array(z.string()),
});

const sectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  order: z.number().int().nonnegative(),
  pageId: z.string(),
  fieldIds: z.array(z.string()),
});

const fieldSchema = z.object({
  id: z.string(),
  type: fieldTypeEnum,
  name: z.string(),
  label: z.string(),
  placeholder: z.string().optional(),
  helpText: z.string().optional(),
  required: z.boolean().optional(),
  defaultValue: z.unknown().optional(),
  disabled: z.boolean().optional(),
  order: z.number().int().nonnegative(),
  sectionId: z.string(),
  options: z.array(fieldOptionSchema).optional(),
  validation: fieldValidationSchema.optional(),
});

const thankYouSchema = z.object({
  title: z.string().max(200).optional(),
  message: z.string().max(2000).optional(),
  showSubmitAnotherButton: z.boolean().optional(),
  redirectUrl: z.string().url().optional(),
  redirectDelayMs: z.number().int().min(0).max(60_000).optional(),
});

export const formSchemaIZod = z.object({
  pages: z.array(pageSchema),
  sections: z.array(sectionSchema),
  fields: z.array(fieldSchema),
  thankYou: thankYouSchema.optional(),
});

export type FormSchemaIInput = z.input<typeof formSchemaIZod>;
