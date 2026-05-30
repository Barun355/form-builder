import { formVersionService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import { badRequest, forbidden, notFound } from "../../utils/errors";
import {
  deleteVersionInputModel,
  deleteVersionOutputModel,
  getVersionInputModel,
  getVersionOutputModel,
  listVersionsInputModel,
  listVersionsOutputModel,
  revertToVersionInputModel,
  revertToVersionOutputModel,
  saveDraftInputModel,
  saveDraftOutputModel,
} from "./model";

const TAGS = ["Form Versions"];
const getPath = generatePath("/form-versions");

function mapServiceError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  if (lower.includes("forbidden")) throw forbidden();
  if (lower.includes("not found")) throw notFound(message);
  if (
    lower.includes("cannot") ||
    lower.includes("at least one")
  ) {
    throw badRequest(message);
  }
  throw err;
}

export const formVersionRouter = router({
  saveDraft: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/saveDraft"),
        tags: TAGS,
        summary: "Save the current draft schema for a form",
        description:
          "Upserts the current draft. If the form's latest version is the published one (frozen), inserts a new v(n+1). Otherwise overwrites the existing mutable draft. Rejects editing of archived or closed forms.",
      },
    })
    .input(saveDraftInputModel)
    .output(saveDraftOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formVersionService.saveDraft({
          formId: input.formId,
          schema: input.schema as never,
          requestedBy: ctx.user.id,
          themeId: input.themeId,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  listVersions: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/listVersions"),
        tags: TAGS,
        summary: "List versions of a form",
        description:
          "Returns versions in descending order. Each item carries `isPublished` (true if this is the form's current publishedVersionId) and `submissionCount` (number of submissions linked to this version).",
      },
    })
    .input(listVersionsInputModel)
    .output(listVersionsOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await formVersionService.list({
          formId: input.formId,
          requestedBy: ctx.user.id,
          limit: input.limit,
          offset: input.offset,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  getVersion: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getVersion"),
        tags: TAGS,
        summary: "Get a single form version by id",
        description:
          "Returns the full version row including its schema, isPublished flag, and submission count. Ownership verified via join to the form.",
      },
    })
    .input(getVersionInputModel)
    .output(getVersionOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await formVersionService.getById({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  revertToVersion: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/revertToVersion"),
        tags: TAGS,
        summary: "Set a past version's schema as the current draft",
        description:
          "Writes the target version's schema into the current draft. The target version itself is NOT modified — history stays immutable. If no draft exists yet (latest is the published version), a new v(n+1) is created.",
      },
    })
    .input(revertToVersionInputModel)
    .output(revertToVersionOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formVersionService.revert({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  deleteVersion: protectedProcedure
    .meta({
      openapi: {
        method: "DELETE",
        path: getPath("/deleteVersion"),
        tags: TAGS,
        summary: "Delete a non-published version",
        description:
          "Hard-deletes a version row. Three rules: (1) the currently published version cannot be deleted, (2) a version with linked submissions cannot be deleted, (3) the only remaining version of a form cannot be deleted.",
      },
    })
    .input(deleteVersionInputModel)
    .output(deleteVersionOutputModel)
    .mutation(async ({ input, ctx }) => {
      try {
        return await formVersionService.deleteVersion({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),
});
