import { db, eq } from "@repo/database";
import { themesTable } from "@repo/database/models/theme";
import type { ThemeTokensI } from "@repo/theme";

/**
 * Cross-tenant safety check for theme references on form_versions.
 *
 * This is the single trust boundary for "can `requestedBy` legally
 * reference theme `id`?" — used by every code path that writes a
 * theme id onto a `form_versions` row (formService.create,
 * formService.publish, formVersionService.saveDraft, etc.).
 *
 * Throws "Theme not found" when the theme is missing, soft-deleted,
 * or PRIVATE and owned by someone other than the requester. Returns
 * the row's id + tokens on success so callers that need the snapshot
 * (publish) don't have to re-query.
 *
 * Implemented as a free function (not a service method) so it can be
 * imported from sibling services without taking the `@repo/services/theme`
 * subpath dependency, which fails to resolve under bundler-mode tsc
 * from the web app. Uses `@repo/theme` only for the type import.
 */
export async function assertCanReferenceTheme(
  themeId: string,
  requestedBy: string,
): Promise<{ id: string; tokens: ThemeTokensI }> {
  const [theme] = await db
    .select({
      id: themesTable.id,
      tokens: themesTable.tokens,
      createdBy: themesTable.createdBy,
      visibility: themesTable.visibility,
      isDeleted: themesTable.isDeleted,
    })
    .from(themesTable)
    .where(eq(themesTable.id, themeId));

  if (!theme || theme.isDeleted) throw new Error("Theme not found");
  if (theme.visibility !== "PUBLIC" && theme.createdBy !== requestedBy) {
    throw new Error("Theme not found");
  }
  return { id: theme.id, tokens: theme.tokens as ThemeTokensI };
}
