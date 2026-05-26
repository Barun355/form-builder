"use client";

import * as React from "react";
import Link from "next/link";
import { IconClipboardText, IconRefresh, IconSparkles } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import { DashboardShell } from "~/components/dashboard-shell";
import { CreateFormDialog } from "~/components/create-form-dialog";
import { PlanGate } from "~/components/plan-gate";
import {
  useGlobalAnalyticsAudience,
  useGlobalAnalyticsKpis,
  useRefreshGlobalAnalytics,
} from "~/hooks/analytics";

import { AudienceGrid } from "~/components/analytics/audience-grid";
import { GlobalKpis } from "~/components/analytics/global-kpis";
import { TopFormsCard } from "~/components/analytics/top-forms-card";
import { UtmSources } from "~/components/analytics/utm-sources";

export default function AnalyticsPage() {
  const { data: kpis, isLoading: kpisLoading } = useGlobalAnalyticsKpis();
  const audienceQuery = useGlobalAnalyticsAudience();
  const refresh = useRefreshGlobalAnalytics();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const hasZeroForms = kpis != null && kpis.totalForms === 0;

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

  return (
    <DashboardShell>
      <PlanGate feature="global_analytics">
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header */}
            <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
              <div>
                <h1 className="text-h1 text-foreground">Analytics</h1>
                <p className="text-body text-muted-foreground mt-1">
                  Activity across all your forms.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing || kpisLoading}
                >
                  <IconRefresh
                    className={cn("size-4", isRefreshing && "animate-spin")}
                  />
                  Refresh
                </Button>
                <CreateFormDialog />
              </div>
            </div>

            {hasZeroForms ? (
              <div className="px-4 lg:px-6">
                <WelcomeHero />
              </div>
            ) : (
              <>
                <div className="px-4 lg:px-6">
                  <GlobalKpis />
                </div>
                <div className="px-4 lg:px-6">
                  <TopFormsCard />
                </div>
                <div className="px-4 lg:px-6">
                  <AudienceGrid
                    data={audienceQuery.data}
                    isLoading={audienceQuery.isLoading}
                  />
                </div>
                <div className="px-4 lg:px-6">
                  <UtmSources
                    hasUtmData={audienceQuery.data?.hasUtmData}
                    utmSource={audienceQuery.data?.utmSource ?? []}
                    utmMedium={audienceQuery.data?.utmMedium ?? []}
                    utmCampaign={audienceQuery.data?.utmCampaign ?? []}
                    isLoading={audienceQuery.isLoading}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      </PlanGate>
    </DashboardShell>
  );
}

function WelcomeHero() {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <IconSparkles className="size-8" strokeWidth={1.5} />
      </div>
      <h2 className="text-h2 text-foreground mb-2">No forms yet</h2>
      <p className="text-body text-muted-foreground max-w-md mx-auto mb-6">
        Analytics populate once you have forms collecting responses. Create
        your first one to get started.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <CreateFormDialog />
        <Button asChild variant="outline">
          <Link href="/dashboard/forms">
            <IconClipboardText className="size-4" />
            Browse forms
          </Link>
        </Button>
      </div>
    </div>
  );
}
