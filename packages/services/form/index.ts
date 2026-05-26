import {
  alias,
  and,
  asc,
  count,
  db,
  desc,
  eq,
  ilike,
  max,
  ne,
  or,
  sql,
} from "@repo/database";
import { formTable } from "@repo/database/models/form";
import {
  formVersionsTable,
  type FormSchemaType,
} from "@repo/database/models/form-versions";
import { formSubmissionsTable } from "@repo/database/models/form-submissions";

import {
  archiveFormInput,
  closeFormInput,
  createFormInput,
  duplicateFormInput,
  getByPublicSlugInput,
  getFormByIdInput,
  listFormsInput,
  publishFormInput,
  restoreFormInput,
  softDeleteFormInput,
  unpublishFormInput,
  updateFormInput,
  type ArchiveFormInputType,
  type CloseFormInputType,
  type CreateFormInputType,
  type CreateFormOutputType,
  type DuplicateFormInputType,
  type DuplicateFormOutputType,
  type GetByPublicSlugInputType,
  type GetFormByIdInputType,
  type GetFormByIdOutputType,
  type ListFormsInputType,
  type ListFormsOutputType,
  type PublicFormDetailType,
  type PublishFormInputType,
  type PublishFormOutputType,
  type RestoreFormInputType,
  type SoftDeleteFormInputType,
  type SoftDeleteFormOutputType,
  type StateTransitionOutputType,
  type UnpublishFormInputType,
  type UpdateFormInputType,
  type UpdateFormOutputType,
} from "./model";
import { generateFormSlug } from "./slug";
import { usersTable } from "@repo/database/models/user";

const EMPTY_FORM_SCHEMA: FormSchemaType = {
  pages: [],
  sections: [],
  fields: [],
};

class FormService {
  /**
   * Loads a form by id and verifies that the caller owns it. Throws plain
   * `Error` whose message is sniffed by the route layer to map to a tRPC
   * error code. Soft-deleted forms appear as "not found".
   */
  private async assertOwnership({
    id,
    requestedBy,
  }: {
    id: string;
    requestedBy: string;
  }) {
    const [form] = await db
      .select()
      .from(formTable)
      .where(eq(formTable.id, id));

    if (!form || form.isDeleted) throw new Error("Form not found");
    if (form.createdBy !== requestedBy) throw new Error("Forbidden");
    return form;
  }

  public async create(
    payload: CreateFormInputType,
  ): Promise<CreateFormOutputType> {
    const { title, description, createdBy } =
      await createFormInput.parseAsync(payload);

    return await db.transaction(async (tx) => {
      const slug = generateFormSlug(title);

      const [form] = await tx
        .insert(formTable)
        .values({
          title,
          description,
          slug,
          status: "draft",
          createdBy,
        })
        .returning();

      if (!form) throw new Error("Internal: failed to create form");

      await tx.insert(formVersionsTable).values({
        formId: form.id,
        version: 1,
        schema: EMPTY_FORM_SCHEMA,
      });

      return {
        id: form.id,
        title: form.title,
        slug: form.slug,
        status: form.status,
      };
    });
  }

  public async list(
    payload: ListFormsInputType,
  ): Promise<ListFormsOutputType> {
    const { createdBy, status, search, sort, order, limit, offset } =
      await listFormsInput.parseAsync(payload);

    // Subquery: completed-submission count per form (excludes soft-deleted submissions)
    const submissionCountSq = db
      .select({
        formId: formSubmissionsTable.formId,
        cnt: count().as("cnt"),
      })
      .from(formSubmissionsTable)
      .where(
        and(
          eq(formSubmissionsTable.status, "completed"),
          eq(formSubmissionsTable.isDeleted, false),
        ),
      )
      .groupBy(formSubmissionsTable.formId)
      .as("submission_counts");

    // Subquery: max version number per form (= current/latest version number)
    const latestVersionSq = db
      .select({
        formId: formVersionsTable.formId,
        maxVersion: max(formVersionsTable.version).as("max_version"),
      })
      .from(formVersionsTable)
      .groupBy(formVersionsTable.formId)
      .as("latest_versions");

    // Aliased join for the published version's version number
    const publishedVersionAlias = alias(formVersionsTable, "published_version");

    const whereExpression = and(
      eq(formTable.createdBy, createdBy),
      eq(formTable.isDeleted, false),
      status ? eq(formTable.status, status) : undefined,
      search
        ? or(
            ilike(formTable.title, `%${search}%`),
            ilike(formTable.description, `%${search}%`),
          )
        : undefined,
    );

    const sortColumnMap = {
      updatedAt: formTable.updatedAt,
      createdAt: formTable.createdAt,
      title: formTable.title,
    } as const;
    const orderFn = order === "asc" ? asc : desc;

    const items = await db
      .select({
        id: formTable.id,
        title: formTable.title,
        description: formTable.description,
        slug: formTable.slug,
        status: formTable.status,
        publishedVersionId: formTable.publishedVersionId,
        createdAt: formTable.createdAt,
        updatedAt: formTable.updatedAt,
        submissionCount: sql<number>`COALESCE(${submissionCountSq.cnt}, 0)::int`,
        publishedVersionNumber: publishedVersionAlias.version,
        currentVersionNumber: sql<number>`COALESCE(${latestVersionSq.maxVersion}, 1)::int`,
      })
      .from(formTable)
      .leftJoin(
        submissionCountSq,
        eq(submissionCountSq.formId, formTable.id),
      )
      .leftJoin(
        latestVersionSq,
        eq(latestVersionSq.formId, formTable.id),
      )
      .leftJoin(
        publishedVersionAlias,
        eq(publishedVersionAlias.id, formTable.publishedVersionId),
      )
      .where(whereExpression)
      .orderBy(orderFn(sortColumnMap[sort]))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db
      .select({ totalCount: count() })
      .from(formTable)
      .where(whereExpression);

    return {
      items: items.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        slug: row.slug,
        status: row.status,
        publishedVersionId: row.publishedVersionId ?? null,
        publishedVersionNumber: row.publishedVersionNumber ?? null,
        currentVersionNumber: Number(row.currentVersionNumber ?? 1),
        submissionCount: Number(row.submissionCount ?? 0),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      totalCount: Number(totalRow?.totalCount ?? 0),
    };
  }

