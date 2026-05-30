"use client";

import * as React from "react";
import Link from "next/link";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useTheme } from "~/hooks/theme";
import { ThemeEditorTopbar } from "./theme-editor-topbar";
import { ThemeControlsPanel } from "./theme-controls-panel";
import { ThemePreviewPane } from "./theme-preview-pane";
import { useThemeBuilderStore } from "./store";

type Props = {
  themeId: string;
};

/**
 * Top-level editor wiring. Fetches the theme, hydrates the Zustand store,
 * then renders the two-pane layout. Not-found / forbidden cases render an
 * empty-state pointing back to the themes list.
 *
 * The fetched theme is the source of truth on FIRST mount only — after
 * that, the store owns the working copy. We use the store's own
 * `themeId` as the hydration signal: until `store.themeId === theme.id`,
 * sections would read placeholder tokens, so we render a skeleton.
 *
 * Don't try to track hydration with a ref — refs don't trigger re-renders,
 * so the editor would stay stuck on the skeleton even after `load()`
 * ran. Zustand subscriptions DO trigger re-renders, which is the whole
 * point of using the store's `themeId` here.
 */
export function ThemeEditorShell({ themeId }: Props) {
  const { theme, isLoading, isError, error } = useTheme(themeId);
  const load = useThemeBuilderStore((s) => s.load);
  const storeThemeId = useThemeBuilderStore((s) => s.themeId);

  React.useEffect(() => {
    if (!theme) return;
    if (storeThemeId === theme.id) return;
    load({
      themeId: theme.id,
      isOwner: theme.isOwner,
      createdByName: theme.createdByName,
      tokens: theme.tokens,
      meta: {
        name: theme.name,
        description: theme.description,
        category: theme.category,
        coverImageUrl: theme.coverImageUrl,
        visibility: theme.visibility,
      },
    });
  }, [theme, storeThemeId, load]);

  if (isLoading || (!theme && !isError)) {
    return <EditorSkeleton />;
  }

  if (isError || !theme) {
    return (
      <NotAvailable
        message={
          error?.message?.includes("not found")
            ? "This theme isn't available — it may have been deleted, or you don't have permission to view it."
            : (error?.message ?? "Failed to load this theme.")
        }
      />
    );
  }

  if (storeThemeId !== theme.id) {
    return <EditorSkeleton />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <ThemeEditorTopbar />
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[420px] shrink-0 overflow-y-auto border-r border-border bg-card">
          <ThemeControlsPanel />
        </div>
        <div className="flex-1 overflow-hidden">
          <ThemePreviewPane />
        </div>
      </div>
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4">
        <Skeleton className="size-8" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[420px] shrink-0 border-r border-border bg-card p-4 space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex flex-1 items-center justify-center bg-canvas">
          <Skeleton className="h-96 w-3/4 max-w-2xl rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function NotAvailable({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
        <IconAlertTriangle className="size-5" />
      </div>
      <div className="max-w-md">
        <h1 className="text-h3 text-foreground">Theme not available</h1>
        <p className="mt-1 text-body-sm text-muted-foreground">{message}</p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/dashboard/themes">
          <IconArrowLeft className="size-4" />
          Back to themes
        </Link>
      </Button>
    </div>
  );
}
