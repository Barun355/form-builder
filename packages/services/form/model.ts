import { z } from "zod";

export const formStatusEnum = z.enum([
  "draft",
  "published",
  "archived",
  "closed",
]);

export type FormStatus = z.infer<typeof formStatusEnum>;

export const formVisibilityEnum = z.enum(["PUBLIC", "UNLISTED"]);
export type FormVisibility = z.infer<typeof formVisibilityEnum>;

const slugShape = z
  .string()
  .min(1)
  .max(255)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase alphanumeric with single hyphens");

// ─── create ────────────────────────────────────────────────────────────────
// `themeId` is optional:
//   - omitted/null → form starts with no theme (renders System Default)
//   - uuid         → service verifies the caller can reference it
//                    (themeService.assertCanReference) and stores it on
//                    the v1 form_versions row.
export const createFormInput = z.object({
  title: z.string().trim().min(1).max(55),
  description: z.string().trim().max(255).optional(),
  createdBy: z.uuid(),
  themeId: z.uuid().nullable().optional(),
});
export type CreateFormInputType = z.infer<typeof createFormInput>;

export const createFormOutput = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  status: formStatusEnum,
});
export type CreateFormOutputType = z.infer<typeof createFormOutput>;

// ─── lastUsedThemeId ──────────────────────────────────────────────────────
export const lastUsedThemeIdInput = z.object({
  requestedBy: z.uuid(),
});
export type LastUsedThemeIdInputType = z.infer<typeof lastUsedThemeIdInput>;

export const lastUsedThemeIdOutput = z.object({
  themeId: z.uuid().nullable(),
});
export type LastUsedThemeIdOutputType = z.infer<typeof lastUsedThemeIdOutput>;

// ─── list ──────────────────────────────────────────────────────────────────
export const listFormsInput = z.object({
  createdBy: z.uuid(),
  status: formStatusEnum.optional(),
  search: z.string().trim().min(1).optional(),
  sort: z.enum(["updatedAt", "createdAt", "title"]).default("updatedAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});
// `z.input` keeps fields with defaults optional from the caller's perspective.
// The service body uses the parsed (output) shape internally.
export type ListFormsInputType = z.input<typeof listFormsInput>;

const listFormItem = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusEnum,
  visibility: formVisibilityEnum,
  publishedVersionId: z.uuid().nullable(),
  publishedVersionNumber: z.number().int().positive().nullable(),
  currentVersionNumber: z.number().int().positive(),
  submissionCount: z.number().int().nonnegative(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type ListFormItemType = z.infer<typeof listFormItem>;

export const listFormsOutput = z.object({
  items: z.array(listFormItem),
  totalCount: z.number().int().nonnegative(),
});
export type ListFormsOutputType = z.infer<typeof listFormsOutput>;

// ─── getById ───────────────────────────────────────────────────────────────
export const getFormByIdInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type GetFormByIdInputType = z.infer<typeof getFormByIdInput>;

const formVersionEmbedded = z.object({
  id: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown(),
  themeId: z.uuid().nullable(),
  createdAt: z.date(),
  updatedAt: z.date().nullable(),
});

export const getFormByIdOutput = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusEnum,
  visibility: formVisibilityEnum,
  publishedVersionId: z.uuid().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  latestVersion: formVersionEmbedded,
  publishedVersion: formVersionEmbedded.optional(),
});
export type GetFormByIdOutputType = z.infer<typeof getFormByIdOutput>;

// ─── update ────────────────────────────────────────────────────────────────
export const updateFormInput = z
  .object({
    id: z.uuid(),
    requestedBy: z.uuid(),
    title: z.string().trim().min(1).max(55).optional(),
    description: z.string().trim().max(255).nullable().optional(),
    slug: slugShape.optional(),
    visibility: formVisibilityEnum.optional(),
  })
  .refine(
    (d) =>
      d.title !== undefined ||
      d.description !== undefined ||
      d.slug !== undefined ||
      d.visibility !== undefined,
    {
      message:
        "At least one of title, description, slug, or visibility must be provided",
    },
  );
export type UpdateFormInputType = z.infer<typeof updateFormInput>;

export const updateFormOutput = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusEnum,
  visibility: formVisibilityEnum,
  publishedVersionId: z.uuid().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});
