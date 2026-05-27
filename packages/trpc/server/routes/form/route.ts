import { and, count, db, eq, isNotNull } from "@repo/database";
import { formTable } from "@repo/database/models/form";
import { usersTable } from "@repo/database/models/user";
import { sendFirstFormEmailWithStatus } from "@repo/mailer";
import { formService } from "../../services";
import { protectedProcedure, publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { badRequest, conflict, forbidden, notFound, planLocked } from "../../utils/errors";
import {
  archiveFormInputModel,
  closeFormInputModel,
  createFormInputModel,
  createFormOutputModel,
  duplicateFormInputModel,
  duplicateFormOutputModel,
  getByPublicSlugInputModel,
  getByPublicSlugOutputModel,
  getFormByIdInputModel,
  getFormByIdOutputModel,
  listFormsInputModel,
  listFormsOutputModel,
  listPublicInputModel,
  listPublicOutputModel,
  publishFormInputModel,
  publishFormOutputModel,
  restoreFormInputModel,
  softDeleteFormInputModel,
  softDeleteFormOutputModel,
  stateTransitionOutputModel,
  unpublishFormInputModel,
  updateFormInputModel,
  updateFormOutputModel,
} from "./model";

const TAGS = ["Form"];
const getPath = generatePath("/form");

function mapServiceError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  // Plan-cap sentinel — propagates structured planLocked reason to client
  if (message.startsWith("PLAN_LOCKED:form_limit")) {
    throw planLocked("form_limit");
  }
  if (lower.includes("forbidden")) throw forbidden();
  if (lower.includes("not found")) throw notFound(message);
  if (lower.includes("conflict") || lower.includes("already in use")) {
    throw conflict(message);
  }
  if (lower.includes("at least one")) throw badRequest(message);
  if (lower.includes("cannot be")) throw badRequest(message);
  // Postgres unique violation (e.g. surfacing slug collision through DB)
  if (
    lower.includes("duplicate key") ||
    lower.includes("unique constraint")
  ) {
    throw conflict("A form with this slug already exists");
  }
  throw err;
}

