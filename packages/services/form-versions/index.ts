import { and, count, db, desc, eq } from "@repo/database";
import { formTable } from "@repo/database/models/form";
import { formVersionsTable } from "@repo/database/models/form-versions";
import { formSubmissionsTable } from "@repo/database/models/form-submissions";

import {
  deleteVersionInput,
  getVersionInput,
  listVersionsInput,
  revertToVersionInput,
  saveDraftInput,
  type DeleteVersionInputType,
  type DeleteVersionOutputType,
  type GetVersionInputType,
  type GetVersionOutputType,
  type ListVersionsInputType,
  type ListVersionsOutputType,
  type RevertToVersionInputType,
  type RevertToVersionOutputType,
  type SaveDraftInputType,
  type SaveDraftOutputType,
} from "./model";


// Drizzle's transaction type and root db type don't unify cleanly across the
// pg-core / node-postgres boundary. The helpers below accept either via a
// loosely-typed `conn` parameter — the underlying query surface (`.select`,
// `.from`, `.where`) is identical on both.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Conn = any;

class FormVersionService {
  /** Counts submissions linked to a specific version (any status). */
  private async countSubmissions(
    versionId: string,
    conn: Conn = db,
  ): Promise<number> {
    const [row] = await conn
      .select({ cnt: count() })
      .from(formSubmissionsTable)
      .where(eq(formSubmissionsTable.formVersionId, versionId));
    return Number(row?.cnt ?? 0);
  }

  /** Counts total versions for a form. */
  private async countVersions(
    formId: string,
    conn: Conn = db,
  ): Promise<number> {
    const [row] = await conn
      .select({ cnt: count() })
      .from(formVersionsTable)
      .where(eq(formVersionsTable.formId, formId));
    return Number(row?.cnt ?? 0);
  }

  // ─── Save draft ────────────────────────────────────────────────────────