export type UpdateFormOutputType = z.infer<typeof updateFormOutput>;

// ─── softDelete ────────────────────────────────────────────────────────────
export const softDeleteFormInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type SoftDeleteFormInputType = z.infer<typeof softDeleteFormInput>;

export const softDeleteFormOutput = z.object({
  id: z.uuid(),
  isDeleted: z.literal(true),
});
export type SoftDeleteFormOutputType = z.infer<typeof softDeleteFormOutput>;

// ─── duplicate ─────────────────────────────────────────────────────────────
export const duplicateFormInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});
export type DuplicateFormInputType = z.infer<typeof duplicateFormInput>;

export const duplicateFormOutput = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  status: formStatusEnum,
});
export type DuplicateFormOutputType = z.infer<typeof duplicateFormOutput>;

// ─── State transitions (publish / unpublish / archive / close / restore) ──
// All share the same input shape: { id, requestedBy }.
const stateTransitionInput = z.object({
  id: z.uuid(),
  requestedBy: z.uuid(),
});

export const publishFormInput = stateTransitionInput;
export type PublishFormInputType = z.infer<typeof publishFormInput>;

export const publishFormOutput = z.object({
  id: z.uuid(),
  status: z.literal("published"),
  publishedVersionId: z.uuid(),
  publishedVersion: z.object({
    id: z.uuid(),
    version: z.number().int().min(1),
  }),
});
export type PublishFormOutputType = z.infer<typeof publishFormOutput>;

export const unpublishFormInput = stateTransitionInput;
export type UnpublishFormInputType = z.infer<typeof unpublishFormInput>;

export const archiveFormInput = stateTransitionInput;
export type ArchiveFormInputType = z.infer<typeof archiveFormInput>;

export const closeFormInput = stateTransitionInput;
export type CloseFormInputType = z.infer<typeof closeFormInput>;

export const restoreFormInput = stateTransitionInput;
export type RestoreFormInputType = z.infer<typeof restoreFormInput>;

export const stateTransitionOutput = z.object({
  id: z.uuid(),
  status: formStatusEnum,
  publishedVersionId: z.uuid().nullable(),
});
export type StateTransitionOutputType = z.infer<typeof stateTransitionOutput>;

// ─── getByPublicSlug ──────────────────────────────────────────────────────
export const getByPublicSlugInput = z.object({
  userSlug: z.string().min(1).max(255),
  formSlug: z.string().min(1).max(255),
});
export type GetByPublicSlugInputType = z.infer<typeof getByPublicSlugInput>;

const publicVersionEmbedded = z.object({
  id: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown(),
});

export const publicFormDetail = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(["published", "closed"]),
  publishedVersion: publicVersionEmbedded,
  // Theme tokens snapshot captured at form publish time. NULL when the
  // form has no theme attached. Owned by the form (not the theme owner),
  // so deletes/edits to the source theme never break already-published
  // forms.
  theme: z.unknown().nullable(),
});
export type PublicFormDetailType = z.infer<typeof publicFormDetail>;

// ─── listPublic ───────────────────────────────────────────────────────────
// Public explore feed: PUBLIC + published forms only, ordered by submission
// count. Pagination via limit/offset.
export const listPublicInput = z.object({
  limit: z.number().int().min(1).max(60).default(24),
  offset: z.number().int().min(0).default(0),
});
export type ListPublicInputType = z.input<typeof listPublicInput>;

const publicListItem = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  formSlug: z.string(),
  userSlug: z.string(),
  submissionCount: z.number().int().nonnegative(),
  publishedAt: z.date().nullable(),
});
export type PublicListItemType = z.infer<typeof publicListItem>;

export const listPublicOutput = z.object({
  items: z.array(publicListItem),
  totalCount: z.number().int().nonnegative(),
});
export type ListPublicOutputType = z.infer<typeof listPublicOutput>;
