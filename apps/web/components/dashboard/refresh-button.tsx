"use client";

import * as React from "react";
import { IconRefresh } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { useRefreshDashboard } from "~/hooks/dashboard";

export function RefreshButton() {
  const refresh = useRefreshDashboard();
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  async function handleClick() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refresh();
      toast.success("Dashboard refreshed");
    } catch {
      toast.error("Failed to refresh");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={isRefreshing}
      aria-label="Refresh dashboard"
    >
      <IconRefresh
        className={cn("size-4", isRefreshing && "animate-spin")}
      />
      Refresh
    </Button>
  );
}
