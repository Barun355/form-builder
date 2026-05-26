import { and, count, db, eq, gte, sql } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import { formTable } from "@repo/database/models/form";
import { formSubmissionsTable } from "@repo/database/models/form-submissions";

import { PLANS, type Plan } from "./plans";

/**
 * Owner-side visibility settings derived from the user's plan and their
 * current month's submission volume.
 *
 * Returned by getOwnerVisibility — feeds into every dashboard/analytics/
 * submission read path so a Free user past their cap sees the latest N
 * submissions of the current calendar month, plus all past months.
 */
export interface OwnerVisibility {
  plan: Plan;
  /** Per-month cap (Infinity for Pro/Business) */
  cap: number;
  /** Total completed submissions in the current month across user's forms */
  monthlyTotal: number;
  /** monthlyTotal - cap, clamped at 0. 0 = under cap, > 0 = banner */
  lockedCount: number;
  /** True iff monthlyTotal > cap */
  capped: boolean;
  /**
   * Submissions with `submittedAt >= cutoffAt` from the current month are
   * visible; older ones from this month are gated. Past months always visible.
   * `null` means no filter needed (Pro/Business or under-cap Free).
   */
  cutoffAt: Date | null;
  /** Start of the current calendar month (UTC). */
  startOfMonth: Date;
}

/**
 * Look up the user's plan once. Used by route guards and visibility checks.
 * Throws if user doesn't exist — caller should already have authenticated.
 */
export async function getUserPlan(userId: string): Promise<Plan> {
  const [row] = await db
    .select({ plan: usersTable.plan })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);
  if (!row) throw new Error(`User ${userId} not found`);
  return row.plan as Plan;
}

/**
 * Count of non-deleted forms owned by this user. Used by form-creation
 * cap check.
 */
export async function getOwnedFormCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(formTable)
    .where(
      and(eq(formTable.createdBy, userId), eq(formTable.isDeleted, false)),
    );
  return Number(row?.c ?? 0);
}

function startOfMonthUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

/**
 * Compute owner-side visibility. Short-circuits to "no filter" for
 * paid plans without touching form_submissions at all.
 */
export async function getOwnerVisibility(
  userId: string,
): Promise<OwnerVisibility> {
  const plan = await getUserPlan(userId);
  const cap = PLANS[plan].monthlySubmissionsVisible;
  const startOfMonth = startOfMonthUtc();

  if (!Number.isFinite(cap)) {
    return {
      plan,
      cap,
      monthlyTotal: 0,
      lockedCount: 0,
      capped: false,
      cutoffAt: null,
      startOfMonth,
    };
  }

  // Count this month's completed submissions across all user's non-deleted
  // forms. JOIN on forms.created_by ensures we only count owner's data.
  const [totalRow] = await db
    .select({ c: count() })
    .from(formSubmissionsTable)
    .innerJoin(formTable, eq(formTable.id, formSubmissionsTable.formId))
    .where(
      and(
        eq(formTable.createdBy, userId),
        eq(formTable.isDeleted, false),
        eq(formSubmissionsTable.status, "completed"),
        eq(formSubmissionsTable.isDeleted, false),
        gte(formSubmissionsTable.submittedAt, startOfMonth),
      ),
    );
  const monthlyTotal = Number(totalRow?.c ?? 0);

  if (monthlyTotal <= cap) {
    return {
      plan,
      cap,
      monthlyTotal,
      lockedCount: 0,
      capped: false,
      cutoffAt: null,
      startOfMonth,
    };
  }

  // User over cap — find the cap-th most-recent submission's submittedAt.
  // OFFSET (cap - 1) LIMIT 1 returns the Nth row from the top of the sorted set.
  const cutoffRows = (await db.execute(sql`
    SELECT submitted_at
    FROM form_submissions
    INNER JOIN forms ON forms.id = form_submissions.form_id
    WHERE forms.created_by = ${userId}::uuid
      AND forms.is_deleted = false
      AND form_submissions.status = 'completed'
      AND form_submissions.is_deleted = false
      AND form_submissions.submitted_at >= ${startOfMonth.toISOString()}
    ORDER BY form_submissions.submitted_at DESC
    OFFSET ${cap - 1} LIMIT 1
  `)) as unknown as { rows: { submitted_at: string | Date }[] };

  const cutoffRaw = cutoffRows.rows[0]?.submitted_at;
  const cutoffAt = cutoffRaw ? new Date(cutoffRaw) : null;

  return {
    plan,
    cap,
    monthlyTotal,
    lockedCount: monthlyTotal - cap,
    capped: true,
    cutoffAt,
    startOfMonth,
  };
}

/**
 * SQL fragment to filter form_submissions to only the rows visible to the
 * owner. Past-month submissions are always visible; current month gated to
 * the latest N. Returns `TRUE` when no cap applies — caller can `AND` it
 * unconditionally into any WHERE clause.
 *
 * Caller must already have applied the formId/ownership filter — this
 * fragment ONLY adds the time-based visibility filter.
 */
export function visibilityFilter(vis: OwnerVisibility) {
  if (!vis.cutoffAt) return sql`TRUE`;
  return sql`(${formSubmissionsTable.submittedAt} < ${vis.startOfMonth} OR ${formSubmissionsTable.submittedAt} >= ${vis.cutoffAt})`;
}
