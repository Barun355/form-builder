import {
  and,
  count,
  db,
  desc,
  eq,
  gte,
  lte,
  sql,
} from "@repo/database";
import { formTable } from "@repo/database/models/form";
import { formVersionsTable } from "@repo/database/models/form-versions";
import {
  formSubmissionsTable,
  type FormSubmissionMetaI,
} from "@repo/database/models/form-submissions";
import type { Writable } from "node:stream";
import { stringify as csvStringify } from "csv-stringify";
import { randomUUID } from "node:crypto";
import { logger } from "@repo/logger";
import { getClientIp } from "../rate-limit";

import {
  completeSubmissionInput,
  exportSubmissionsInput,
  getSubmissionInput,
  listSubmissionsInput,
  startSubmissionInput,
  type CompleteSubmissionInputType,
  type CompleteSubmissionOutputType,
  type ExportSubmissionsInputType,
  type GetSubmissionInputType,
  type GetSubmissionOutputType,
  type ListSubmissionsInputType,
  type ListSubmissionsOutputType,
  type StartSubmissionInputType,
  type StartSubmissionOutputType,
} from "./model";
import { extractMeta, type MinimalRequest } from "./meta";
import { validateDataShape } from "./validate";
import { decodeCursor, encodeCursor } from "./cursor";

// Drizzle transaction type doesn't unify with the root db type cleanly.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Conn = any;

class FormSubmissionsService {
  // ─── start ─────────────────────────────────────────────────────────────

  public async start(
    payload: StartSubmissionInputType,
    req?: MinimalRequest,
  ): Promise<StartSubmissionOutputType> {
    const { versionId, meta, honeypot } =
      await startSubmissionInput.parseAsync(payload);

    if (honeypot && honeypot.trim() !== "") {
      logger.warn("honeypot_trip", {
        event: "honeypot_trip",
        stage: "start",
        ip: getClientIp(req),
        versionId,
      });
      return { id: randomUUID() };
    }

    const [row] = await db
      .select({
        version: formVersionsTable,
        form: formTable,
      })
      .from(formVersionsTable)
      .innerJoin(formTable, eq(formTable.id, formVersionsTable.formId))
      .where(eq(formVersionsTable.id, versionId))
      .limit(1);

    if (!row || row.form.isDeleted) {
      throw new Error("Form is not accepting submissions");
    }
    if (row.form.status !== "published") {
      throw new Error("Form is not accepting submissions");
    }
    if (row.form.publishedVersionId !== row.version.id) {
      throw new Error("Form is not accepting submissions");
    }

    const merged = extractMeta(req, meta);

    const inserted = await db
      .insert(formSubmissionsTable)
      .values({
        formId: row.form.id,
        formVersionId: row.version.id,
        status: "started",
        data: {},
        meta: merged as FormSubmissionMetaI,
      })
      .returning({ id: formSubmissionsTable.id });

    const id = inserted[0]?.id;
    if (!id) throw new Error("Internal: failed to create submission");
    return { id };
  }

  // ─── complete ──────────────────────────────────────────────────────────

