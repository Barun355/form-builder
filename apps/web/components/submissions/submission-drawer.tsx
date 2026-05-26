"use client";

import * as React from "react";
import { IconAlertTriangle } from "@tabler/icons-react";

import { StatusChip } from "~/components/status-chip";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { useFormSubmission } from "~/hooks/form-submissions";
import type {
  FormSchemaI,
  FieldSchemaI,
} from "@repo/database/models/form-versions";

type Props = {
  submissionId: string | null;
  onOpenChange: (open: boolean) => void;
};

const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function SubmissionDrawer({ submissionId, onOpenChange }: Props) {
  const { data, isLoading, isError, error } = useFormSubmission(
    submissionId ?? undefined,
  );

  const open = Boolean(submissionId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Submission</SheetTitle>
          <SheetDescription>
            {data?.id ? (
              <span className="font-mono text-body-sm">
                {data.id.slice(0, 8)}
              </span>
            ) : (
              "Loading details..."
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="px-4 pb-6 space-y-6 overflow-y-auto">
          {isLoading ? (
            <DrawerSkeleton />
          ) : isError ? (
            <div className="flex flex-col items-center justify-center text-center gap-3 py-10">
              <IconAlertTriangle className="size-6 text-destructive" />
              <p className="text-body-sm text-destructive">
                {error?.message ?? "Failed to load submission"}
              </p>
            </div>
          ) : data ? (
            <DrawerBody data={data} />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function DrawerBody({
  data,
}: {
  data: {
    id: string;
    status: "started" | "completed";
    startedAt: string | Date;
    submittedAt: string | Date | null;
    data?: unknown;
    meta?: unknown;
    version: { id: string; version: number; schema?: unknown };
  };
}) {
  const submission = data;
  const schema = submission.version.schema as FormSchemaI;
  const values = (submission.data ?? {}) as Record<string, unknown>;
  const meta = (submission.meta ?? {}) as Record<string, string | undefined>;

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
          status={
            submission.status === "completed" ? "published" : "draft"
          }
        />
        <span className="text-caps uppercase text-muted-foreground">
          v{submission.version.version}
        </span>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-body-sm">
        <div>
          <dt className="text-muted-foreground">Started</dt>
          <dd className="text-foreground">
            {dateTimeFmt.format(new Date(submission.startedAt))}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Submitted</dt>
          <dd className="text-foreground">
            {submission.submittedAt
              ? dateTimeFmt.format(new Date(submission.submittedAt))
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

function DrawerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-24 rounded-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-12" />
        <Skeleton className="h-12" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
