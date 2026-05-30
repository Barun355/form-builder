"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { IconPalette, IconPlus, IconSearch } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Empty, EmptyHeader, EmptyMedia } from "~/components/ui/empty";
import { cn } from "~/lib/utils";
import { ThemeCard } from "~/components/theme-card";
import { useCreateTheme, useThemes } from "~/hooks/theme";

type Scope = "mine" | "public";

type Category =
  | "all"
  | "standard"
  | "branded"
  | "event"
  | "retro"
  | "dark"
  | "high_contrast"
  | "minimal"
  | "other";

const CATEGORIES: ReadonlyArray<{ value: Category; label: string }> = [
  { value: "all", label: "All" },
  { value: "standard", label: "Standard" },
  { value: "branded", label: "Branded" },
  { value: "event", label: "Event" },
  { value: "retro", label: "Retro" },
  { value: "dark", label: "Dark" },
  { value: "high_contrast", label: "High contrast" },
  { value: "minimal", label: "Minimal" },
  { value: "other", label: "Other" },
];

/**
 * The themes list page body. Two tabs (My themes / Public themes), category
 * filter chips, and a debounced search box. The grid below is responsive:
 * 1 / 2 / 3 columns at sm / md / lg.
 */
export function ThemesGrid() {
  const router = useRouter();
  const [scope, setScope] = React.useState<Scope>("mine");
  const [category, setCategory] = React.useState<Category>("all");
  const [searchInput, setSearchInput] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");

  // 300ms debounce on the search input so we're not hammering the API on
  // every keystroke.
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { items, isLoading, isError, error } = useThemes({
    scope,
    category: category === "all" ? undefined : category,
    search: debouncedSearch.length > 0 ? debouncedSearch : undefined,
  });

  const { createThemeAsync, isPending: isCreating } = useCreateTheme();

  async function handleCreate() {
    try {
      const result = await createThemeAsync({
        name: "Untitled Theme",
      });
      router.push(`/dashboard/themes/${result.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create theme");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Tabs + search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={scope} onValueChange={(v) => setScope(v as Scope)}>
          <TabsList>
            <TabsTrigger value="mine">My themes</TabsTrigger>
            <TabsTrigger value="public">Public themes</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <IconSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search themes…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setCategory(c.value)}
            className={cn(
              "rounded-full border px-3 py-1 text-body-sm transition-colors",
              category === c.value
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-border/80 hover:text-foreground",
            )}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Grid / empty / loading */}
      {isLoading ? (
        <SkeletonGrid />
      ) : isError ? (
        <Empty>
          <EmptyHeader>
            <p className="text-body text-destructive">
              {error?.message ?? "Failed to load themes."}
            </p>
          </EmptyHeader>
        </Empty>
      ) : items.length === 0 ? (
        <EmptyState
          scope={scope}
          isFiltered={category !== "all" || debouncedSearch.length > 0}
          onCreate={handleCreate}
          isCreating={isCreating}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((theme) => (
            <ThemeCard key={theme.id} theme={theme} />
          ))}
        </div>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-xl border border-border bg-card"
        >
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="flex flex-col gap-3 p-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  scope,
  isFiltered,
  onCreate,
  isCreating,
}: {
  scope: Scope;
  isFiltered: boolean;
  onCreate: () => void;
  isCreating: boolean;
}) {
  if (isFiltered) {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <IconSearch />
        </EmptyMedia>
        <EmptyHeader>
          <h3 className="text-h4">No themes match those filters</h3>
          <p className="text-body-sm text-muted-foreground">
            Try removing the search term or picking a different category.
          </p>
        </EmptyHeader>
      </Empty>
    );
  }

  if (scope === "public") {
    return (
      <Empty>
        <EmptyMedia variant="icon">
          <IconPalette />
        </EmptyMedia>
        <EmptyHeader>
          <h3 className="text-h4">No public themes yet</h3>
          <p className="text-body-sm text-muted-foreground">
            Be the first — create a theme and flip it public to share it
            with everyone.
          </p>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <Empty>
      <EmptyMedia variant="icon">
        <IconPalette />
      </EmptyMedia>
      <EmptyHeader>
        <h3 className="text-h4">No themes yet</h3>
        <p className="text-body-sm text-muted-foreground">
          Themes restyle your public form pages — colors, fonts, surfaces,
          backgrounds. Build your first one or duplicate a public theme.
        </p>
      </EmptyHeader>
      <Button onClick={onCreate} loading={isCreating}>
        <IconPlus className="size-4" />
        Create theme
      </Button>
    </Empty>
  );
}