  public async complete(
    payload: CompleteSubmissionInputType,
    req?: MinimalRequest,
  ): Promise<CompleteSubmissionOutputType> {
    const parsed = await completeSubmissionInput.parseAsync(payload);
    const { submissionId, versionId, data, meta, honeypot } = parsed;

    if (honeypot && honeypot.trim() !== "") {
      logger.warn("honeypot_trip", {
        event: "honeypot_trip",
        stage: "complete",
        ip: getClientIp(req),
        submissionId: submissionId ?? null,
        versionId: versionId ?? null,
      });
      // Spam path: delete the started row if one exists so the DB stays clean.
      if (submissionId) {
        await db
          .delete(formSubmissionsTable)
          .where(eq(formSubmissionsTable.id, submissionId));
      }
      return { id: randomUUID(), submittedAt: new Date() };
    }

    return await db.transaction(async (tx: Conn) => {
      // Upgrade path: submissionId provided AND the row exists in 'started'.
      // If the row is missing (stale id, server reset, etc.) we fall through
      // to the INSERT path below — guarantees exactly one row per session.
      if (submissionId) {
        const [row] = await tx
          .select({
            submission: formSubmissionsTable,
            form: formTable,
            version: formVersionsTable,
          })
          .from(formSubmissionsTable)
          .innerJoin(
            formTable,
            eq(formTable.id, formSubmissionsTable.formId),
          )
          .innerJoin(
            formVersionsTable,
            eq(formVersionsTable.id, formSubmissionsTable.formVersionId),
          )
          .where(eq(formSubmissionsTable.id, submissionId))
          .limit(1);

        if (row && !row.form.isDeleted) {
          if (row.form.status !== "published") {
            throw new Error("Form no longer accepts submissions");
          }
          if (row.submission.status !== "started") {
            throw new Error("Already submitted");
          }

          validateDataShape(
            data,
            row.version.schema as Parameters<typeof validateDataShape>[1],
          );

          const submittedAt = new Date();
          await tx
            .update(formSubmissionsTable)
            .set({
              status: "completed",
              data,
              submittedAt,
            })
            .where(eq(formSubmissionsTable.id, submissionId));

          return { id: row.submission.id, submittedAt };
        }
        // Row not found — fall through to INSERT using versionId.
      }

      if (!versionId) {
        throw new Error("versionId is required when no started row exists");
      }

      const [vrow] = await tx
        .select({
          version: formVersionsTable,
          form: formTable,
        })
        .from(formVersionsTable)
        .innerJoin(formTable, eq(formTable.id, formVersionsTable.formId))
        .where(eq(formVersionsTable.id, versionId))
        .limit(1);

      if (!vrow || vrow.form.isDeleted) {
        throw new Error("Form is not accepting submissions");
      }
      if (vrow.form.status !== "published") {
        throw new Error("Form is not accepting submissions");
      }
      if (vrow.form.publishedVersionId !== vrow.version.id) {
        throw new Error("Form is not accepting submissions");
      }

      validateDataShape(
        data,
        vrow.version.schema as Parameters<typeof validateDataShape>[1],
      );

      const merged = extractMeta(req, meta);
      const now = new Date();
      const inserted = await tx
        .insert(formSubmissionsTable)
        .values({
          formId: vrow.form.id,
          formVersionId: vrow.version.id,
          status: "completed",
          data,
          meta: merged as FormSubmissionMetaI,
          startedAt: now,
          submittedAt: now,
        })
        .returning({ id: formSubmissionsTable.id });

      const id = inserted[0]?.id;
      if (!id) throw new Error("Internal: failed to insert submission");
      return { id, submittedAt: now };
    });
  }

  // ─── list ──────────────────────────────────────────────────────────────

