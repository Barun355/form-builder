"use client";

import Link from "next/link";
import { IconClipboardText, IconSparkles } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { CreateFormDialog } from "~/components/create-form-dialog";
import { DashboardShell } from "~/components/dashboard-shell";
import { RecentFormsCard } from "~/components/dashboard/recent-forms-card";
import { RecentSubmissionsCard } from "~/components/dashboard/recent-submissions-card";
import { RefreshButton } from "~/components/dashboard/refresh-button";
import { StatCards } from "~/components/dashboard/stat-cards";
import { SubmissionTrendChart } from "~/components/dashboard/submission-trend-chart";
import { UpgradeBanner } from "~/components/dashboard/upgrade-banner";
import { useDashboardStats } from "~/hooks/dashboard";
import { useUser } from "~/hooks/auth";

export default function DashboardPage() {
  const { user } = useUser();
  const { data: stats, isLoading } = useDashboardStats();
  const hasZeroForms = stats != null && stats.totalForms === 0;

  return (
    <DashboardShell>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            {/* Header */}
            <div className="flex flex-col gap-3 px-4 sm:flex-row sm:items-start sm:justify-between lg:px-6">
              <div>
                <h1 className="text-h1 text-foreground">
                  {user?.fullName
                    ? `Welcome back, ${user.fullName.split(" ")[0]}`
                    : "Dashboard"}
                </h1>
                <p className="text-body text-muted-foreground mt-1">
                  Activity across all your forms.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <RefreshButton />
                <CreateFormDialog />
              </div>
            </div>

            {isLoading ? (
              <div className="px-4 lg:px-6">
                <Skeleton className="h-32 w-full rounded-2xl" />
              </div>
            ) : hasZeroForms ? (
              <div className="px-4 lg:px-6">
                <WelcomeHero />
              </div>
            ) : (
              <>
                {/* Plan-cap banner — only renders for over-cap Free users */}
                <UpgradeBanner />

                {/* KPI cards */}
                <div className="px-4 lg:px-6">
                  <StatCards />
                </div>

                {/* Trend chart */}
                <div className="px-4 lg:px-6">
                  <SubmissionTrendChart />
                </div>

                {/* Recent activity */}
                <div className="grid grid-cols-1 gap-4 px-4 md:grid-cols-2 lg:px-6">
                  <RecentFormsCard />
                  <RecentSubmissionsCard />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}

function WelcomeHero() {
  return (
    <div className="rounded-2xl border bg-card p-10 text-center">
      <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <IconSparkles className="size-8" strokeWidth={1.5} />
      </div>
      <h2 className="text-h2 text-foreground mb-2">Welcome to FormCraft</h2>
      <p className="text-body text-muted-foreground max-w-md mx-auto mb-6">
        Build, publish, and analyze forms in minutes. Create your first form
        to start collecting responses.
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
