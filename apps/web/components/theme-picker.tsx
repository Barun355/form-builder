"use client";

import * as React from "react";
import { IconCheck, IconChevronDown } from "@tabler/icons-react";
import type { RouterOutputs } from "@repo/trpc/client";

import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Skeleton } from "~/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { useTheme, useThemes } from "~/hooks/theme";

type ThemeListItem = RouterOutputs["theme"]["list"]["items"][number];

type Props = {
  /** Currently selected theme id, or null = "no theme" (System Default look). */
  value: string | null;
  onChange: (themeId: string | null) => void;
  disabled?: boolean;
  /** Override the trigger label; defaults to the selected theme's name. */
  triggerLabel?: string;
};

/**
 * Theme picker — trigger + popover with two tabs (My themes / Public).
 *
 * Implementation choice: Popover (not Dialog) so this can mount cleanly
 * inside the form-builder's Settings Sheet without focus-trap conflicts.
 * Both Radix Dialog and Radix Sheet body-lock + trap focus; nesting them
 * is fragile (z-index races, click events swallowed, aria-hidden on the
 * sheet content). Popover doesn't trap focus, doesn't lock the body, and
 * anchors to the trigger — exactly what a dropdown-shaped picker wants.
 *
 * Label resolution: `useTheme(value)` reads the chosen theme's name
 * directly instead of fishing through the two list queries. Avoids two
 * failure modes the list-based lookup had: (a) the picked theme isn't
 * in either scope's cached page; (b) the lists hadn't loaded yet at the
 * moment after selection. `useTheme` is enabled only when value is set,
 * so the no-theme case ("System Default") skips the network round-trip.
 */
export function ThemePicker({ value, onChange, disabled, triggerLabel }: Props) {
  const [open, setOpen] = React.useState(false);
  const { theme: selectedTheme } = useTheme(value ?? undefined);

  const owned = useThemes({ scope: "mine" });
  const publicThemes = useThemes({ scope: "public" });

  function select(next: string | null) {
    onChange(next);
    setOpen(false);
  }

  const label = triggerLabel ?? selectedTheme?.name ?? "System Default";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="truncate text-left">{label}</span>
          <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] min-w-[20rem] p-3"
      >
        <Tabs defaultValue="mine">
          <TabsList className="mb-2">
            <TabsTrigger value="mine">My themes</TabsTrigger>
            <TabsTrigger value="public">Public</TabsTrigger>
          </TabsList>

          <TabsContent value="mine">
            <ThemeGrid
              items={owned.items}
              isLoading={owned.isLoading}
              selectedId={value}
              onSelect={select}
              includeSystemDefault
            />
          </TabsContent>

          <TabsContent value="public">
            <ThemeGrid
              items={publicThemes.items}
              isLoading={publicThemes.isLoading}
              selectedId={value}
              onSelect={select}
              includeSystemDefault={false}
            />
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

function ThemeGrid({
  items,
  isLoading,
  selectedId,
  onSelect,
  includeSystemDefault,
}: {
  items: ThemeListItem[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  includeSystemDefault: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-2 pt-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (items.length === 0 && !includeSystemDefault) {
    return (
      <p className="py-6 text-center text-body-sm text-muted-foreground">
        No public themes yet.
      </p>
    );
  }

  return (
    <ScrollArea className="max-h-72 pt-1">
      <div className="grid grid-cols-2 gap-2">
        {includeSystemDefault ? (
          <ThemeCell
            label="System Default"
            sublabel="No theme attached"
            active={selectedId === null}
            onClick={() => onSelect(null)}
            // No swatch row for the "no theme" cell — there's no theme
            // to fingerprint. Empty space reads as "neutral / default."
            previewColors={null}
          />
        ) : null}
        {items.map((theme) => (
          <ThemeCell
            key={theme.id}
            label={theme.name}
            sublabel={theme.createdByName ?? undefined}
            active={selectedId === theme.id}
            onClick={() => onSelect(theme.id)}
            previewColors={theme.previewColors}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

function ThemeCell({
  label,
  sublabel,
  active,
  onClick,
  previewColors,
}: {
  label: string;
  sublabel?: string;
  active: boolean;
  onClick: () => void;
  /** Three-color fingerprint shown as a tiny swatch row. */
  previewColors: ThemeListItem["previewColors"] | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group relative flex h-24 flex-col items-start justify-between rounded-md border px-3 py-2 text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <div className="min-w-0 w-full">
        <p className="text-body font-medium text-foreground truncate">
          {label}
        </p>
        {sublabel ? (
          <p className="text-body-sm text-muted-foreground truncate">
            {sublabel}
          </p>
        ) : null}
      </div>

      {previewColors ? (
        // Swatch row — three small color chips so duplicates by name are
        // distinguishable at a glance. Page-bg first (frame), then surface
        // (card), then primary (brand) — mirrors visual layering on the
        // actual rendered form.
        <div
          className="flex h-4 w-full overflow-hidden rounded-sm border border-border/70"
          aria-label={`Preview: page ${previewColors.pageBackground}, surface ${previewColors.surface}, primary ${previewColors.primary}`}
        >
          <span
            className="flex-1"
            style={{ background: previewColors.pageBackground }}
          />
          <span
            className="flex-1"
            style={{ background: previewColors.surface }}
          />
          <span
            className="flex-1"
            style={{ background: previewColors.primary }}
          />
        </div>
      ) : null}

      {active ? (
        <IconCheck className="absolute top-2 right-2 size-4 text-primary" />
      ) : null}
    </button>
  );
}