  public async getById(
    payload: GetFormByIdInputType,
  ): Promise<GetFormByIdOutputType> {
    const { id, requestedBy } = await getFormByIdInput.parseAsync(payload);

    const form = await this.assertOwnership({ id, requestedBy });

    const [latestVersion] = await db
      .select()
      .from(formVersionsTable)
      .where(eq(formVersionsTable.formId, id))
      .orderBy(desc(formVersionsTable.version))
      .limit(1);

    if (!latestVersion) {
      throw new Error("Internal: form has no versions");
    }

    let publishedVersion: GetFormByIdOutputType["publishedVersion"];
    if (form.publishedVersionId) {
      const [pv] = await db
        .select()
        .from(formVersionsTable)
        .where(eq(formVersionsTable.id, form.publishedVersionId))
        .limit(1);
      if (pv) {
        publishedVersion = {
          id: pv.id,
          version: pv.version,
          schema: pv.schema,
          createdAt: pv.createdAt,
          updatedAt: pv.updatedAt,
        };
      }
    }

    return {
      id: form.id,
      title: form.title,
      description: form.description ?? null,
      slug: form.slug,
      status: form.status,
      publishedVersionId: form.publishedVersionId ?? null,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
      latestVersion: {
        id: latestVersion.id,
        version: latestVersion.version,
        schema: latestVersion.schema,
        createdAt: latestVersion.createdAt,
        updatedAt: latestVersion.updatedAt,
      },
      publishedVersion,
    };
  }

  public async update(
    payload: UpdateFormInputType,
  ): Promise<UpdateFormOutputType> {
    const { id, requestedBy, title, description, slug } =
      await updateFormInput.parseAsync(payload);

    await this.assertOwnership({ id, requestedBy });

    if (slug !== undefined) {
      const [collision] = await db
        .select({ id: formTable.id })
        .from(formTable)
        .where(
          and(
            eq(formTable.createdBy, requestedBy),
            eq(formTable.slug, slug),
            ne(formTable.id, id),
          ),
        );
      if (collision) {
        throw new Error("Conflict: slug already in use for another of your forms");
      }
    }

    const patch: {
      title?: string;
      description?: string | null;
      slug?: string;
    } = {};
    if (title !== undefined) patch.title = title;
    if (description !== undefined) patch.description = description;
    if (slug !== undefined) patch.slug = slug;

    const [updated] = await db
      .update(formTable)
      .set(patch)
      .where(eq(formTable.id, id))
      .returning();

    if (!updated) throw new Error("Form not found");

    return {
      id: updated.id,
      title: updated.title,
      description: updated.description ?? null,
      slug: updated.slug,
      status: updated.status,
      publishedVersionId: updated.publishedVersionId ?? null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  public async softDelete(
    payload: SoftDeleteFormInputType,
  ): Promise<SoftDeleteFormOutputType> {
    const { id, requestedBy } =
      await softDeleteFormInput.parseAsync(payload);

    const sourceForm = await this.assertOwnership({ id, requestedBy });

    // Rename slug so the original is free for reuse by a new form.
    // Truncate to fit varchar(255).
    const deletedSuffix = `-deleted-${Date.now()}`;
    const newSlug = `${sourceForm.slug}${deletedSuffix}`.slice(0, 255);

    await db
      .update(formTable)
      .set({ isDeleted: true, slug: newSlug })
      .where(eq(formTable.id, id));

    return { id, isDeleted: true as const };
  }

  // ─── State transitions ───────────────────────────────────────────────────

  public async publish(
    payload: PublishFormInputType,
  ): Promise<PublishFormOutputType> {
    const { id, requestedBy } = await publishFormInput.parseAsync(payload);

    return await db.transaction(async (tx) => {
      const [form] = await tx
        .select()
        .from(formTable)
        .where(eq(formTable.id, id));

      if (!form || form.isDeleted) throw new Error("Form not found");
      if (form.createdBy !== requestedBy) throw new Error("Forbidden");
      if (form.status !== "draft" && form.status !== "published") {
        throw new Error(
          `Form cannot be published from status '${form.status}'`,
        );
      }

      const [latest] = await tx
        .select({ id: formVersionsTable.id, version: formVersionsTable.version })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, id))
        .orderBy(desc(formVersionsTable.version))
        .limit(1);

      if (!latest) {
        throw new Error("Internal: form has no versions");
      }

      // Idempotent: already published with this exact version → no-op.
      if (
        form.status === "published" &&
        form.publishedVersionId === latest.id
      ) {
        return {
          id: form.id,
          status: "published" as const,
          publishedVersionId: latest.id,
          publishedVersion: { id: latest.id, version: latest.version },
        };
      }

      await tx
        .update(formTable)
        .set({ status: "published", publishedVersionId: latest.id })
        .where(eq(formTable.id, id));

      return {
        id: form.id,
        status: "published" as const,
        publishedVersionId: latest.id,
        publishedVersion: { id: latest.id, version: latest.version },
      };
    });
  }

