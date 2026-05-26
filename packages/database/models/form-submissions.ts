import {
  pgTable,
  uuid,
  jsonb,
  timestamp,
  pgEnum,
  boolean,
  index,
} from "drizzle-orm/pg-core"

import { formTable } from "./form"
import { formVersionsTable } from "./form-versions"

export interface FormSubmissionMetaI {
    deviceType?: string;
    browser?: string;
    os?: string;
    locale?: string;

    timezone?: string;
    referrer?: string;

    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;

    userAgent?: string;
    screenResolution?: string;
}

export type FormSubmissionMetaType = FormSubmissionMetaI;
export type FormSubmissionDataType = Record<string, any>;

export const formSubmissionStatusEnum = pgEnum("form_submission_status", ["started", "completed"])

export const formSubmissionsTable = pgTable(
  "form_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    formId: uuid("form_id")
      .references(() => formTable.id)
      .notNull(),

    status: formSubmissionStatusEnum().notNull().default("started"),

    formVersionId: uuid("form_version_id")
      .references(() => formVersionsTable.id)
      .notNull(),

    data: jsonb("data").$type<FormSubmissionDataType>().notNull(),
    meta: jsonb("meta").$type<FormSubmissionMetaType>(),

    startedAt: timestamp("started_at").defaultNow().notNull(),

    submittedAt: timestamp("submitted_at"),

    isDeleted: boolean("is_deleted").notNull().default(false),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").$onUpdate(() => new Date()),
  },
  (table) => [
    index("form_submissions_form_id_idx").on(table.formId),
    index("form_submissions_form_version_id_idx").on(table.formVersionId),
    index("form_submissions_submitted_at_idx").on(table.submittedAt),
  ],
)