  public async list(
    payload: ListSubmissionsInputType,
  ): Promise<ListSubmissionsOutputType> {
    const {
      formId,
      requestedBy,
      status,
      dateFrom,
      dateTo,
      search,
      limit,
      cursor,
    } = await listSubmissionsInput.parseAsync(payload);

    await this.assertFormOwnership({ formId, requestedBy });

    const cursorPart = cursor ? decodeCursor(cursor) : null;

    const where = and(
      eq(formSubmissionsTable.formId, formId),
      eq(formSubmissionsTable.isDeleted, false),
      status ? eq(formSubmissionsTable.status, status) : undefined,
      dateFrom ? gte(formSubmissionsTable.startedAt, dateFrom) : undefined,
      dateTo ? lte(formSubmissionsTable.startedAt, dateTo) : undefined,
      search
        ? sql`${formSubmissionsTable.data}::text ILIKE ${`%${search}%`}`
        : undefined,
      cursorPart
        ? sql`(COALESCE(${formSubmissionsTable.submittedAt}, ${formSubmissionsTable.startedAt}), ${formSubmissionsTable.id}) < (${new Date(cursorPart.ts)}, ${cursorPart.id})`
        : undefined,
    );

    const rows = await db
      .select()
      .from(formSubmissionsTable)
      .where(where)
      .orderBy(
        sql`COALESCE(${formSubmissionsTable.submittedAt}, ${formSubmissionsTable.startedAt}) DESC NULLS LAST`,
        desc(formSubmissionsTable.id),
      )
      .limit(limit + 1);

    const [totalRow] = await db
      .select({ totalCount: count() })
      .from(formSubmissionsTable)
      .where(where);

    let items = rows;
    let nextCursor: string | undefined;
    if (rows.length > limit) {
      items = rows.slice(0, limit);
      const last = items[items.length - 1]!;
      nextCursor = encodeCursor(last.submittedAt, last.startedAt, last.id);
    }

    return {
      items: items.map((r) => ({
        id: r.id,
        formId: r.formId,
        formVersionId: r.formVersionId,
        status: r.status,
        startedAt: r.startedAt,
        submittedAt: r.submittedAt ?? null,
        data: r.data,
        meta: r.meta ?? null,
      })),
      nextCursor,
      totalCount: Number(totalRow?.totalCount ?? 0),
    };
  }

  // ─── getById ───────────────────────────────────────────────────────────

  public async getById(
    payload: GetSubmissionInputType,
  ): Promise<GetSubmissionOutputType> {
    const { id, requestedBy } = await getSubmissionInput.parseAsync(payload);

    const [row] = await db
      .select({
        submission: formSubmissionsTable,
        form: formTable,
        version: formVersionsTable,
      })
      .from(formSubmissionsTable)
      .innerJoin(formTable, eq(formTable.id, formSubmissionsTable.formId))
      .innerJoin(
        formVersionsTable,
        eq(formVersionsTable.id, formSubmissionsTable.formVersionId),
      )
      .where(eq(formSubmissionsTable.id, id))
      .limit(1);

    if (!row || row.form.isDeleted) {
      throw new Error("Submission not found");
    }
    if (row.form.createdBy !== requestedBy) {
      throw new Error("Forbidden");
    }

    return {
      id: row.submission.id,
      formId: row.submission.formId,
      formVersionId: row.submission.formVersionId,
      status: row.submission.status,
      startedAt: row.submission.startedAt,
      submittedAt: row.submission.submittedAt ?? null,
      data: row.submission.data,
      meta: row.submission.meta ?? null,
      version: {
        id: row.version.id,
        version: row.version.version,
        schema: row.version.schema,
      },
    };
  }

  // ─── exportToWritable (REST CSV) ──────────────────────────────────────