  public async unpublish(
    payload: UnpublishFormInputType,
  ): Promise<StateTransitionOutputType> {
    const { id, requestedBy } = await unpublishFormInput.parseAsync(payload);

    return await db.transaction(async (tx) => {
      const [form] = await tx
        .select()
        .from(formTable)
        .where(eq(formTable.id, id));

      if (!form || form.isDeleted) throw new Error("Form not found");
      if (form.createdBy !== requestedBy) throw new Error("Forbidden");
      if (form.status !== "published") {
        throw new Error(
          `Form cannot be unpublished from status '${form.status}'`,
        );
      }
      if (!form.publishedVersionId) {
        throw new Error("Internal: published form has no publishedVersionId");
      }

      const [latest] = await tx
        .select({ id: formVersionsTable.id, version: formVersionsTable.version })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, id))
        .orderBy(desc(formVersionsTable.version))
        .limit(1);

      if (!latest) {
        throw new Error("Internal: form has no versions");
      }

      // Clone published version into a new draft if no newer draft exists.
      // Guarantees the new latest is mutable while history stays immutable.
      if (latest.id === form.publishedVersionId) {
        const [publishedVersion] = await tx
          .select({ schema: formVersionsTable.schema })
          .from(formVersionsTable)
          .where(eq(formVersionsTable.id, form.publishedVersionId))
          .limit(1);

        if (!publishedVersion) {
          throw new Error("Internal: publishedVersion row not found");
        }

        await tx.insert(formVersionsTable).values({
          formId: id,
          version: latest.version + 1,
          schema: publishedVersion.schema,
        });
      }

      await tx
        .update(formTable)
        .set({ status: "draft" })
        .where(eq(formTable.id, id));

      return {
        id: form.id,
        status: "draft" as const,
        publishedVersionId: form.publishedVersionId,
      };
    });
  }

  public async archive(
    payload: ArchiveFormInputType,
  ): Promise<StateTransitionOutputType> {
    const { id, requestedBy } = await archiveFormInput.parseAsync(payload);

    const form = await this.assertOwnership({ id, requestedBy });
    if (form.status !== "published" && form.status !== "closed") {
      throw new Error(`Form cannot be archived from status '${form.status}'`);
    }

    await db
      .update(formTable)
      .set({ status: "archived" })
      .where(eq(formTable.id, id));

    return {
      id: form.id,
      status: "archived" as const,
      publishedVersionId: form.publishedVersionId,
    };
  }

  public async close(
    payload: CloseFormInputType,
  ): Promise<StateTransitionOutputType> {
    const { id, requestedBy } = await closeFormInput.parseAsync(payload);

    const form = await this.assertOwnership({ id, requestedBy });
    if (form.status !== "published") {
      throw new Error(`Form cannot be closed from status '${form.status}'`);
    }
    if (!form.publishedVersionId) {
      throw new Error("Internal: published form has no publishedVersionId");
    }

    await db
      .update(formTable)
      .set({ status: "closed" })
      .where(eq(formTable.id, id));

    return {
      id: form.id,
      status: "closed" as const,
      publishedVersionId: form.publishedVersionId,
    };
  }

  public async restore(
    payload: RestoreFormInputType,
  ): Promise<StateTransitionOutputType> {
    const { id, requestedBy } = await restoreFormInput.parseAsync(payload);

    return await db.transaction(async (tx) => {
      const [form] = await tx
        .select()
        .from(formTable)
        .where(eq(formTable.id, id));

      if (!form || form.isDeleted) throw new Error("Form not found");
      if (form.createdBy !== requestedBy) throw new Error("Forbidden");
      if (form.status !== "archived" && form.status !== "closed") {
        throw new Error(`Form cannot be restored from status '${form.status}'`);
      }
      if (!form.publishedVersionId) {
        throw new Error(
          "Internal: restorable form has no publishedVersionId",
        );
      }

      const [publishedVersion] = await tx
        .select({ schema: formVersionsTable.schema })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.id, form.publishedVersionId))
        .limit(1);

      if (!publishedVersion) {
        throw new Error("Internal: publishedVersion row not found");
      }

      const [latest] = await tx
        .select({ version: formVersionsTable.version })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, id))
        .orderBy(desc(formVersionsTable.version))
        .limit(1);

      if (!latest) {
        throw new Error("Internal: form has no versions");
      }

      // Always clone the published version into a new draft on restore so the
      // new latest is mutable and historical versions stay frozen.
      await tx.insert(formVersionsTable).values({
        formId: id,
        version: latest.version + 1,
        schema: publishedVersion.schema,
      });

      await tx
        .update(formTable)
        .set({ status: "draft" })
        .where(eq(formTable.id, id));

      return {
        id: form.id,
        status: "draft" as const,
        publishedVersionId: form.publishedVersionId,
      };
    });
  }

  // ─── Public lookup ───────────────────────────────────────────────────────

  public async getByPublicSlug(
    payload: GetByPublicSlugInputType,
  ): Promise<PublicFormDetailType | null> {
    const { userSlug, formSlug } =
      await getByPublicSlugInput.parseAsync(payload);

    const [row] = await db
      .select({
        id: formTable.id,
        title: formTable.title,
        description: formTable.description,
        status: formTable.status,
        publishedVersionId: formTable.publishedVersionId,
        isDeleted: formTable.isDeleted,
      })
      .from(formTable)
      .innerJoin(usersTable, eq(usersTable.id, formTable.createdBy))
      .where(
        and(
          eq(usersTable.userGlobalFormSlug, userSlug),
          eq(formTable.slug, formSlug),
        ),
      )
      .limit(1);

    if (!row) return null;
    if (row.isDeleted) return null;
    if (row.status !== "published" && row.status !== "closed") return null;
    if (!row.publishedVersionId) return null;

    const [version] = await db
      .select({
        id: formVersionsTable.id,
        version: formVersionsTable.version,
        schema: formVersionsTable.schema,
      })
      .from(formVersionsTable)
      .where(eq(formVersionsTable.id, row.publishedVersionId))
      .limit(1);

    if (!version) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description ?? null,
      status: row.status as "published" | "closed",
      publishedVersion: {
        id: version.id,
        version: version.version,
        schema: version.schema,
      },
    };
  }

  public async duplicate(
    payload: DuplicateFormInputType,
  ): Promise<DuplicateFormOutputType> {
    const { id, requestedBy } =
      await duplicateFormInput.parseAsync(payload);

    return await db.transaction(async (tx) => {
      const [sourceForm] = await tx
        .select()
        .from(formTable)
        .where(eq(formTable.id, id));

      if (!sourceForm || sourceForm.isDeleted) {
        throw new Error("Form not found");
      }
      if (sourceForm.createdBy !== requestedBy) {
        throw new Error("Forbidden");
      }

      const [sourceLatest] = await tx
        .select({ schema: formVersionsTable.schema })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, id))
        .orderBy(desc(formVersionsTable.version))
        .limit(1);

      if (!sourceLatest) {
        throw new Error("Internal: source form has no versions");
      }

      const newTitle = `Copy of ${sourceForm.title}`.slice(0, 55);
      const newSlug = generateFormSlug(newTitle);

      const [newForm] = await tx
        .insert(formTable)
        .values({
          title: newTitle,
          description: sourceForm.description,
          slug: newSlug,
          status: "draft",
          createdBy: requestedBy,
        })
        .returning();

      if (!newForm) {
        throw new Error("Internal: failed to insert duplicate form");
      }

      await tx.insert(formVersionsTable).values({
        formId: newForm.id,
        version: 1,
        schema: sourceLatest.schema,
      });

      return {
        id: newForm.id,
        title: newForm.title,
        slug: newForm.slug,
        status: newForm.status,
      };
    });
  }
}

export default FormService;
