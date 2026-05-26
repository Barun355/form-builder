import { db, sql } from "@repo/database";

export interface AggregateBucket {
  value: string;
  count: number;
}

/**
 * Aggregate distinct values for a single jsonb top-level key across the user's
 * form_submissions. Returns top N values + a synthetic "Other" bucket if the
 * tail has any items. Only counts completed, non-deleted submissions.
 *
 * @param scopeFormIds the set of form ids to restrict to (empty array → empty result)
 * @param column        either 'meta' or 'data' — the jsonb column to read
 * @param key           the top-level key within the jsonb object
 * @param topN          number of buckets to return before collapsing the rest
 */
export async function aggregateJsonbTopLevel({
  scopeFormIds,
  column,
  key,
  topN = 8,
}: {
  scopeFormIds: string[];
  column: "meta" | "data";
  key: string;
  topN?: number;
}): Promise<AggregateBucket[]> {
  if (scopeFormIds.length === 0) return [];

  const columnSql = column === "meta" ? sql`meta` : sql`data`;
  // Expand the JS array into individual `$N::uuid` parameters. Drizzle's
  // default array binding would serialize the JS array via toString, sending
  // a bare comma-joined string that ::uuid[] then fails to parse as a PG
  // array literal ("malformed array literal").
  const formIdList = sql.join(
    scopeFormIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );

  // Single query: CTE extracts the jsonb scalar once into a normal column
  // (`value`), then we GROUP BY that column. Top N rows come back as-is;
  // everything beyond is summed into the last row with value = '__other__'
  // which the caller renames to 'Other'.
  const rows = await db.execute(sql`
    WITH vals AS (
      SELECT ${columnSql}->>${key} AS value
      FROM form_submissions
      WHERE form_id IN (${formIdList})
        AND status = 'completed'
        AND is_deleted = false
    ),
    grouped AS (
      SELECT value, COUNT(*)::int AS count
      FROM vals
      WHERE value IS NOT NULL AND value != ''
      GROUP BY value
    ),
    ranked AS (
      SELECT value, count, ROW_NUMBER() OVER (ORDER BY count DESC) AS rn
      FROM grouped
    )
    SELECT value, count
    FROM ranked
    WHERE rn <= ${topN}
    UNION ALL
    SELECT '__other__' AS value, COALESCE(SUM(count), 0)::int AS count
    FROM ranked
    WHERE rn > ${topN}
    HAVING SUM(count) > 0
    ORDER BY count DESC
  `);

  return (
    rows as unknown as { rows: { value: string; count: number }[] }
  ).rows.map((r) => ({
    value: r.value === "__other__" ? "Other" : r.value,
    count: Number(r.count),
  }));
}

/**
 * Special case for checkbox fields: values are stored as a JSON array of
 * strings. Use jsonb_array_elements_text to unnest before counting.
 */
export async function aggregateChoiceCheckbox({
  scopeFormIds,
  fieldId,
  topN = 20,
}: {
  scopeFormIds: string[];
  fieldId: string;
  topN?: number;
}): Promise<AggregateBucket[]> {
  if (scopeFormIds.length === 0) return [];

  const formIdList = sql.join(
    scopeFormIds.map((id) => sql`${id}::uuid`),
    sql`, `,
  );

  const rows = await db.execute(sql`
    WITH unnested AS (
      SELECT jsonb_array_elements_text(data->${fieldId}) AS value
      FROM form_submissions
      WHERE form_id IN (${formIdList})
        AND status = 'completed'
        AND is_deleted = false
        AND jsonb_typeof(data->${fieldId}) = 'array'
    )
    SELECT value, COUNT(*)::int AS count
    FROM unnested
    GROUP BY value
    ORDER BY count DESC
    LIMIT ${topN}
  `);

  return (
    rows as unknown as { rows: { value: string; count: number }[] }
  ).rows.map((r) => ({ value: r.value, count: Number(r.count) }));
}