export const formRouter = router({
  createForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/createForm"),
        tags: TAGS,
        summary: "Create a new form",
        description:
          "Creates a new draft form and an empty v1 schema version in a single transaction. The form's per-user-unique slug is auto-generated from the title.",
      },
    })
    .input(createFormInputModel)
    .output(createFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.create({
          ...input,
          createdBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  listForms: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/listForms"),
        tags: TAGS,
        summary: "List forms owned by the current user",
        description:
          "Paginated, filterable list of the caller's forms. Each row includes the count of completed submissions. Soft-deleted forms are excluded.",
      },
    })
    .input(listFormsInputModel)
    .output(listFormsOutputModel)
    .query(async ({ input, ctx }) => {
      return await formService.list({
        createdBy: ctx.user.id,
        ...input,
      });
    }),

  getFormById: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getFormById"),
        tags: TAGS,
        summary: "Get a form by id",
        description:
          "Returns the form along with its latest version (for the builder) and its published version (for rendering) if any. Caller must own the form.",
      },
    })
    .input(getFormByIdInputModel)
    .output(getFormByIdOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await formService.getById({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  updateForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/updateForm"),
        tags: TAGS,
        summary: "Update a form's title, description, or slug",
        description:
          "Updates the provided fields. Slug must remain unique within the caller's forms. Title/slug changes never modify each other.",
      },
    })
    .input(updateFormInputModel)
    .output(updateFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      if (
        input.title === undefined &&
        input.description === undefined &&
        input.slug === undefined &&
        input.visibility === undefined
      ) {
        throw badRequest(
          "At least one of title, description, slug, or visibility must be provided",
        );
      }

      try {
        return await formService.update({
          ...input,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  softDeleteForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/softDeleteForm"),
        tags: TAGS,
        summary: "Soft-delete a form",
        description:
          "Marks the form as deleted. The slug is suffixed with `-deleted-<timestamp>` so the original slug can be reused by a new form.",
      },
    })
    .input(softDeleteFormInputModel)
    .output(softDeleteFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.softDelete({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  duplicateForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/duplicateForm"),
        tags: TAGS,
        summary: "Duplicate a form",
        description:
          "Creates a new draft form titled \"Copy of <original>\" with a freshly generated slug and a v1 version cloned from the source's latest schema.",
      },
    })
    .input(duplicateFormInputModel)
    .output(duplicateFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.duplicate({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  publishForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/publishForm"),
        tags: TAGS,
        summary: "Publish a form",
        description:
          "Promotes the form's latest version to live. Valid from `draft` or `published` (idempotent if the latest is already published). To reopen a closed form, restore it to draft first.",
      },
    })
    .input(publishFormInputModel)
    .output(publishFormOutputModel)
    .mutation(async ({ input, ctx }) => {
      let result: Awaited<ReturnType<typeof formService.publish>>;
      try {
        result = await formService.publish({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }

      // First-publish email — fires once per user. We count distinct
      // non-deleted forms with a publishedVersionId AFTER the publish
      // commits; if that's exactly 1, this was the user's first publish
      // ever. unpublishForm preserves publishedVersionId, so this counter
      // is monotonic — re-publishing after an unpublish won't double-fire.
      const [{ totalPublished } = { totalPublished: 0 }] = await db
        .select({ totalPublished: count() })
        .from(formTable)
        .where(
          and(
            eq(formTable.createdBy, ctx.user.id),
            eq(formTable.isDeleted, false),
            isNotNull(formTable.publishedVersionId),
          ),
        );
      if (Number(totalPublished ?? 0) !== 1) return result;

      const [user] = await db
        .select({
          id: usersTable.id,
          email: usersTable.email,
          fullName: usersTable.fullName,
        })
        .from(usersTable)
        .where(eq(usersTable.id, ctx.user.id))
        .limit(1);
      if (!user) return result;

      const status = await sendFirstFormEmailWithStatus(user);
      return {
        ...result,
        notification: { template: "first-form" as const, ...status },
      };
    }),

  unpublishForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/unpublishForm"),
        tags: TAGS,
        summary: "Unpublish a form",
        description:
          "Returns the form to draft state. The published version is preserved (publishedVersionId stays set) and the latest version is cloned to a new draft if no newer draft exists, so subsequent edits don't mutate historical schema.",
      },
    })
    .input(unpublishFormInputModel)
    .output(stateTransitionOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.unpublish({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  archiveForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/archiveForm"),
        tags: TAGS,
        summary: "Archive a form",
        description:
          "Hides the form from listings and public access. Valid from `published` or `closed`. publishedVersionId is preserved so the form can be restored later with its full history.",
      },
    })
    .input(archiveFormInputModel)
    .output(stateTransitionOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.archive({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  closeForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/closeForm"),
        tags: TAGS,
        summary: "Close a form",
        description:
          "Stops accepting submissions while keeping the form publicly visible. The public renderer shows the schema with a \"closed\" banner. Valid only from `published`.",
      },
    })
    .input(closeFormInputModel)
    .output(stateTransitionOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.close({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  restoreForm: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/restoreForm"),
        tags: TAGS,
        summary: "Restore an archived or closed form",
        description:
          "Returns the form to draft state. The published version is cloned into a new draft so edits don't mutate historical schema. To reopen a closed form for new submissions, restore then publish.",
      },
    })
    .input(restoreFormInputModel)
    .output(stateTransitionOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formService.restore({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  listPublic: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/listPublic"),
        tags: TAGS,
        summary: "List PUBLIC published forms for the explore page",
        description:
          "Paginated feed of forms with `visibility = PUBLIC` and `status = published`. Ordered by completed-submission count desc, then by last-updated desc. UNLISTED forms never appear here.",
      },
    })
    .input(listPublicInputModel)
    .output(listPublicOutputModel)
    .query(async ({ input }) => {
      return await formService.listPublicForms(input);
    }),

  getByPublicSlug: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getByPublicSlug"),
        tags: TAGS,
        summary: "Resolve a public form by (userSlug, formSlug)",
        description:
          "Returns the form's published version for rendering on the public URL. Returns `null` if the form is missing, soft-deleted, or in a non-public state (draft/archived). Returns `status: 'closed'` for closed forms so the renderer can show a \"closed\" message with the schema.",
      },
    })
    .input(getByPublicSlugInputModel)
    .output(getByPublicSlugOutputModel)
    .query(async ({ input }) => {
      return await formService.getByPublicSlug(input);
    }),
});