  public async saveDraft(
    payload: SaveDraftInputType,
  ): Promise<SaveDraftOutputType> {
    const { formId, schema, requestedBy } =
      await saveDraftInput.parseAsync(payload);

    // Theme is on the form (not on the version), so saveDraft has nothing
    // to do with themes anymore. Schema changes only.

    return await db.transaction(async (tx) => {
      const [form] = await tx
        .select()
        .from(formTable)
        .where(eq(formTable.id, formId));

      if (!form || form.isDeleted) throw new Error("Form not found");
      if (form.createdBy !== requestedBy) throw new Error("Forbidden");
      if (form.status !== "draft" && form.status !== "published") {
        throw new Error(`Cannot edit form in status '${form.status}'`);
      }

      const [latest] = await tx
        .select()
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, formId))
        .orderBy(desc(formVersionsTable.version))
        .limit(1);

      if (!latest) throw new Error("Internal: form has no versions");

      let saved;
      if (latest.id === form.publishedVersionId) {
        // Frozen — insert new draft v(n+1).
        const inserted = await tx
          .insert(formVersionsTable)
          .values({
            formId,
            version: latest.version + 1,
            schema,
          })
          .returning();
        saved = inserted[0];
      } else {
        // Mutable draft — update in place.
        const updated = await tx
          .update(formVersionsTable)
          .set({ schema })
          .where(eq(formVersionsTable.id, latest.id))
          .returning();
        saved = updated[0];
      }

      if (!saved) throw new Error("Internal: failed to save draft");

      // saveDraft never targets a published version
      const submissionCount = await this.countSubmissions(saved.id, tx);

      return {
        id: saved.id,
        formId: saved.formId,
        version: saved.version,
        schema: saved.schema,
        isPublished: false,
        submissionCount,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
      };
    });
  }

  // ─── List ──────────────────────────────────────────────────────────────

  public async list(
    payload: ListVersionsInputType,
  ): Promise<ListVersionsOutputType> {
    const { formId, requestedBy, limit, offset } =
      await listVersionsInput.parseAsync(payload);

    // Ownership check
    const [form] = await db
      .select()
      .from(formTable)
      .where(eq(formTable.id, formId));

    if (!form || form.isDeleted) throw new Error("Form not found");
    if (form.createdBy !== requestedBy) throw new Error("Forbidden");

    const publishedId = form.publishedVersionId;

    // Subquery: submission count per version
    const submissionCountSq = db
      .select({
        versionId: formSubmissionsTable.formVersionId,
        cnt: count().as("cnt"),
      })
      .from(formSubmissionsTable)
      .groupBy(formSubmissionsTable.formVersionId)
      .as("submission_counts");

    const rows = await db
      .select({
        id: formVersionsTable.id,
        formId: formVersionsTable.formId,
        version: formVersionsTable.version,
        createdAt: formVersionsTable.createdAt,
        updatedAt: formVersionsTable.updatedAt,
        submissionCount: submissionCountSq.cnt,
      })
      .from(formVersionsTable)
      .leftJoin(
        submissionCountSq,
        eq(submissionCountSq.versionId, formVersionsTable.id),
      )
      .where(eq(formVersionsTable.formId, formId))
      .orderBy(desc(formVersionsTable.version))
      .limit(limit)
      .offset(offset);

    const [totalRow] = await db
      .select({ cnt: count() })
      .from(formVersionsTable)
      .where(eq(formVersionsTable.formId, formId));

    return {
      items: rows.map((r) => ({
        id: r.id,
        formId: r.formId,
        version: r.version,
        isPublished: publishedId !== null && r.id === publishedId,
        submissionCount: Number(r.submissionCount ?? 0),
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
      totalCount: Number(totalRow?.cnt ?? 0),
    };
  }

  // ─── Get by id ─────────────────────────────────────────────────────────

  public async getById(
    payload: GetVersionInputType,
  ): Promise<GetVersionOutputType> {
    const { id, requestedBy } = await getVersionInput.parseAsync(payload);

    const [row] = await db
      .select({
        version: formVersionsTable,
        form: formTable,
      })
      .from(formVersionsTable)
      .innerJoin(formTable, eq(formTable.id, formVersionsTable.formId))
      .where(eq(formVersionsTable.id, id))
      .limit(1);

    if (!row || row.form.isDeleted) throw new Error("Form version not found");
    if (row.form.createdBy !== requestedBy) throw new Error("Forbidden");

    const submissionCount = await this.countSubmissions(id);

    return {
      id: row.version.id,
      formId: row.version.formId,
      version: row.version.version,
      schema: row.version.schema,
      isPublished:
        row.form.publishedVersionId !== null &&
        row.version.id === row.form.publishedVersionId,
      submissionCount,
      createdAt: row.version.createdAt,
      updatedAt: row.version.updatedAt,
    };
  }

  // ─── Revert ────────────────────────────────────────────────────────────

  public async revert(
    payload: RevertToVersionInputType,
  ): Promise<RevertToVersionOutputType> {
    const { id, requestedBy } = await revertToVersionInput.parseAsync(payload);

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          version: formVersionsTable,
          form: formTable,
        })
        .from(formVersionsTable)
        .innerJoin(formTable, eq(formTable.id, formVersionsTable.formId))
        .where(eq(formVersionsTable.id, id))
        .limit(1);

      if (!row || row.form.isDeleted) throw new Error("Form version not found");
      if (row.form.createdBy !== requestedBy) throw new Error("Forbidden");
      if (row.form.status !== "draft" && row.form.status !== "published") {
        throw new Error(
          `Cannot revert form in status '${row.form.status}'`,
        );
      }

      const target = row.version;
      const form = row.form;

      const [latest] = await tx
        .select()
        .from(formVersionsTable)
        .where(eq(formVersionsTable.formId, form.id))
        .orderBy(desc(formVersionsTable.version))
        .limit(1);

      if (!latest) throw new Error("Internal: form has no versions");

      let result;
      if (latest.id === form.publishedVersionId) {
        // No editable draft → insert new v(n+1) with target's schema.
        // Theme is not part of revert (it's on the form, not the
        // version). Reverting schema doesn't touch the active theme.
        const inserted = await tx
          .insert(formVersionsTable)
          .values({
            formId: form.id,
            version: latest.version + 1,
            schema: target.schema,
          })
          .returning();
        result = inserted[0];
      } else {
        // Existing draft → overwrite schema with target's.
        const updated = await tx
          .update(formVersionsTable)
          .set({ schema: target.schema })
          .where(eq(formVersionsTable.id, latest.id))
          .returning();
        result = updated[0];
      }

      if (!result) throw new Error("Internal: failed to revert");

      const submissionCount = await this.countSubmissions(result.id, tx);

      return {
        id: result.id,
        formId: result.formId,
        version: result.version,
        schema: result.schema,
        isPublished: false,
        submissionCount,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt,
      };
    });
  }

  // ─── Delete ────────────────────────────────────────────────────────────

  public async deleteVersion(
    payload: DeleteVersionInputType,
  ): Promise<DeleteVersionOutputType> {
    const { id, requestedBy } = await deleteVersionInput.parseAsync(payload);

    return await db.transaction(async (tx) => {
      const [row] = await tx
        .select({
          version: formVersionsTable,
          form: formTable,
        })
        .from(formVersionsTable)
        .innerJoin(formTable, eq(formTable.id, formVersionsTable.formId))
        .where(eq(formVersionsTable.id, id))
        .limit(1);

      if (!row || row.form.isDeleted) throw new Error("Form version not found");
      if (row.form.createdBy !== requestedBy) throw new Error("Forbidden");

      // Rule 1: cannot delete the published version
      if (row.form.publishedVersionId === id) {
        throw new Error("Cannot delete the currently published version");
      }

      // Rule 2: cannot delete if it would leave the form with zero versions
      const totalVersions = await this.countVersions(row.form.id, tx);
      if (totalVersions <= 1) {
        throw new Error(
          "Cannot delete the only version of a form",
        );
      }

      // Rule 3: cannot delete if submissions reference this version
      const submissionCount = await this.countSubmissions(id, tx);
      if (submissionCount > 0) {
        throw new Error(
          "Cannot delete a version that has submissions linked to it",
        );
      }

      await tx
        .delete(formVersionsTable)
        .where(eq(formVersionsTable.id, id));

      return { id, deleted: true as const };
    });
  }
}

export default FormVersionService;
