"use client";

import { use } from "react";
import Link from "next/link";
import {
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import * as React from "react";
import { IconArrowLeft, IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/ui/tabs";
import { cn } from "~/lib/utils";

import { DashboardShell } from "~/components/dashboard-shell";
import { StatusChip } from "~/components/status-chip";
import { useForm } from "~/hooks/form";
import {
  useFormAnalyticsAudience,
  useFormAnalyticsKpis,
  useRefreshFormAnalytics,
} from "~/hooks/analytics";

import { AudienceGrid } from "~/components/analytics/audience-grid";
import { FieldDistributions } from "~/components/analytics/field-distributions";
import { FunnelBar } from "~/components/analytics/funnel-bar";
import { PerFormKpis } from "~/components/analytics/per-form-kpis";
import { PerFormTrendChart } from "~/components/analytics/per-form-trend";
import { UtmSources } from "~/components/analytics/utm-sources";

const VALID_TABS = new Set(["overview", "audience", "responses"]);

export default function FormAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tab =
    (searchParams?.get("tab") &&
      VALID_TABS.has(searchParams.get("tab")!) &&
      searchParams.get("tab")!) ||
    "overview";

  function setTab(next: string) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (next === "overview") params.delete("tab");
    else params.set("tab", next);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : (pathname ?? "/"));
  }

  const { form, isLoading: formLoading } = useForm(id);
  const kpisQuery = useFormAnalyticsKpis(id);
  const audienceQuery = useFormAnalyticsAudience(id);
  const refresh = useRefreshFormAnalytics(id);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  async function handleRefresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success("Analytics refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  }

  const isEmpty =
    kpisQuery.data != null && kpisQuery.data.totalStarts === 0;

  return (
    <DashboardShell>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="-ml-2 mb-2"
              >
                <Link href="/dashboard/forms">
                  <IconArrowLeft className="size-4" />
                  Back to forms
                </Link>
              </Button>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-h1 text-foreground">
                      {formLoading ? (
                        <Skeleton className="h-8 w-64" />
                      ) : (
                        `Analytics — ${form?.title ?? ""}`
                      )}
                    </h1>
                    {form ? <StatusChip status={form.status} /> : null}
                  </div>
                  {form?.description ? (
                    <p className="text-body text-muted-foreground mt-1">
                      {form.description}
                    </p>
                  ) : null}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                >
                  <IconRefresh
                    className={cn(
                      "size-4",
                      isRefreshing && "animate-spin",
                    )}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {isEmpty ? (
              <div className="px-4 lg:px-6">
                <EmptyAnalytics />
              </div>
            ) : (
              <div className="px-4 lg:px-6">
                <Tabs value={tab} onValueChange={setTab}>
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="audience">Audience</TabsTrigger>
                    <TabsTrigger value="responses">Responses</TabsTrigger>
                  </TabsList>

                  <TabsContent
                    value="overview"
                    className="space-y-4 md:space-y-6 mt-4"
                  >
                    <PerFormKpis formId={id} />
                    <PerFormTrendChart formId={id} />
                    <FunnelBar
                      starts={kpisQuery.data?.totalStarts ?? 0}
                      completed={kpisQuery.data?.totalCompleted ?? 0}
                    />
                  </TabsContent>

                  <TabsContent
                    value="audience"
                    className="space-y-4 md:space-y-6 mt-4"
                  >
                    <AudienceGrid
                      data={audienceQuery.data}
                      isLoading={audienceQuery.isLoading}
                    />
                    <UtmSources
                      hasUtmData={audienceQuery.data?.hasUtmData}
                      utmSource={audienceQuery.data?.utmSource ?? []}
                      utmMedium={audienceQuery.data?.utmMedium ?? []}
                      utmCampaign={audienceQuery.data?.utmCampaign ?? []}
                      isLoading={audienceQuery.isLoading}
                    />
                  </TabsContent>

                  <TabsContent value="responses" className="mt-4">
                    <FieldDistributions formId={id} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function EmptyAnalytics() {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <IconRefresh className="size-7" strokeWidth={1.5} />
      </div>
      <h2 className="text-h3 text-foreground mb-2">No submissions yet</h2>
      <p className="text-body text-muted-foreground max-w-md mx-auto">
        Analytics will populate as people start filling out this form. Share
        the public link to start collecting data.
      </p>
    </div>
  );
}
