import { themeService } from "../../services";
import { protectedProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  tooManyRequests,
} from "../../utils/errors";
import { themeWriteLimiter } from "../../utils/rate-limiters";
import {
  createThemeInputModel,
  createThemeOutputModel,
  duplicateThemeInputModel,
  duplicateThemeOutputModel,
  getThemeByIdInputModel,
  getThemeByIdOutputModel,
  listThemesInputModel,
  listThemesOutputModel,
  publishThemeInputModel,
  softDeleteThemeInputModel,
  softDeleteThemeOutputModel,
  themeUsageCountInputModel,
  themeUsageCountOutputModel,
  themeVisibilityOutputModel,
  unpublishThemeInputModel,
  updateThemeInputModel,
  updateThemeOutputModel,
} from "./model";

const TAGS = ["Theme"];
const getPath = generatePath("/theme");

function mapServiceError(err: unknown): never {
  const message = err instanceof Error ? err.message : String(err);
  const lower = message.toLowerCase();
  // "Theme not found" covers both genuine misses AND private themes the
  // caller can't see — see ThemeService.loadVisibleTheme. Both surface as
  // 404 to avoid leaking existence.
  if (lower.includes("not found")) throw notFound(message);
  if (lower.includes("forbidden")) throw forbidden();
  // Per-user name uniqueness — service throws "Conflict: theme name already in use"
  if (lower.includes("conflict")) throw conflict(message);
  if (message.startsWith("TOKENS_TOO_LARGE")) {
    throw badRequest("Theme is too large");
  }
  if (message.startsWith("INVALID_URL")) {
    throw badRequest("Theme contains an invalid URL");
  }
  if (lower.includes("at least one")) throw badRequest(message);
  throw err;
}

/** Per-user write limiter check. Throws TOO_MANY_REQUESTS when exceeded. */
function consumeWriteLimit(userId: string): void {
  const rl = themeWriteLimiter.consume(userId);
  if (!rl.allowed) throw tooManyRequests(rl.retryAfterMs);
}

export const themeRouter = router({
  create: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/create"),
        tags: TAGS,
        summary: "Create a new theme",
        description:
          "Creates a theme owned by the caller. `tokens` defaults to the platform's default theme tokens when omitted. New themes start PRIVATE.",
      },
    })
    .input(createThemeInputModel)
    .output(createThemeOutputModel)
    .mutation(async ({ input, ctx }) => {
      consumeWriteLimit(ctx.user.id);
      try {
        return await themeService.create({
          ...input,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  list: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/list"),
        tags: TAGS,
        summary: "List themes",
        description:
          "Paginated theme list. `scope: 'mine'` returns themes the caller owns (PRIVATE + PUBLIC). `scope: 'public'` returns all PUBLIC themes, including the caller's own.",
      },
    })
    .input(listThemesInputModel)
    .output(listThemesOutputModel)
    .query(async ({ input, ctx }) => {
      return await themeService.list({
        ...input,
        requestedBy: ctx.user.id,
      });
    }),

  getById: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/getById"),
        tags: TAGS,
        summary: "Get a theme by id",
        description:
          "Returns the theme if it is visible to the caller (owned OR PUBLIC). For private themes the caller does not own, returns `NOT_FOUND` with the same shape as a genuine miss — existence is not leaked.",
      },
    })
    .input(getThemeByIdInputModel)
    .output(getThemeByIdOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await themeService.getById({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  update: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/update"),
        tags: TAGS,
        summary: "Update a theme",
        description:
          "Updates the provided fields on a theme the caller owns. Updating `tokens` re-runs server-side validation and size cap (10 KB). Edits propagate immediately to drafts that reference this theme; already-published forms are unaffected (they hold their own snapshot).",
      },
    })
    .input(updateThemeInputModel)
    .output(updateThemeOutputModel)
    .mutation(async ({ input, ctx }) => {
      consumeWriteLimit(ctx.user.id);
      try {
        return await themeService.update({
          ...input,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  softDelete: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/softDelete"),
        tags: TAGS,
        summary: "Soft-delete a theme",
        description:
          "Marks the theme as deleted. Form drafts referencing it silently fall back to the system default theme; already-published forms keep their snapshot.",
      },
    })
    .input(softDeleteThemeInputModel)
    .output(softDeleteThemeOutputModel)
    .mutation(async ({ input, ctx }) => {
      consumeWriteLimit(ctx.user.id);
      try {
        return await themeService.softDelete({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  duplicate: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/duplicate"),
        tags: TAGS,
        summary: "Duplicate a theme",
        description:
          "Clones any theme the caller can see (owned OR PUBLIC) into a new PRIVATE theme owned by the caller. Duplicating a private theme you do not own returns `NOT_FOUND`.",
      },
    })
    .input(duplicateThemeInputModel)
    .output(duplicateThemeOutputModel)
    .mutation(async ({ input, ctx }) => {
      consumeWriteLimit(ctx.user.id);
      try {
        return await themeService.duplicate({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  publish: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/publish"),
        tags: TAGS,
        summary: "Publish a theme (make PUBLIC)",
        description:
          "Flips the theme's visibility to PUBLIC. Anyone signed in can then apply it to their own forms. The theme remains owned by the caller — only the owner can edit or unpublish it.",
      },
    })
    .input(publishThemeInputModel)
    .output(themeVisibilityOutputModel)
    .mutation(async ({ input, ctx }) => {
      consumeWriteLimit(ctx.user.id);
      try {
        return await themeService.publish({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  unpublish: protectedProcedure
    .meta({
      openapi: {
        method: "POST",
        path: getPath("/unpublish"),
        tags: TAGS,
        summary: "Unpublish a theme (back to PRIVATE)",
        description:
          "Flips visibility back to PRIVATE. Form drafts in OTHER users' libraries that still reference this theme will fall back to the system default. Already-published forms continue to render from their own snapshot.",
      },
    })
    .input(unpublishThemeInputModel)
    .output(themeVisibilityOutputModel)
    .mutation(async ({ input, ctx }) => {
      consumeWriteLimit(ctx.user.id);
      try {
        return await themeService.unpublish({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),

  usageCount: protectedProcedure
    .meta({
      openapi: {
        method: "GET",
        path: getPath("/usageCount"),
        tags: TAGS,
        summary: "How many published forms snapshot from this theme",
        description:
          "Aggregate count for the snapshot-drift caption in the theme editor. Counts forms with status=published whose published version's theme_id matches. Visibility-gated like getById — non-owners can only see counts for PUBLIC themes.",
      },
    })
    .input(themeUsageCountInputModel)
    .output(themeUsageCountOutputModel)
    .query(async ({ input, ctx }) => {
      try {
        return await themeService.usageCount({
          id: input.id,
          requestedBy: ctx.user.id,
        });
      } catch (err) {
        mapServiceError(err);
      }
    }),
});
