import { db, sql } from "@repo/database";
import type {
  FieldSchemaI,
  FormSchemaI,
} from "@repo/database/models/form-versions";
import {
  aggregateChoiceCheckbox,
  type AggregateBucket,
} from "./jsonb-aggregate";

export interface NumberStats {
  count: number;
  min: number;
  max: number;
  avg: number;
  median: number;
}

export interface FieldDistribution {
  fieldId: string;
  fieldType: FieldSchemaI["type"];
  label: string;
  responseCount: number;
  responseRate: number;
  /** Choice-type fields (select, radio, checkbox) */
  distribution?: AggregateBucket[];
  /** value→label map sourced from schema (for choice types) */
  optionLabels?: Record<string, string>;
  /** Number-type fields */
  numberStats?: NumberStats;
  /** Number-type fields: 10 histogram bins */
  histogram?: { bucket: number; rangeStart: number; rangeEnd: number; count: number }[];
}

const HISTOGRAM_BINS = 10;

/**
 * For one form (scoped to formId) + one published version's schema, compute
 * per-field distribution + response stats. Iterates the schema fields.
 */
export async function computeFieldDistributions({
  formId,
  schema,
  totalCompleted,
}: {
  formId: string;
  schema: FormSchemaI;
  totalCompleted: number;
}): Promise<FieldDistribution[]> {
  const results: FieldDistribution[] = [];

  for (const field of schema.fields) {
    const base: FieldDistribution = {
      fieldId: field.id,
      fieldType: field.type,
      label: field.label || field.name || field.id,
      responseCount: 0,
      responseRate: 0,
    };

    // Response count: jsonb has the key AND value is "non-empty"
    const [countRow] = (
      await db.execute(sql`
        SELECT COUNT(*)::int AS c
        FROM form_submissions
        WHERE form_id = ${formId}::uuid
          AND status = 'completed'
          AND is_deleted = false
          AND data ? ${field.id}
          AND CASE
            WHEN jsonb_typeof(data->${field.id}) = 'array'
              THEN jsonb_array_length(data->${field.id}) > 0
            WHEN jsonb_typeof(data->${field.id}) = 'string'
              THEN length(data->>${field.id}) > 0
            ELSE TRUE
          END
      `) as unknown as { rows: { c: number }[] }
    ).rows;

    base.responseCount = Number(countRow?.c ?? 0);
    base.responseRate =
      totalCompleted === 0 ? 0 : base.responseCount / totalCompleted;

    if (field.type === "select" || field.type === "radio") {
      // CTE pattern: extract the jsonb scalar once into a column, then
      // GROUP BY the column. Avoids Postgres's "data->>$1 vs data->>$5"
      // parse-tree mismatch when the same key is interpolated multiple times.
      const distRows = await db.execute(sql`
        WITH vals AS (
          SELECT data->>${field.id} AS value
          FROM form_submissions
          WHERE form_id = ${formId}::uuid
            AND status = 'completed'
            AND is_deleted = false
        )
        SELECT value, COUNT(*)::int AS count
        FROM vals
        WHERE value IS NOT NULL AND value != ''
        GROUP BY value
        ORDER BY count DESC
        LIMIT 20
      `);
      base.distribution = (
        distRows as unknown as { rows: { value: string; count: number }[] }
      ).rows.map((r) => ({ value: r.value, count: Number(r.count) }));
      base.optionLabels = Object.fromEntries(
        (field.options ?? []).map((o) => [o.value, o.label]),
      );
    } else if (field.type === "checkbox") {
      base.distribution = await aggregateChoiceCheckbox({
        scopeFormIds: [formId],
        fieldId: field.id,
      });
      base.optionLabels = Object.fromEntries(
        (field.options ?? []).map((o) => [o.value, o.label]),
      );
    } else if (field.type === "number") {
      // Pull raw numeric values, compute stats + histogram in JS for simplicity
      const valRows = await db.execute(sql`
        SELECT (data->>${field.id})::numeric AS val
        FROM form_submissions
        WHERE form_id = ${formId}::uuid
          AND status = 'completed'
          AND is_deleted = false
          AND data->>${field.id} ~ '^-?[0-9]+\\.?[0-9]*$'
        LIMIT 5000
      `);

      const values = (
        valRows as unknown as { rows: { val: string | number }[] }
      ).rows.map((r) => Number(r.val));

      if (values.length > 0) {
        const sorted = [...values].sort((a, b) => a - b);
        const min = sorted[0]!;
        const max = sorted[sorted.length - 1]!;
        const sum = sorted.reduce((s, v) => s + v, 0);
        const avg = sum / sorted.length;
        const median =
          sorted.length % 2 === 0
            ? (sorted[sorted.length / 2 - 1]! + sorted[sorted.length / 2]!) /
              2
            : sorted[Math.floor(sorted.length / 2)]!;

        base.numberStats = {
          count: sorted.length,
          min,
          max,
          avg,
          median,
        };

        // Histogram: 10 equal-width bins between min and max
        const range = max - min;
        const binWidth = range === 0 ? 1 : range / HISTOGRAM_BINS;
        const bins = Array.from({ length: HISTOGRAM_BINS }, (_, i) => ({
          bucket: i + 1,
          rangeStart: min + i * binWidth,
          rangeEnd: min + (i + 1) * binWidth,
          count: 0,
        }));
        for (const v of sorted) {
          if (range === 0) {
            bins[0]!.count += 1;
          } else {
            // Last bin includes the max value
            const idx = Math.min(
              HISTOGRAM_BINS - 1,
              Math.floor((v - min) / binWidth),
            );
            bins[idx]!.count += 1;
          }
        }
        base.histogram = bins;
      }
    }

    results.push(base);
  }

  return results;
}
