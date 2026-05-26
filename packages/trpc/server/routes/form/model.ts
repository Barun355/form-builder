import { z } from "zod";

const formStatusEnum = z
  .enum(["draft", "published", "archived", "closed"])
  .describe("Form lifecycle status");

const formVisibilityEnum = z
  .enum(["PUBLIC", "UNLISTED"])
  .describe(
    "Discoverability. PUBLIC forms appear on the /explore page; UNLISTED are reachable only by direct link.",
  );

const slugShape = z
  .string()
  .min(1)
  .max(255)
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must be lowercase alphanumeric with single hyphens",
  );

const formVersionEmbeddedModel = z.object({
  id: z.uuid().describe("UUID of the version row"),
  version: z.number().int().min(1).describe("Monotonic version number"),
  schema: z.unknown().describe("Form schema as FormSchemaI JSON"),
  createdAt: z.date().describe("When the version was created"),
  updatedAt: z.date().nullable().describe("When the version was last updated"),
});

// ─── createForm ────────────────────────────────────────────────────────────
export const createFormInputModel = z.object({
  title: z.string().trim().min(1).max(55).describe("Form title"),
  description: z
    .string()
    .trim()
    .max(255)
    .optional()
    .describe("Optional form description"),
});

export const createFormOutputModel = z.object({
  id: z.uuid().describe("UUID of the newly created form"),
  title: z.string(),
  slug: z.string().describe("Auto-generated per-user-unique slug"),
  status: formStatusEnum,
});

// ─── listForms ─────────────────────────────────────────────────────────────
export const listFormsInputModel = z.object({
  status: formStatusEnum.optional().describe("Filter by lifecycle status"),
  search: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("Case-insensitive substring match against title and description"),
  sort: z
    .enum(["updatedAt", "createdAt", "title"])
    .optional()
    .describe("Sort column (default: updatedAt)"),
  order: z
    .enum(["asc", "desc"])
    .optional()
    .describe("Sort direction (default: desc)"),
  limit: z
    .number()
    .int()
    .min(1)
    .max(100)
    .optional()
    .describe("Items per page (default: 20, max: 100)"),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Items to skip (default: 0)"),
});

const listFormItemModel = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusEnum,
  visibility: formVisibilityEnum,
  publishedVersionId: z.uuid().nullable(),
  publishedVersionNumber: z
    .number()
    .int()
    .positive()
    .nullable()
    .describe("Version number of the published version, if any"),
  currentVersionNumber: z
    .number()
    .int()
    .positive()
    .describe("Latest version number for this form"),
  submissionCount: z
    .number()
    .int()
    .nonnegative()
    .describe("Count of completed submissions"),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
});

export const listFormsOutputModel = z.object({
  items: z.array(listFormItemModel),
  totalCount: z
    .number()
    .int()
    .nonnegative()
    .describe("Total matching forms across all pages"),
});

// ─── getFormById ───────────────────────────────────────────────────────────
export const getFormByIdInputModel = z.object({
  id: z.uuid().describe("UUID of the form to fetch"),
});

export const getFormByIdOutputModel = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  slug: z.string(),
  status: formStatusEnum,
  visibility: formVisibilityEnum,
  publishedVersionId: z.uuid().nullable(),
  createdAt: z.date().nullable(),
  updatedAt: z.date().nullable(),
  latestVersion: formVersionEmbeddedModel,
  publishedVersion: formVersionEmbeddedModel.optional(),
});

// ─── updateForm ────────────────────────────────────────────────────────────
// NOTE: no `.refine()` here — it produces a ZodEffects wrapper that
// `trpc-to-openapi` can't `.omit()` over (Zod v4). The "at least one field"
// check runs in the procedure handler instead.
export const updateFormInputModel = z.object({
  id: z.uuid(),
  title: z.string().trim().min(1).max(55).optional(),
  description: z.string().trim().max(255).nullable().optional(),
  slug: slugShape.optional(),
  visibility: formVisibilityEnum.optional(),
});

export const updateFormOutputModel = z.object({
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

// ─── softDeleteForm ────────────────────────────────────────────────────────
export const softDeleteFormInputModel = z.object({ id: z.uuid() });

export const softDeleteFormOutputModel = z.object({
  id: z.uuid(),
  isDeleted: z.literal(true),
});

// ─── duplicateForm ─────────────────────────────────────────────────────────
export const duplicateFormInputModel = z.object({ id: z.uuid() });

export const duplicateFormOutputModel = z.object({
  id: z.uuid(),
  title: z.string(),
  slug: z.string(),
  status: formStatusEnum,
});

// ─── State transitions ─────────────────────────────────────────────────────
const stateTransitionInputModel = z.object({ id: z.uuid() });

export const publishFormInputModel = stateTransitionInputModel;
export const publishFormOutputModel = z.object({
  id: z.uuid(),
  status: z.literal("published"),
  publishedVersionId: z.uuid(),
  publishedVersion: z.object({
    id: z.uuid(),
    version: z.number().int().min(1),
  }),
});

export const unpublishFormInputModel = stateTransitionInputModel;
export const archiveFormInputModel = stateTransitionInputModel;
export const closeFormInputModel = stateTransitionInputModel;
export const restoreFormInputModel = stateTransitionInputModel;

export const stateTransitionOutputModel = z.object({
  id: z.uuid(),
  status: formStatusEnum,
  publishedVersionId: z.uuid().nullable(),
});

// ─── getByPublicSlug ───────────────────────────────────────────────────────
export const getByPublicSlugInputModel = z.object({
  userSlug: z.string().min(1).max(255).describe("User's global form slug"),
  formSlug: z.string().min(1).max(255).describe("Per-user form slug"),
});

const publicVersionModel = z.object({
  id: z.uuid(),
  version: z.number().int().min(1),
  schema: z.unknown(),
});

export const getByPublicSlugOutputModel = z
  .object({
    id: z.uuid(),
    title: z.string(),
    description: z.string().nullable(),
    status: z.enum(["published", "closed"]),
    publishedVersion: publicVersionModel,
  })
  .nullable();

// ─── listPublic ───────────────────────────────────────────────────────────
export const listPublicInputModel = z.object({
  limit: z
    .number()
    .int()
    .min(1)
    .max(60)
    .optional()
    .describe("Items per page (default 24, max 60)"),
  offset: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe("Items to skip (default 0)"),
});

const publicListItemModel = z.object({
  id: z.uuid(),
  title: z.string(),
  description: z.string().nullable(),
  formSlug: z.string(),
  userSlug: z.string(),
  submissionCount: z.number().int().nonnegative(),
  publishedAt: z.date().nullable(),
});

export const listPublicOutputModel = z.object({
  items: z.array(publicListItemModel),
  totalCount: z.number().int().nonnegative(),
});
