"use client";

import { use } from "react";
import Link from "next/link";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { DashboardShell } from "~/components/dashboard-shell";
import { PlanGate } from "~/components/plan-gate";
import { SubmissionDetailView } from "~/components/submissions/submission-detail-view";
import { useFormSubmission } from "~/hooks/form-submissions";

export default function SubmissionDetailPage({
  params,
}: {
  params: Promise<{ id: string; submissionId: string }>;
}) {
  const { id, submissionId } = use(params);

  return (
    <DashboardShell>
      <PlanGate feature="submission_detail">
        <div className="mx-auto max-w-3xl p-6 sm:p-10 space-y-6">
          <Button asChild variant="ghost" size="sm" className="-ml-2 w-fit">
            <Link href={`/dashboard/forms/${id}/submissions`}>
              <IconArrowLeft className="size-4" />
              Back to submissions
            </Link>
          </Button>
          <SubmissionDetailInner submissionId={submissionId} />
        </div>
      </PlanGate>
    </DashboardShell>
  );
}

function SubmissionDetailInner({ submissionId }: { submissionId: string }) {
  const { data, isLoading, isError, error } = useFormSubmission(submissionId);

  if (isLoading) {
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center text-center gap-3 py-16">
        <IconAlertTriangle className="size-6 text-destructive" />
        <p className="text-body-sm text-destructive">
          {error?.message ?? "Failed to load submission"}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <>
      <div>
        <h1 className="text-h2 text-foreground">Submission</h1>
        <p className="text-body-sm text-muted-foreground mt-1 font-mono">
          {data.id}
        </p>
      </div>
      <SubmissionDetailView data={data} />
    </>
  );
}
