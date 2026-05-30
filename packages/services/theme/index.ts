import {
  and,
  asc,
  count,
  db,
  desc,
  eq,
  ilike,
  ne,
  or,
  sql,
} from "@repo/database";
import {
  themesTable,
  type SelectTheme,
} from "@repo/database/models/theme";
import { formTable } from "@repo/database/models/form";
import { formVersionsTable } from "@repo/database/models/form-versions";
import { usersTable } from "@repo/database/models/user";

import {
  assertCanReferenceInput,
  createThemeInput,
  duplicateThemeInput,
  getThemeByIdInput,
  listThemesInput,
  publishThemeInput,
  softDeleteThemeInput,
  themeUsageCountInput,
  unpublishThemeInput,
  updateThemeInput,
  type AssertCanReferenceInputType,
  type CreateThemeInputType,
  type CreateThemeOutputType,
  type DuplicateThemeInputType,
  type DuplicateThemeOutputType,
  type GetThemeByIdInputType,
  type GetThemeByIdOutputType,
  type ListThemesInputType,
  type ListThemesOutputType,
  type PublishThemeInputType,
  type SoftDeleteThemeInputType,
  type SoftDeleteThemeOutputType,
  type ThemeUsageCountInputType,
  type ThemeUsageCountOutputType,
  type ThemeVisibilityOutputType,
  type UnpublishThemeInputType,
  type UpdateThemeInputType,
  type UpdateThemeOutputType,
} from "@repo/theme";
import {
  assertTokensSize,
  assertUrlsAreSafe,
  computeContrastWarnings,
} from "@repo/theme";

class ThemeService {
  /**
   * Loads a theme by id and verifies that the caller OWNS it. Used by every
   * write path (update / delete / publish / unpublish). Soft-deleted themes
   * are reported as "not found".
   *
   * Throws plain `Error` whose message the route layer's `mapServiceError`
   * sniffs to map to a tRPC error code.
   */
  private async assertOwnership({
    id,
    requestedBy,
  }: {
    id: string;
    requestedBy: string;
  }): Promise<SelectTheme> {
    const [theme] = await db
      .select()
      .from(themesTable)
      .where(eq(themesTable.id, id));

    if (!theme || theme.isDeleted) throw new Error("Theme not found");
    if (theme.createdBy !== requestedBy) throw new Error("Forbidden");
    return theme;
  }

  /**
   * Visibility-checked read: a theme is visible to the caller if (a) they
   * own it, or (b) it is PUBLIC. Returns the theme or throws "Theme not
   * found". CRITICALLY: throws the SAME error string for missing rows AND
   * private-no-access. This is intentional — leaking the existence of a
   * theme via different error codes is the cross-tenant info leak we are
   * specifically defending against.
   *
   * Called both by `getById` (the read path) and by `assertCanReference`
   * (the write-time visibility check from form / form-versions services).
   */
  private async loadVisibleTheme(
    id: string,
    requestedBy: string,
  ): Promise<SelectTheme> {
    const [theme] = await db
      .select()
      .from(themesTable)
      .where(eq(themesTable.id, id));

    if (!theme || theme.isDeleted) throw new Error("Theme not found");
    if (theme.createdBy !== requestedBy && theme.visibility !== "PUBLIC") {
      throw new Error("Theme not found");
    }
    return theme;
  }

  /**
   * Per-user theme name uniqueness. Throws "Conflict: theme name already
   * in use" when the caller already owns a non-deleted theme with the same
   * name. Pass `excludeId` to skip a specific row (used by update so a
   * theme can keep its own name during a partial patch). Soft-deleted
   * themes don't count toward the constraint — renaming back to a freed-up
   * name is allowed.
   *
   * Constraint scope: per-(createdBy, name). Cross-user collisions are
   * NOT blocked here — two different users can both have "Untitled Theme"
   * because they're different namespaces in the gallery.
   */
  private async assertNameUnique(
    name: string,
    ownerId: string,
    excludeId?: string,
  ): Promise<void> {
    const conditions = [
      eq(themesTable.createdBy, ownerId),
      eq(themesTable.name, name),
      eq(themesTable.isDeleted, false),
    ];
    if (excludeId) conditions.push(ne(themesTable.id, excludeId));

    const [collision] = await db
      .select({ id: themesTable.id })
      .from(themesTable)
      .where(and(...conditions))
      .limit(1);

    if (collision) {
      throw new Error("Conflict: theme name already in use");
    }
  }

