"use client";

import * as React from "react";
import Link from "next/link";
import {
  IconDotsVertical,
  IconCopy,
  IconEdit,
  IconTrash,
} from "@tabler/icons-react";
import { toast } from "sonner";
import type { RouterOutputs } from "@repo/trpc/client";

import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { cn } from "~/lib/utils";
import { useDuplicateTheme, useSoftDeleteTheme } from "~/hooks/theme";

type ThemeListItem = RouterOutputs["theme"]["list"]["items"][number];

const CATEGORY_LABEL: Record<ThemeListItem["category"], string> = {
  standard: "Standard",
  branded: "Branded",
  event: "Event",
  retro: "Retro",
  dark: "Dark",
  high_contrast: "High contrast",
  minimal: "Minimal",
  other: "Other",
};

type Props = {
  theme: ThemeListItem;
};

/**
 * One card in the themes grid. Owner cards expose Edit / Duplicate / Delete;
 * non-owner cards (public themes from other users) show only Duplicate.
 * The "Apply to a form" primary action is intentionally deferred to PR 14
 * — it wires into the form-builder's saveDraft flow which doesn't exist
 * yet. Until then, the action shows a toast.
 */
export function ThemeCard({ theme }: Props) {
  const { softDeleteThemeAsync, isPending: isDeleting } = useSoftDeleteTheme();
  const { duplicateThemeAsync, isPending: isDuplicating } = useDuplicateTheme();
  const [confirmingDelete, setConfirmingDelete] = React.useState(false);

  async function handleDuplicate() {
    try {
      const result = await duplicateThemeAsync({ id: theme.id });
      toast.success(`Duplicated as "${result.name}"`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to duplicate");
    }
  }

  async function handleDelete() {
    try {
      await softDeleteThemeAsync({ id: theme.id });
      toast.success("Theme deleted");
      setConfirmingDelete(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  function handleApply() {
    // The apply path moved to the form builder in PR 14 — every form's
    // Settings → Appearance section has a ThemePicker that writes the
    // chosen themeId onto the draft. Cleaner than a from-the-card flow
    // because the user lands in the form they're applying to.
    toast.info(
      "Open any form's Settings → Appearance to pick this theme.",
    );
  }

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-border/80">
      <CoverSwatch
        themeId={theme.id}
        coverImageUrl={theme.coverImageUrl}
        category={theme.category}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-h4 text-foreground">{theme.name}</h3>
            <p className="mt-0.5 truncate text-body-sm text-muted-foreground">
              by {theme.isOwner ? "you" : (theme.createdByName ?? "anonymous")}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 opacity-60 transition-opacity group-hover:opacity-100"
                aria-label="Theme actions"
              >
                <IconDotsVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {theme.isOwner ? (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/themes/${theme.id}`}>
                    <IconEdit className="size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                <IconCopy className="size-4" />
                Duplicate
              </DropdownMenuItem>
              {theme.isOwner ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConfirmingDelete(true)}
                    disabled={isDeleting}
                    className="text-destructive focus:text-destructive"
                  >
                    <IconTrash className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {theme.description ? (
          <p className="line-clamp-2 text-body-sm text-muted-foreground">
            {theme.description}
          </p>
        ) : null}

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{CATEGORY_LABEL[theme.category]}</Badge>
          <Badge
            variant={theme.visibility === "PUBLIC" ? "default" : "outline"}
            className={cn(
              theme.visibility === "PUBLIC"
                ? "bg-success/15 text-success hover:bg-success/20"
                : "",
            )}
          >
            {theme.visibility === "PUBLIC" ? "Public" : "Private"}
          </Badge>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant="outline"
            onClick={handleApply}
            className="flex-1"
          >
            Apply to a form
          </Button>
        </div>
      </div>

      {confirmingDelete ? (
        <DeleteConfirmation
          themeName={theme.name}
          isDeleting={isDeleting}
          onCancel={() => setConfirmingDelete(false)}
          onConfirm={handleDelete}
        />
      ) : null}
    </div>
  );
}

/**
 * Procedural 16:9 cover. Uses theme.id as a stable seed → hue (0-360) so
 * the same theme always shows the same swatch, then layers the platform
 * primary as a secondary accent. Falls back to a real cover image when
 * one is provided. The category hint adds a tiny visual cue.
 */
function CoverSwatch({
  themeId,
  coverImageUrl,
  category,
}: {
  themeId: string;
  coverImageUrl: string | null;
  category: ThemeListItem["category"];
}) {
  if (coverImageUrl) {
    return (
      <div className="aspect-video w-full bg-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverImageUrl}
          alt=""
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // Deterministic FNV-1a-ish hash of the id → hue.
  let h = 2166136261;
  for (let i = 0; i < themeId.length; i++) {
    h ^= themeId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const hue = Math.abs(h) % 360;
  const accentHue = (hue + 50) % 360;

  return (
    <div
      className="aspect-video w-full"
      style={{
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 55%) 0%, hsl(${accentHue} 70% 45%) 100%)`,
      }}
      aria-label={`${CATEGORY_LABEL[category]} theme swatch`}
    />
  );
}

function DeleteConfirmation({
  themeName,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  themeName: string;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-xl bg-card/95 p-4 backdrop-blur-sm">
      <p className="text-body-sm text-foreground">
        Delete &quot;{themeName}&quot;?
      </p>
      <p className="text-body-sm text-muted-foreground text-center max-w-xs">
        Forms using this theme will fall back to System Default on next edit.
        Published forms keep their snapshot.
      </p>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          variant="destructive"
          size="sm"
          onClick={onConfirm}
          loading={isDeleting}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}
