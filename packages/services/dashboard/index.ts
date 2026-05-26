import { and, db, desc, eq, sql } from "@repo/database";
import { formTable } from "@repo/database/models/form";
import { formSubmissionsTable } from "@repo/database/models/form-submissions";

import {
  dashboardStatsInput,
  recentSubmissionsInput,
  submissionTrendInput,
  type DashboardStatsInputType,
  type DashboardStatsOutputType,
  type RecentSubmissionsInputType,
  type RecentSubmissionsOutputType,
  type SubmissionTrendInputType,
  type SubmissionTrendOutputType,
} from "./model";

/**
 * Safe delta calculation: returns null when previous is 0 (no baseline).
 * Returned as a fraction (0.12 = +12%).
 */
function safeDeltaPct(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

class DashboardService {
  /**
   * One-shot KPI snapshot. Single SQL with 8 scalar subqueries — fast and
   * keeps the wire payload small. Deltas compare current period to prior
   * period of the same length (30d for "totals", 7d for "weekly").
   */
  public async stats(
    payload: DashboardStatsInputType,
  ): Promise<DashboardStatsOutputType> {
    const { requestedBy } = await dashboardStatsInput.parseAsync(payload);

    const rows = await db.execute(sql`
      SELECT
        (SELECT COUNT(*)::int FROM forms
          WHERE created_by = ${requestedBy} AND is_deleted = false
        ) AS total_forms,

        (SELECT COUNT(*)::int FROM forms
          WHERE created_by = ${requestedBy}
            AND is_deleted = false
            AND created_at >= NOW() - INTERVAL '30 days'
        ) AS forms_current_30d,

        (SELECT COUNT(*)::int FROM forms
          WHERE created_by = ${requestedBy}
            AND is_deleted = false
            AND created_at >= NOW() - INTERVAL '60 days'
            AND created_at < NOW() - INTERVAL '30 days'
        ) AS forms_prior_30d,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.status = 'completed'
        ) AS total_submissions,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.status = 'completed'
            AND fs.submitted_at >= NOW() - INTERVAL '30 days'
        ) AS submissions_current_30d,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.status = 'completed'
            AND fs.submitted_at >= NOW() - INTERVAL '60 days'
            AND fs.submitted_at < NOW() - INTERVAL '30 days'
        ) AS submissions_prior_30d,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.status = 'completed'
            AND fs.submitted_at >= NOW() - INTERVAL '7 days'
        ) AS submissions_current_7d,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.status = 'completed'
            AND fs.submitted_at >= NOW() - INTERVAL '14 days'
            AND fs.submitted_at < NOW() - INTERVAL '7 days'
        ) AS submissions_prior_7d,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.started_at >= NOW() - INTERVAL '30 days'
        ) AS started_current_30d,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
            AND fs.started_at >= NOW() - INTERVAL '60 days'
            AND fs.started_at < NOW() - INTERVAL '30 days'
        ) AS started_prior_30d,

        (SELECT COUNT(*)::int FROM form_submissions fs
          INNER JOIN forms f ON f.id = fs.form_id
          WHERE f.created_by = ${requestedBy}
            AND f.is_deleted = false
            AND fs.is_deleted = false
        ) AS all_started_count
    `);

    const r = (rows as unknown as { rows: Record<string, number>[] }).rows[0];
    if (!r) {
      throw new Error("Internal: stats query returned no rows");
    }

    const totalForms = Number(r.total_forms);
    const formsCurrent30d = Number(r.forms_current_30d);
    const formsPrior30d = Number(r.forms_prior_30d);

    const totalSubmissions = Number(r.total_submissions);
    const submissionsCurrent30d = Number(r.submissions_current_30d);
    const submissionsPrior30d = Number(r.submissions_prior_30d);

    const submissionsCurrent7d = Number(r.submissions_current_7d);
    const submissionsPrior7d = Number(r.submissions_prior_7d);

    const startedCurrent30d = Number(r.started_current_30d);
    const startedPrior30d = Number(r.started_prior_30d);
    const allStartedCount = Number(r.all_started_count);

    // All-time completion rate (completed / started+completed across all time)
    const completionRate =
      allStartedCount === 0 ? 0 : totalSubmissions / allStartedCount;

    // Period-window completion rates for the delta
    const completionRateCurrent =
      startedCurrent30d === 0
        ? 0
        : submissionsCurrent30d / startedCurrent30d;
    const completionRatePrior =
      startedPrior30d === 0 ? 0 : submissionsPrior30d / startedPrior30d;

    return {
      totalForms,
      totalFormsDeltaPct: safeDeltaPct(formsCurrent30d, formsPrior30d),
      totalSubmissions,
      totalSubmissionsDeltaPct: safeDeltaPct(
        submissionsCurrent30d,
        submissionsPrior30d,
      ),
      completionRate,
      completionRateDeltaPct: safeDeltaPct(
        completionRateCurrent,
        completionRatePrior,
      ),
      weeklySubmissions: submissionsCurrent7d,
      weeklySubmissionsDeltaPct: safeDeltaPct(
        submissionsCurrent7d,
        submissionsPrior7d,
      ),
    };
  }

  /**
   * Time series of completed submissions per day. Always returns days+1
   * items, zero-filled, oldest first.
   */
  public async submissionTrend(
    payload: SubmissionTrendInputType,
  ): Promise<SubmissionTrendOutputType> {
    const { requestedBy, days } = await submissionTrendInput.parseAsync(payload);

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
        AND fs.status = 'completed'
        AND fs.is_deleted = false
        AND fs.form_id IN (
          SELECT id FROM forms
          WHERE created_by = ${requestedBy} AND is_deleted = false
        )
      GROUP BY days.date
      ORDER BY days.date ASC
    `);

    const result = (rows as unknown as {
      rows: Array<{ date: string; count: number }>;
    }).rows;

    return result.map((r) => ({
      date: r.date,
      count: Number(r.count),
    }));
  }

  /**
   * Most-recent N completed submissions across the user's forms.
   */
  public async recentSubmissions(
    payload: RecentSubmissionsInputType,
  ): Promise<RecentSubmissionsOutputType> {
    const { requestedBy, limit } =
      await recentSubmissionsInput.parseAsync(payload);

    const rows = await db
      .select({
        id: formSubmissionsTable.id,
        formId: formSubmissionsTable.formId,
        formTitle: formTable.title,
        formSlug: formTable.slug,
        submittedAt: formSubmissionsTable.submittedAt,
      })
      .from(formSubmissionsTable)
      .innerJoin(
        formTable,
        eq(formTable.id, formSubmissionsTable.formId),
      )
      .where(
        and(
          eq(formTable.createdBy, requestedBy),
          eq(formTable.isDeleted, false),
          eq(formSubmissionsTable.isDeleted, false),
          eq(formSubmissionsTable.status, "completed"),
        ),
      )
      .orderBy(desc(formSubmissionsTable.submittedAt))
      .limit(limit);

    return rows
      .filter((r) => r.submittedAt !== null)
      .map((r) => ({
        id: r.id,
        formId: r.formId,
        formTitle: r.formTitle,
        formSlug: r.formSlug,
        submittedAt: r.submittedAt as Date,
      }));
  }
}

export default DashboardService;