  /**
   * Generates a non-colliding "<base> (copy)" / "<base> (copy 2)" / ...
   * name for duplicate(). Walks the suffix counter until a free slot is
   * found, capped at 99 attempts to prevent runaway. Honors the 80-char
   * cap on the name column by truncating the base.
   */
  private async generateDuplicateName(
    base: string,
    ownerId: string,
  ): Promise<string> {
    const truncatedBase = base.slice(0, 70);
    for (let i = 1; i <= 99; i += 1) {
      const candidate = (
        i === 1 ? `${truncatedBase} (copy)` : `${truncatedBase} (copy ${i})`
      ).slice(0, 80);
      const [collision] = await db
        .select({ id: themesTable.id })
        .from(themesTable)
        .where(
          and(
            eq(themesTable.createdBy, ownerId),
            eq(themesTable.name, candidate),
            eq(themesTable.isDeleted, false),
          ),
        )
        .limit(1);
      if (!collision) return candidate;
    }
    // Astronomically unlikely; disambiguate with the millisecond tail so
    // the insert at least succeeds without an infinite loop.
    return `${truncatedBase} (copy ${Date.now().toString().slice(-6)})`.slice(
      0,
      80,
    );
  }

  // ─── create ──────────────────────────────────────────────────────────

  public async create(
    payload: CreateThemeInputType,
  ): Promise<CreateThemeOutputType> {
    const parsed = await createThemeInput.parseAsync(payload);
    assertUrlsAreSafe(parsed.tokens);
    assertTokensSize(parsed.tokens);
    await this.assertNameUnique(parsed.name, parsed.requestedBy);

    const [theme] = await db
      .insert(themesTable)
      .values({
        createdBy: parsed.requestedBy,
        name: parsed.name,
        description: parsed.description,
        category: parsed.category,
        coverImageUrl: parsed.coverImageUrl,
        visibility: parsed.visibility,
        tokens: parsed.tokens,
      })
      .returning();

    if (!theme) throw new Error("Internal: failed to create theme");

    return {
      id: theme.id,
      name: theme.name,
      category: theme.category,
      visibility: theme.visibility,
    };
  }

  // ─── list ────────────────────────────────────────────────────────────

