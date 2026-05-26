"use client";

import Link from "next/link";
import { IconAlertCircle } from "@tabler/icons-react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { useDashboardStats } from "~/hooks/dashboard";

/**
 * Yellow alert above the dashboard when the Free user has received more
 * completed submissions this month than their plan allows them to see.
 * Reinforces the trust message ("data is safe, just upgrade to view").
 */
export function UpgradeBanner() {
  const { data } = useDashboardStats();
  if (!data) return null;
  if (data.plan !== "free") return null;
  if (data.monthlyLockedCount <= 0) return null;

  return (
    <div className="px-4 lg:px-6">
      <Alert className="border-warning/40 bg-warning/10">
        <IconAlertCircle className="size-4 text-warning" />
        <AlertTitle className="text-foreground">
          {data.monthlyLockedCount.toLocaleString()} submissions this month aren&apos;t visible
        </AlertTitle>
        <AlertDescription className="text-muted-foreground">
          Your Free plan shows the latest {(data.monthlyTotalSubmissions - data.monthlyLockedCount).toLocaleString()} of {data.monthlyTotalSubmissions.toLocaleString()} this month.
          Older submissions are safely stored — upgrade to view all of them.
          <div className="mt-3">
            <Button asChild size="sm" variant="outline">
              <Link href="/#pricing">See plans →</Link>
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
}
