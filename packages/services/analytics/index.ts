import { db, desc, eq, sql } from "@repo/database";
import { formTable } from "@repo/database/models/form";
import { formVersionsTable } from "@repo/database/models/form-versions";
import { formSubmissionsTable } from "@repo/database/models/form-submissions";
import type { FormSchemaI } from "@repo/database/models/form-versions";

import {
  formAudienceInput,
  formFieldsInput,
  formKpisInput,
  formTrendInput,
  globalAudienceInput,
  globalKpisInput,
  globalTopFormsInput,
  type FormAudienceInputType,
  type FormAudienceOutputType,
  type FormFieldsInputType,
  type FormFieldsOutputType,
  type FormKpisInputType,
  type FormKpisOutputType,
  type FormTrendInputType,
  type FormTrendOutputType,
  type GlobalAudienceInputType,
  type GlobalAudienceOutputType,
  type GlobalKpisInputType,
  type GlobalKpisOutputType,
  type GlobalTopFormsInputType,
  type GlobalTopFormsOutputType,
} from "./model";
import { aggregateJsonbTopLevel } from "./jsonb-aggregate";
import { computeFieldDistributions } from "./field-distribution";

class AnalyticsService {
  // ─── per-form ────────────────────────────────────────────────────────

  public async formKpis(
    payload: FormKpisInputType,
  ): Promise<FormKpisOutputType> {
    const { formId, requestedBy } = await formKpisInput.parseAsync(payload);
    await this.assertFormOwnership({ formId, requestedBy });

    // Single SQL with subqueries. Filter the time-to-complete to genuine
    // start→complete sessions (started_at < submitted_at) to avoid skewing
    // from variant-B inserts where both timestamps = NOW().
    const rows = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM form_submissions
          WHERE form_id = ${formId}::uuid AND is_deleted = false
        ) AS starts,
        (SELECT COUNT(*)::int FROM form_submissions
          WHERE form_id = ${formId}::uuid
            AND is_deleted = false AND status = 'completed'
        ) AS completed,
        (SELECT PERCENTILE_CONT(0.5) WITHIN GROUP (
          ORDER BY EXTRACT(EPOCH FROM (submitted_at - started_at))
        )
          FROM form_submissions
          WHERE form_id = ${formId}::uuid
            AND is_deleted = false
            AND status = 'completed'
            AND submitted_at IS NOT NULL
            AND started_at < submitted_at
        ) AS median_secs,
        (SELECT AVG(EXTRACT(EPOCH FROM (submitted_at - started_at)))
          FROM form_submissions
          WHERE form_id = ${formId}::uuid
            AND is_deleted = false
            AND status = 'completed'
            AND submitted_at IS NOT NULL
            AND started_at < submitted_at
        ) AS mean_secs
    `);

    const r = (
      rows as unknown as {
        rows: {
          starts: number | string;
          completed: number | string;
          median_secs: number | string | null;
          mean_secs: number | string | null;
        }[];
      }
    ).rows[0];
    if (!r) throw new Error("Internal: kpis returned no rows");

    const totalStarts = Number(r.starts);
    const totalCompleted = Number(r.completed);
    const completionRate =
      totalStarts === 0 ? 0 : totalCompleted / totalStarts;

    return {
      totalStarts,
      totalCompleted,
      completionRate,
      medianTimeToCompleteSeconds:
        r.median_secs === null ? null : Number(r.median_secs),
      meanTimeToCompleteSeconds:
        r.mean_secs === null ? null : Number(r.mean_secs),
    };
  }

  public async formTrend(
    payload: FormTrendInputType,
  ): Promise<FormTrendOutputType> {
    const { formId, requestedBy, days } =
      await formTrendInput.parseAsync(payload);
    await this.assertFormOwnership({ formId, requestedBy });

    const rows = await db.execute(sql`
      WITH days AS (
        SELECT generate_series(
          (CURRENT_DATE - (${days}::int - 1) * INTERVAL '1 day')::date,
          CURRENT_DATE,
          INTERVAL '1 day'
        )::date AS date
      )
      SELECT
        TO_CHAR(days.date, 'YYYY-MM-DD') AS date,
        COALESCE(COUNT(fs.id), 0)::int AS count
      FROM days
      LEFT JOIN form_submissions fs
        ON DATE_TRUNC('day', fs.submitted_at)::date = days.date
        AND fs.form_id = ${formId}::uuid
        AND fs.status = 'completed'
        AND fs.is_deleted = false
      GROUP BY days.date
      ORDER BY days.date ASC
    `);

    return (
      rows as unknown as { rows: { date: string; count: number }[] }
    ).rows.map((r) => ({ date: r.date, count: Number(r.count) }));
  }

  public async formAudience(
    payload: FormAudienceInputType,
  ): Promise<FormAudienceOutputType> {
    const { formId, requestedBy } =
      await formAudienceInput.parseAsync(payload);
    await this.assertFormOwnership({ formId, requestedBy });

    return await this.audienceFor([formId]);
  }

  public async formFields(
    payload: FormFieldsInputType,
  ): Promise<FormFieldsOutputType> {
    const { formId, requestedBy } =
      await formFieldsInput.parseAsync(payload);
    const form = await this.assertFormOwnership({ formId, requestedBy });

    // Use published version (preferred); else null.
    if (!form.publishedVersionId) {
      return { versionId: null, versionNumber: null, fields: [] };
    }

    const [version] = await db
      .select({
        id: formVersionsTable.id,
        version: formVersionsTable.version,
        schema: formVersionsTable.schema,
      })
      .from(formVersionsTable)
      .where(eq(formVersionsTable.id, form.publishedVersionId))
      .limit(1);

    if (!version) {
      return { versionId: null, versionNumber: null, fields: [] };
    }

    const [completedRow] = (
      await db.execute(sql`
        SELECT COUNT(*)::int AS c FROM form_submissions
        WHERE form_id = ${formId}::uuid
          AND status = 'completed'
          AND is_deleted = false
      `) as unknown as { rows: { c: number }[] }
    ).rows;
    const totalCompleted = Number(completedRow?.c ?? 0);

    const fields = await computeFieldDistributions({
      formId,
      schema: version.schema as FormSchemaI,
      totalCompleted,
    });

    return {
      versionId: version.id,
      versionNumber: version.version,
      fields,
    };
  }

  // ─── global ──────────────────────────────────────────────────────────

  public async globalKpis(
    payload: GlobalKpisInputType,
  ): Promise<GlobalKpisOutputType> {
    const { requestedBy } = await globalKpisInput.parseAsync(payload);

    const rows = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM forms
          WHERE created_by = ${requestedBy}::uuid AND is_deleted = false
        ) AS total_forms,
        (SELECT COUNT(*)::int FROM forms
          WHERE created_by = ${requestedBy}::uuid
            AND is_deleted = false AND status = 'published'
        ) AS active_forms,
        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}::uuid
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.status = 'completed'
        ) AS total_submissions,
        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}::uuid
            AND f.is_deleted = false
            AND fs.is_deleted = false
        ) AS total_starts
    `);

    const r = (
      rows as unknown as {
        rows: {
          total_forms: number | string;
          active_forms: number | string;
          total_submissions: number | string;
          total_starts: number | string;
        }[];
      }
    ).rows[0];
    if (!r) throw new Error("Internal: globalKpis returned no rows");

    const totalSubmissionsAllTime = Number(r.total_submissions);
    const totalStarts = Number(r.total_starts);
    const avgCompletionRate =
      totalStarts === 0 ? 0 : totalSubmissionsAllTime / totalStarts;

    return {
      totalForms: Number(r.total_forms),
      activeForms: Number(r.active_forms),
      totalSubmissionsAllTime,
      avgCompletionRate,
    };
  }

  public async globalTopForms(
    payload: GlobalTopFormsInputType,
  ): Promise<GlobalTopFormsOutputType> {
    const { requestedBy, limit } =
      await globalTopFormsInput.parseAsync(payload);

    const rows = await db
      .select({
        id: formTable.id,
        title: formTable.title,
        slug: formTable.slug,
        status: formTable.status,
        submissionCount: sql<number>`COUNT(${formSubmissionsTable.id}) FILTER (
          WHERE ${formSubmissionsTable.status} = 'completed'
            AND ${formSubmissionsTable.isDeleted} = false
        )::int`,
      })
      .from(formTable)
      .leftJoin(
        formSubmissionsTable,
        eq(formSubmissionsTable.formId, formTable.id),
      )
      .where(
        sql`${formTable.createdBy} = ${requestedBy}::uuid AND ${formTable.isDeleted} = false`,
      )
      .groupBy(formTable.id)
      .orderBy(
        desc(sql`COUNT(${formSubmissionsTable.id}) FILTER (
          WHERE ${formSubmissionsTable.status} = 'completed'
            AND ${formSubmissionsTable.isDeleted} = false
        )`),
        desc(formTable.updatedAt),
      )
      .limit(limit);

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      submissionCount: Number(r.submissionCount ?? 0),
    }));
  }

  public async globalAudience(
    payload: GlobalAudienceInputType,
  ): Promise<GlobalAudienceOutputType> {
    const { requestedBy } = await globalAudienceInput.parseAsync(payload);

    // Resolve all user's form ids first
    const formIds = (
      await db
        .select({ id: formTable.id })
        .from(formTable)
        .where(
          sql`${formTable.createdBy} = ${requestedBy}::uuid AND ${formTable.isDeleted} = false`,
        )
    ).map((r) => r.id);

    return await this.audienceFor(formIds);
  }

  // ─── helpers ────────────────────────────────────────────────────────

  private async audienceFor(formIds: string[]): Promise<FormAudienceOutputType> {
    if (formIds.length === 0) {
      return {
        deviceType: [],
        browser: [],
        os: [],
        locale: [],
        utmSource: [],
        utmMedium: [],
        utmCampaign: [],
        hasUtmData: false,
      };
    }

    const [
      deviceType,
      browser,
      os,
      locale,
      utmSource,
      utmMedium,
      utmCampaign,
    ] = await Promise.all([
      aggregateJsonbTopLevel({ scopeFormIds: formIds, column: "meta", key: "deviceType" }),
      aggregateJsonbTopLevel({ scopeFormIds: formIds, column: "meta", key: "browser" }),
      aggregateJsonbTopLevel({ scopeFormIds: formIds, column: "meta", key: "os" }),
      aggregateJsonbTopLevel({ scopeFormIds: formIds, column: "meta", key: "locale" }),
      aggregateJsonbTopLevel({ scopeFormIds: formIds, column: "meta", key: "utmSource" }),
      aggregateJsonbTopLevel({ scopeFormIds: formIds, column: "meta", key: "utmMedium" }),
      aggregateJsonbTopLevel({ scopeFormIds: formIds, column: "meta", key: "utmCampaign" }),
    ]);

    const hasUtmData =
      utmSource.length > 0 || utmMedium.length > 0 || utmCampaign.length > 0;

    return {
      deviceType,
      browser,
      os,
      locale,
      utmSource,
      utmMedium,
      utmCampaign,
      hasUtmData,
    };
  }

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

export default AnalyticsService;