  public async list(
    payload: ListThemesInputType,
  ): Promise<ListThemesOutputType> {
    const { requestedBy, scope, category, search, sort, order, limit, offset } =
      await listThemesInput.parseAsync(payload);

    // Build where clause based on scope.
    //   mine   → all themes the caller owns (PRIVATE + PUBLIC).
    //   public → all PUBLIC themes (including the caller's own — by design).
    const scopeFilter =
      scope === "mine"
        ? eq(themesTable.createdBy, requestedBy)
        : eq(themesTable.visibility, "PUBLIC");

    const whereExpression = and(
      eq(themesTable.isDeleted, false),
      scopeFilter,
      category ? eq(themesTable.category, category) : undefined,
      search
        ? or(
            ilike(themesTable.name, `%${search}%`),
            ilike(themesTable.description, `%${search}%`),
          )
        : undefined,
    );

    const sortColumnMap = {
      updatedAt: themesTable.updatedAt,
      createdAt: themesTable.createdAt,
      name: themesTable.name,
    } as const;
    const orderFn = order === "asc" ? asc : desc;

    const items = await db
      .select({
        id: themesTable.id,
        name: themesTable.name,
        description: themesTable.description,
        category: themesTable.category,
        visibility: themesTable.visibility,
        coverImageUrl: themesTable.coverImageUrl,
        createdBy: themesTable.createdBy,
        createdByName: usersTable.fullName,
        tokens: themesTable.tokens,
        createdAt: themesTable.createdAt,
        updatedAt: themesTable.updatedAt,
      })
      .from(themesTable)
      .innerJoin(usersTable, eq(usersTable.id, themesTable.createdBy))
      .where(whereExpression)
      .orderBy(orderFn(sortColumnMap[sort]))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db
      .select({ totalCount: count() })
      .from(themesTable)
      .where(whereExpression);

    return {
      items: items.map((row) => ({
        id: row.id,
        name: row.name,
        description: row.description ?? null,
        category: row.category,
        visibility: row.visibility,
        coverImageUrl: row.coverImageUrl ?? null,
        createdBy: row.createdBy,
        createdByName: row.createdByName ?? null,
        isOwner: row.createdBy === requestedBy,
        // Compact light-palette fingerprint for the picker swatch row.
        // Tokens themselves are NOT serialized out — only the 3 colors
        // below, via the listThemesOutput schema.
        previewColors: {
          primary: row.tokens.palette.light.colors.primary,
          surface: row.tokens.palette.light.colors.surface,
          pageBackground:
            row.tokens.palette.light.background.type === "solid"
              ? row.tokens.palette.light.background.color
              : row.tokens.palette.light.colors.background,
        },
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      totalCount: Number(totalRow?.totalCount ?? 0),
    };
  }

  // ─── getById ─────────────────────────────────────────────────────────

  public async getById(
    payload: GetThemeByIdInputType,
  ): Promise<GetThemeByIdOutputType> {
    const { id, requestedBy } = await getThemeByIdInput.parseAsync(payload);
    const theme = await this.loadVisibleTheme(id, requestedBy);

    // Author display name — used by the "by <name>" line in the gallery
    // card and the editor topbar.
    const [author] = await db
      .select({ fullName: usersTable.fullName })
      .from(usersTable)
      .where(eq(usersTable.id, theme.createdBy));

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description ?? null,
      category: theme.category,
      visibility: theme.visibility,
      coverImageUrl: theme.coverImageUrl ?? null,
      createdBy: theme.createdBy,
      createdByName: author?.fullName ?? null,
      isOwner: theme.createdBy === requestedBy,
      tokens: theme.tokens,
      contrastWarnings: computeContrastWarnings(theme.tokens),
      createdAt: theme.createdAt,
      updatedAt: theme.updatedAt,
    };
  }

  // ─── update ──────────────────────────────────────────────────────────

  public async update(
    payload: UpdateThemeInputType,
  ): Promise<UpdateThemeOutputType> {
    const parsed = await updateThemeInput.parseAsync(payload);
    const { id, requestedBy } = parsed;

    await this.assertOwnership({ id, requestedBy });

    if (parsed.tokens !== undefined) {
      assertUrlsAreSafe(parsed.tokens);
      assertTokensSize(parsed.tokens);
    }

    if (parsed.name !== undefined) {
      // `excludeId: id` so renaming a theme to its own current name
      // (no-op rename, common when only other fields change but the
      // form posts the unchanged name too) doesn't false-positive.
      await this.assertNameUnique(parsed.name, requestedBy, id);
    }

    const patch: Partial<{
      name: string;
      description: string | null;
      category: SelectTheme["category"];
      coverImageUrl: string | null;
      visibility: SelectTheme["visibility"];
      tokens: SelectTheme["tokens"];
    }> = {};
    if (parsed.name !== undefined) patch.name = parsed.name;
    if (parsed.description !== undefined) patch.description = parsed.description;
    if (parsed.category !== undefined) patch.category = parsed.category;
    if (parsed.coverImageUrl !== undefined) patch.coverImageUrl = parsed.coverImageUrl;
    if (parsed.visibility !== undefined) patch.visibility = parsed.visibility;
    if (parsed.tokens !== undefined) patch.tokens = parsed.tokens;

    await db
      .update(themesTable)
      .set(patch)
      .where(eq(themesTable.id, id));

    return this.getById({ id, requestedBy });
  }

  // ─── softDelete ──────────────────────────────────────────────────────

  public async softDelete(
    payload: SoftDeleteThemeInputType,
  ): Promise<SoftDeleteThemeOutputType> {
    const { id, requestedBy } =
      await softDeleteThemeInput.parseAsync(payload);

    await this.assertOwnership({ id, requestedBy });

    await db
      .update(themesTable)
      .set({ isDeleted: true })
      .where(eq(themesTable.id, id));

    return { id, isDeleted: true as const };
  }

  // ─── duplicate ───────────────────────────────────────────────────────
  // Clones any theme the caller can SEE (own or PUBLIC) into a new
  // PRIVATE theme owned by the caller. The visibility check is delegated
  // to loadVisibleTheme so duplicating a private theme you don't own
  // fails with "Theme not found" (no leakage).

  public async duplicate(
    payload: DuplicateThemeInputType,
  ): Promise<DuplicateThemeOutputType> {
    const { id, requestedBy } =
      await duplicateThemeInput.parseAsync(payload);

    const source = await this.loadVisibleTheme(id, requestedBy);

    // Walk the suffix counter until we find an unused name, so duplicate
    // is safe to invoke any number of times on the same source.
    const newName = await this.generateDuplicateName(source.name, requestedBy);

    const [theme] = await db
      .insert(themesTable)
      .values({
        createdBy: requestedBy,
        name: newName,
        description: source.description,
        category: source.category,
        coverImageUrl: source.coverImageUrl,
        visibility: "PRIVATE",
        tokens: source.tokens,
      })
      .returning();

    if (!theme) throw new Error("Internal: failed to duplicate theme");

    return {
      id: theme.id,
      name: theme.name,
      category: theme.category,
      visibility: theme.visibility,
    };
  }

  // ─── publish / unpublish ─────────────────────────────────────────────

  public async publish(
    payload: PublishThemeInputType,
  ): Promise<ThemeVisibilityOutputType> {
    const { id, requestedBy } = await publishThemeInput.parseAsync(payload);
    await this.assertOwnership({ id, requestedBy });

    await db
      .update(themesTable)
      .set({ visibility: "PUBLIC" })
      .where(eq(themesTable.id, id));

    return { id, visibility: "PUBLIC" as const };
  }

  public async unpublish(
    payload: UnpublishThemeInputType,
  ): Promise<ThemeVisibilityOutputType> {
    const { id, requestedBy } = await unpublishThemeInput.parseAsync(payload);
    await this.assertOwnership({ id, requestedBy });

    await db
      .update(themesTable)
      .set({ visibility: "PRIVATE" })
      .where(eq(themesTable.id, id));

    return { id, visibility: "PRIVATE" as const };
  }

  // ─── assertCanReference (cross-tenant safety choke-point) ────────────
  // Called by form.createForm and formVersions.saveDraft before they
  // write `themeId` onto a form_versions row. Throws "Theme not found"
  // if the caller cannot reference the theme — owner-or-public are the
  // only valid cases. Returns the theme on success so callers can read
  // `tokens` for the publish snapshot.
  //
  // ⚠️  If a NEW caller ever writes form_versions.theme_id, it MUST go
  // through this method first. This is the single trust boundary for
  // cross-tenant theme references.

  public async assertCanReference(
    payload: AssertCanReferenceInputType,
  ): Promise<SelectTheme> {
    const { id, requestedBy } =
      await assertCanReferenceInput.parseAsync(payload);
    return this.loadVisibleTheme(id, requestedBy);
  }

  // ─── usageCount ──────────────────────────────────────────────────────
  // Returns how many published forms are currently rendering with this
  // theme's snapshot. Visibility-gated through loadVisibleTheme — the
  // caller must own the theme or it must be PUBLIC; otherwise we throw
  // "Theme not found" rather than leak existence via a count.
  //
  // Joins forms onto the version pointed to by `form.publishedVersionId`
  // (the live published version) and counts those whose themeId matches.
  // Draft versions aren't counted because they aren't viewer-visible —
  // "usage" here means "viewers are seeing it." Soft-deleted forms and
  // forms in non-public statuses (draft / archived) are excluded by the
  // `status = published` filter, since publish state is the only way
  // viewers reach the snapshot.

  public async usageCount(
    payload: ThemeUsageCountInputType,
  ): Promise<ThemeUsageCountOutputType> {
    const { id, requestedBy } =
      await themeUsageCountInput.parseAsync(payload);

    // Visibility gate — owner or PUBLIC. Throws "Theme not found" for
    // PRIVATE themes owned by someone else.
    await this.loadVisibleTheme(id, requestedBy);

    const [row] = await db
      .select({ cnt: count() })
      .from(formTable)
      .innerJoin(
        formVersionsTable,
        eq(formVersionsTable.id, formTable.publishedVersionId),
      )
      .where(
        and(
          eq(formTable.status, "published"),
          eq(formTable.isDeleted, false),
          eq(formVersionsTable.themeId, id),
        ),
      );

    return { count: Number(row?.cnt ?? 0) };
  }
}

export default ThemeService;