  public async exportToWritable(
    payload: ExportSubmissionsInputType,
    stream: Writable,
  ): Promise<void> {
    const { formId, requestedBy, status, dateFrom, dateTo } =
      await exportSubmissionsInput.parseAsync(payload);

    const form = await this.assertFormOwnership({ formId, requestedBy });

    const versionRows = await db
      .selectDistinct({ versionId: formSubmissionsTable.formVersionId })
      .from(formSubmissionsTable)
      .where(
        and(
          eq(formSubmissionsTable.formId, formId),
          eq(formSubmissionsTable.isDeleted, false),
          status ? eq(formSubmissionsTable.status, status) : undefined,
          dateFrom
            ? gte(formSubmissionsTable.startedAt, dateFrom)
            : undefined,
          dateTo ? lte(formSubmissionsTable.startedAt, dateTo) : undefined,
        ),
      );

    const versionIds = versionRows.map((v) => v.versionId);

    const columns: { id: string; label: string }[] = [];
    const seen = new Set<string>();

    if (form.publishedVersionId) {
      const [pub] = await db
        .select({ schema: formVersionsTable.schema })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.id, form.publishedVersionId))
        .limit(1);
      if (pub) {
        const schema = pub.schema as {
          fields?: Array<{ id: string; label: string; order: number }>;
        };
        const sorted = (schema.fields ?? [])
          .slice()
          .sort((a, b) => a.order - b.order);
        for (const f of sorted) {
          if (!seen.has(f.id)) {
            columns.push({ id: f.id, label: f.label || f.id });
            seen.add(f.id);
          }
        }
      }
    }

    for (const vid of versionIds) {
      const [vrow] = await db
        .select({ schema: formVersionsTable.schema })
        .from(formVersionsTable)
        .where(eq(formVersionsTable.id, vid))
        .limit(1);
      if (!vrow) continue;
      const schema = vrow.schema as {
        fields?: Array<{ id: string; label: string }>;
      };
      for (const f of schema.fields ?? []) {
        if (!seen.has(f.id)) {
          columns.push({ id: f.id, label: f.label || f.id });
          seen.add(f.id);
        }
      }
    }

    const stringifier = csvStringify({
      header: true,
      columns: [
        { key: "id", header: "id" },
        { key: "started_at", header: "started_at" },
        { key: "submitted_at", header: "submitted_at" },
        { key: "status", header: "status" },
        ...columns.map((c) => ({ key: c.id, header: c.label })),
      ],
    });
    stringifier.pipe(stream);

    const CHUNK = 500;
    let lastCursor: { ts: string; id: string } | null = null;
    while (true) {
      const where = and(
        eq(formSubmissionsTable.formId, formId),
        eq(formSubmissionsTable.isDeleted, false),
        status ? eq(formSubmissionsTable.status, status) : undefined,
        dateFrom ? gte(formSubmissionsTable.startedAt, dateFrom) : undefined,
        dateTo ? lte(formSubmissionsTable.startedAt, dateTo) : undefined,
        lastCursor
          ? sql`(COALESCE(${formSubmissionsTable.submittedAt}, ${formSubmissionsTable.startedAt}), ${formSubmissionsTable.id}) < (${new Date(lastCursor.ts)}, ${lastCursor.id})`
          : undefined,
      );
      const chunk = await db
        .select({
          id: formSubmissionsTable.id,
          startedAt: formSubmissionsTable.startedAt,
          submittedAt: formSubmissionsTable.submittedAt,
          status: formSubmissionsTable.status,
          data: formSubmissionsTable.data,
        })
        .from(formSubmissionsTable)
        .where(where)
        .orderBy(
          sql`COALESCE(${formSubmissionsTable.submittedAt}, ${formSubmissionsTable.startedAt}) DESC NULLS LAST`,
          desc(formSubmissionsTable.id),
        )
        .limit(CHUNK);

      if (chunk.length === 0) break;

      for (const row of chunk) {
        const out: Record<string, unknown> = {
          id: row.id,
          started_at: row.startedAt.toISOString(),
          submitted_at: row.submittedAt ? row.submittedAt.toISOString() : "",
          status: row.status,
        };
        for (const col of columns) {
          const v = (row.data as Record<string, unknown>)?.[col.id];
          if (v == null) out[col.id] = "";
          else if (Array.isArray(v)) out[col.id] = v.join(", ");
          else if (typeof v === "object") out[col.id] = JSON.stringify(v);
          else out[col.id] = String(v);
        }
        stringifier.write(out);
      }

      if (chunk.length < CHUNK) break;
      const last = chunk[chunk.length - 1]!;
      lastCursor = {
        ts: (last.submittedAt ?? last.startedAt).toISOString(),
        id: last.id,
      };
    }

    stringifier.end();
  }

  // ─── helpers ───────────────────────────────────────────────────────────

  private async assertFormOwnership({
    formId,
    requestedBy,
  }: {
    formId: string;
    requestedBy: string;
  }) {
    const [form] = await db
      .select()
      .from(formTable)
      .where(eq(formTable.id, formId));
    if (!form || form.isDeleted) throw new Error("Form not found");
    if (form.createdBy !== requestedBy) throw new Error("Forbidden");
    return form;
  }
}

export default FormSubmissionsService;
