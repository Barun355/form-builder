"use client";

import { useRouter } from "next/navigation";
import { IconPlus } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { DashboardShell } from "~/components/dashboard-shell";
import { ThemesGrid } from "~/components/themes-grid";
import { useCreateTheme } from "~/hooks/theme";

export default function ThemesPage() {
  const router = useRouter();
  const { createThemeAsync, isPending: isCreating } = useCreateTheme();

  async function handleCreate() {
    try {
      const result = await createThemeAsync({ name: "Untitled Theme" });
      router.push(`/dashboard/themes/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create theme");
    }
  }

  return (
    <DashboardShell>
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="flex items-start justify-between gap-4 px-4 lg:px-6">
              <div>
                <h1 className="text-h1 text-foreground">Themes</h1>
                <p className="text-body text-muted-foreground mt-1">
                  Design how your forms look. Apply a theme to any form.
                </p>
              </div>
              <Button onClick={handleCreate} loading={isCreating}>
                <IconPlus className="size-4" />
                New theme
              </Button>
            </div>
            <div className="px-4 lg:px-6">
              <ThemesGrid />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
