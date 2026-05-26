"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { IconArrowLeft } from "@tabler/icons-react";

import { DashboardShell } from "~/components/dashboard-shell";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { StatusChip } from "~/components/status-chip";
import { ExportCsvButton } from "~/components/submissions/export-csv-button";
import { SubmissionDrawer } from "~/components/submissions/submission-drawer";
import { SubmissionsFilterBar, type SubmissionsFilters } from "~/components/submissions/submissions-filter-bar";
import { SubmissionsTable } from "~/components/submissions/submissions-table";
import { useForm } from "~/hooks/form";

export default function SubmissionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { form, isLoading: formLoading } = useForm(id);

  const filters: SubmissionsFilters = useMemo(
    () => ({
      status:
        (searchParams.get("status") as SubmissionsFilters["status"]) ?? "all",
      search: searchParams.get("q") ?? "",
      dateFrom: searchParams.get("dateFrom") ?? "",
      dateTo: searchParams.get("dateTo") ?? "",
    }),
    [searchParams],
  );

  const updateFilters = (patch: Partial<SubmissionsFilters>) => {
    const next = new URLSearchParams(searchParams);
    const map: Record<keyof SubmissionsFilters, string> = {
      status: "status",
      search: "q",
      dateFrom: "dateFrom",
      dateTo: "dateTo",
    };
    for (const [key, value] of Object.entries(patch)) {
      const param = map[key as keyof SubmissionsFilters];
      if (value === "" || value == null || value === "all") {
        next.delete(param);
      } else {
        next.set(param, String(value));
      }
    }
    const qs = next.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  };

  const [drawerId, setDrawerId] = useState<string | null>(null);

  // Wipe drawer state when filters change (avoids drawer pointing at stale row)
  useEffect(() => {
    setDrawerId(null);
  }, [pathname, searchParams]);

  return (
    <DashboardShell>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Button
                variant="ghost"
                size="sm"
                className="-ml-2"
                onClick={() => router.push("/dashboard/forms")}
              >
                <IconArrowLeft className="size-4" />
                Back to forms
              </Button>
              {formLoading ? (
                <Skeleton className="h-7 w-64" />
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-h1 text-foreground">
                    {form?.title ?? "Submissions"}
                  </h1>
                  {form ? <StatusChip status={form.status} /> : null}
                </div>
              )}
              <p className="text-body text-muted-foreground">
                Submissions {form?.slug ? `for ${form.slug}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/dashboard/forms/${id}/edit`}>Open builder</Link>
              </Button>
              <ExportCsvButton
                formId={id}
                status={
                  filters.status === "all" ? undefined : filters.status
                }
                dateFrom={filters.dateFrom || undefined}
                dateTo={filters.dateTo || undefined}
              />
            </div>
          </div>

          <div className="px-4 lg:px-6">
            <SubmissionsFilterBar
              filters={filters}
              onChange={updateFilters}
            />
          </div>

          <div className="px-4 lg:px-6">
            <SubmissionsTable
              formId={id}
              status={
                filters.status === "all" ? undefined : filters.status
              }
              dateFrom={filters.dateFrom ? new Date(filters.dateFrom) : undefined}
              dateTo={filters.dateTo ? new Date(filters.dateTo) : undefined}
              search={filters.search || undefined}
              onRowClick={(submissionId) => setDrawerId(submissionId)}
            />
          </div>
        </div>
      </div>

      <SubmissionDrawer
        submissionId={drawerId}
        onOpenChange={(open) => {
          if (!open) setDrawerId(null);
        }}
      />
    </DashboardShell>
  );
}
