"use client";

import * as React from "react";

import { StatusChip } from "~/components/status-chip";
import type {
  FormSchemaI,
  FieldSchemaI,
} from "@repo/database/models/form-versions";

const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type SubmissionDetail = {
  id: string;
  status: "started" | "completed";
  startedAt: string | Date;
  submittedAt: string | Date | null;
  data?: unknown;
  meta?: unknown;
  version: { id: string; version: number; schema?: unknown };
};

/**
 * Pure presentational view of a single submission. Used by the dedicated
 * submission detail page. Data fetching happens at the page level — this
 * component just renders.
 */
export function SubmissionDetailView({ data }: { data: SubmissionDetail }) {
  const schema = data.version.schema as FormSchemaI;
  const values = (data.data ?? {}) as Record<string, unknown>;
  const meta = (data.meta ?? {}) as Record<string, string | undefined>;

  const fieldsBySection = React.useMemo(() => {
    const fieldsById = new Map(schema.fields.map((f) => [f.id, f]));
    const map = new Map<string, FieldSchemaI[]>();
    for (const section of schema.sections) {
      const list = section.fieldIds
        .map((id) => fieldsById.get(id))
        .filter((f): f is FieldSchemaI => Boolean(f))
        .sort((a, b) => a.order - b.order);
      map.set(section.id, list);
    }
    return map;
  }, [schema]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <StatusChip
          status={data.status === "completed" ? "published" : "draft"}
        />
        <span className="text-caps uppercase text-muted-foreground">
          v{data.version.version}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-body-sm">
        <div>
          <dt className="text-muted-foreground">Started</dt>
          <dd className="text-foreground">
            {dateTimeFmt.format(new Date(data.startedAt))}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Submitted</dt>
          <dd className="text-foreground">
            {data.submittedAt
              ? dateTimeFmt.format(new Date(data.submittedAt))
              : "—"}
          </dd>
        </div>
      </dl>

      <section>
        <h3 className="text-caps uppercase text-muted-foreground mb-3">
          Responses
        </h3>
        <div className="space-y-5">
          {schema.sections.map((section) => {
            const fields = fieldsBySection.get(section.id) ?? [];
            if (fields.length === 0) return null;
            return (
              <div key={section.id} className="space-y-3">
                {section.title ? (
                  <h4 className="text-body-sm font-medium text-foreground">
                    {section.title}
                  </h4>
                ) : null}
                {fields.map((field) => (
                  <ResponseRow
                    key={field.id}
                    field={field}
                    value={values[field.id]}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </section>

      {Object.keys(meta).length > 0 ? (
        <section>
          <h3 className="text-caps uppercase text-muted-foreground mb-3">
            Metadata
          </h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-body-sm">
            {Object.entries(meta).map(([k, v]) =>
              v ? (
                <React.Fragment key={k}>
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-foreground truncate">{v}</dd>
                </React.Fragment>
              ) : null,
            )}
          </dl>
        </section>
      ) : null}
    </div>
  );
}

function ResponseRow({
  field,
  value,
}: {
  field: FieldSchemaI;
  value: unknown;
}) {
  return (
    <div>
      <p className="text-body-sm text-muted-foreground">{field.label}</p>
      <p className="text-body text-foreground whitespace-pre-wrap break-words">
        {formatValue(field, value)}
      </p>
    </div>
  );
}

function formatValue(field: FieldSchemaI, value: unknown): string {
  if (value == null || value === "") return "—";
  if (Array.isArray(value)) {
    const labels = value.map((v) => {
      const opt = field.options?.find((o) => o.value === v);
      return opt?.label ?? String(v);
    });
    return labels.join(" · ");
  }
  if (field.options) {
    const opt = field.options.find((o) => o.value === value);
    if (opt) return opt.label;
  }
  return String(value);
}
