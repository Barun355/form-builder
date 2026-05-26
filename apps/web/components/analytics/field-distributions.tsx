"use client";

import { IconChartBar } from "@tabler/icons-react";

import { Skeleton } from "~/components/ui/skeleton";
import { FieldDistribution } from "./field-distribution";
import { useFormAnalyticsFields } from "~/hooks/analytics";

type Props = {
  formId: string;
};

export function FieldDistributions({ formId }: Props) {
  const { data, isLoading } = useFormAnalyticsFields(formId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (!data || data.versionId === null) {
    return (
      <div className="flex flex-col items-center text-center text-muted-foreground py-12 rounded-2xl border bg-card">
        <IconChartBar className="size-10 mb-2 opacity-40" strokeWidth={1.5} />
        <p className="text-body">No published version</p>
        <p className="text-body-sm mt-1">
          Publish a draft to see per-field response breakdown.
        </p>
      </div>
    );
  }

  if (data.fields.length === 0) {
    return (
      <div className="flex flex-col items-center text-center text-muted-foreground py-12 rounded-2xl border bg-card">
        <IconChartBar className="size-10 mb-2 opacity-40" strokeWidth={1.5} />
        <p className="text-body">No fields in the published version</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-caps uppercase text-muted-foreground">
        Showing data for v{data.versionNumber} (published)
      </p>
      {data.fields.map((f) => (
        <FieldDistribution
          key={f.fieldId}
          fieldId={f.fieldId}
          fieldType={f.fieldType}
          label={f.label}
          responseCount={f.responseCount}
          responseRate={f.responseRate}
          distribution={f.distribution}
          optionLabels={f.optionLabels}
          numberStats={f.numberStats}
          histogram={f.histogram}
        />
      ))}
    </div>
  );
}
