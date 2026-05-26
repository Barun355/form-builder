"use client";

import { Skeleton } from "~/components/ui/skeleton";
import { useUser } from "~/hooks/auth";

import { PlanLockedFallback } from "./plan-locked-fallback";

type Feature = "analytics" | "submission_detail" | "global_analytics";

/**
 * Frontend gate for paid-only routes. Short-circuits the page to the
 * feedback-form fallback for Free users, saving a roundtrip and a flash
 * of "permission denied". The backend `paidProcedure` is the source of
 * truth — this just avoids the wasted fetch.
 *
 * Renders a skeleton during the initial auth.me load to avoid a Free
 * user briefly seeing the gated page content.
 */
export function PlanGate({
  feature,
  children,
}: {
  feature: Feature;
  children: React.ReactNode;
}) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-6 sm:p-10 space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-full max-w-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    );
  }

  if (user?.plan === "free") {
    return <PlanLockedFallback feature={feature} />;
  }

  return <>{children}</>;
}
