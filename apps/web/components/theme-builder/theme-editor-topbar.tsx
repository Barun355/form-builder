"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconChevronDown,
  IconEye,
  IconMoon,
  IconSun,
} from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Badge } from "~/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { ConfirmDialog } from "~/components/confirm-dialog";
import { useThemeUsageCount, useUpdateTheme } from "~/hooks/theme";
import { cn } from "~/lib/utils";
import { useThemeBuilderStore, type EditingMode } from "./store";

/**
 * Topbar for the theme editor. Mirrors the form builder topbar's shape —
 * back arrow + inline-editable title + save indicator + Publish dropdown —
 * but talks to `theme.update` instead of `form.updateForm`/`saveDraft`.
 *
 * Save / Publish / Unpublish all go through `theme.update`. We don't use
 * the dedicated theme.publish/unpublish routes here because they don't
 * sync the working-copy tokens — using update unifies "save current
 * state" with "flip visibility" into one round-trip.
 */
export function ThemeEditorTopbar() {
  const router = useRouter();
  const meta = useThemeBuilderStore((s) => s.meta);
  const tokens = useThemeBuilderStore((s) => s.tokens);
  const themeId = useThemeBuilderStore((s) => s.themeId);

  // How many published forms snapshot from this theme. Drives the
  // snapshot-drift caption beside the save indicator so authors know
  // they're editing something that's live elsewhere.
  const { count: usageCount } = useThemeUsageCount(themeId || undefined);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);
  const isDirty = useThemeBuilderStore((s) => s.isDirty);
  const isSaving = useThemeBuilderStore((s) => s.isSaving);
  const lastSavedAt = useThemeBuilderStore((s) => s.lastSavedAt);
  const saveError = useThemeBuilderStore((s) => s.saveError);
  const setMeta = useThemeBuilderStore((s) => s.setMeta);
  const markSaving = useThemeBuilderStore((s) => s.markSaving);
  const markSaved = useThemeBuilderStore((s) => s.markSaved);
  const markSaveError = useThemeBuilderStore((s) => s.markSaveError);
  const editingMode = useThemeBuilderStore((s) => s.editingMode);
  const setEditingMode = useThemeBuilderStore((s) => s.setEditingMode);
  const hasDarkVariant = Boolean(tokens.palette?.dark);

  const { updateThemeAsync } = useUpdateTheme();
  const [confirmPublishOpen, setConfirmPublishOpen] = React.useState(false);
  const [confirmBackOpen, setConfirmBackOpen] = React.useState(false);
  const [localName, setLocalName] = React.useState(meta.name);

  // Keep the inline name input in sync when meta.name flips (e.g. discard).
  React.useEffect(() => {
    setLocalName(meta.name);
  }, [meta.name]);

  function commitName() {
    const next = localName.trim() || "Untitled Theme";
    if (next !== meta.name) setMeta({ name: next });
    setLocalName(next);
  }

  /**
   * Single save path used by the manual Save button AND the publish
   * dropdown items. Pass `overrideVisibility` to flip visibility as part
   * of the save (so Publish/Unpublish round-trip in one call).
   */
  async function save(overrideVisibility?: "PRIVATE" | "PUBLIC") {
    if (!isOwner) {
      toast.error("Only the owner can save changes");
      return;
    }
    markSaving();
    try {
      const result = await updateThemeAsync({
        id: themeId,
        name: meta.name,
        description: meta.description,
        category: meta.category,
        coverImageUrl: meta.coverImageUrl,
        visibility: overrideVisibility ?? meta.visibility,
        tokens,
      });
      markSaved(new Date(), {
        tokens: result.tokens,
        meta: {
          name: result.name,
          description: result.description,
          category: result.category,
          coverImageUrl: result.coverImageUrl,
          visibility: result.visibility,
        },
      });
      toast.success(
        overrideVisibility === "PUBLIC"
          ? "Theme published"
          : overrideVisibility === "PRIVATE"
            ? "Theme set to private"
            : "Theme saved",
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to save theme";
      markSaveError(message);
      toast.error(message);
    }
  }

  function handleBack() {
    if (isDirty) {
      setConfirmBackOpen(true);
      return;
    }
    router.push("/dashboard/themes");
  }

  return (
    <>
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3 sm:px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBack}
          className="size-8 shrink-0"
          aria-label="Back to themes"
        >
          <IconArrowLeft className="size-4" />
        </Button>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            disabled={!isOwner}
            maxLength={80}
            placeholder="Untitled Theme"
            className="h-8 w-auto max-w-xs border-transparent bg-transparent px-1.5 text-h4 font-medium hover:border-border focus:border-border"
          />

          <Badge
            variant={meta.visibility === "PUBLIC" ? "default" : "outline"}
            className={
              meta.visibility === "PUBLIC"
                ? "bg-success/15 text-success hover:bg-success/20"
                : ""
            }
          >
            {meta.visibility === "PUBLIC" ? "Public" : "Private"}
          </Badge>

          <SaveIndicator
            isSaving={isSaving}
            isDirty={isDirty}
            lastSavedAt={lastSavedAt}
            saveError={saveError}
          />

          {/*
            Usage caption — surfaces the blast radius of edits. Live-
            theme model: edits to this theme propagate to all consuming
            forms immediately on save, so authors know what they're
            touching. Hidden on small screens to keep the topbar
            uncluttered.
          */}
          {usageCount > 0 ? (
            <span
              className="hidden lg:inline text-body-sm text-muted-foreground truncate"
              title={`${usageCount} published form${usageCount === 1 ? "" : "s"} render this theme live. Edits here take effect on next render.`}
            >
              · Edits flow to {usageCount} published form
              {usageCount === 1 ? "" : "s"}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <EditingModeToggle
            mode={editingMode}
            onChange={setEditingMode}
            hasDarkVariant={hasDarkVariant}
          />

          <Button variant="outline" size="sm" asChild>
            <Link
              href={`/dashboard/themes/${themeId}/preview`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconEye className="size-4" />
              Preview
            </Link>
          </Button>

          {isOwner ? (
            <>
              <Button
                size="sm"
                variant="default"
                onClick={() => save()}
                loading={isSaving}
                disabled={!isDirty}
              >
                Save
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" disabled={isSaving}>
                    <IconChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => save("PRIVATE")}>
                    Save as draft (private)
                  </DropdownMenuItem>
                  {meta.visibility === "PRIVATE" ? (
                    <DropdownMenuItem
                      onClick={() => setConfirmPublishOpen(true)}
                    >
                      Publish (public)
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => save("PRIVATE")}>
                      Unpublish (private)
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      useThemeBuilderStore.getState().discard();
                      toast.success("Discarded unsaved changes");
                    }}
                    disabled={!isDirty}
                  >
                    Discard changes
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <span className="text-body-sm text-muted-foreground">View only</span>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={confirmPublishOpen}
        onOpenChange={setConfirmPublishOpen}
        title="Publish this theme?"
        description="Public themes are visible to everyone signed in. Anyone can apply your theme to their own forms; only you can edit or unpublish it."
        confirmLabel="Publish"
        onConfirm={() => save("PUBLIC")}
      />

      <ConfirmDialog
        open={confirmBackOpen}
        onOpenChange={setConfirmBackOpen}
        title="Discard unsaved changes?"
        description="You have unsaved changes. Leaving now will discard them."
        confirmLabel="Discard and leave"
        destructive
        onConfirm={() => {
          useThemeBuilderStore.getState().discard();
          router.push("/dashboard/themes");
        }}
      />
    </>
  );
}

function SaveIndicator({
  isSaving,
  isDirty,
  lastSavedAt,
  saveError,
}: {
  isSaving: boolean;
  isDirty: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;
}) {
  if (saveError) {
    return (
      <span className="text-body-sm text-destructive truncate">
        {saveError}
      </span>
    );
  }
  if (isSaving) {
    return (
      <span className="text-body-sm text-muted-foreground">Saving…</span>
    );
  }
  if (isDirty) {
    return (
      <span className="text-body-sm text-warning">Unsaved changes</span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="text-body-sm text-muted-foreground">
        Saved {formatRelativeTime(lastSavedAt)}
      </span>
    );
  }
  return null;
}

/**
 * Two-button segmented control for picking which palette the editor
 * writes into. Mirrors the device toggle's shape in the preview pane so
 * the editor reads as one consistent control language.
 *
 * Dark is always selectable — even before a dark variant exists. Switching
 * to Dark with no variant is what triggers the section-level "Add dark
 * variant" CTA; the toggle showing a small dot beside the Dark icon hints
 * that the variant is missing without blocking the click.
 */
function EditingModeToggle({
  mode,
  onChange,
  hasDarkVariant,
}: {
  mode: EditingMode;
  onChange: (m: EditingMode) => void;
  hasDarkVariant: boolean;
}) {
  const items: {
    value: EditingMode;
    label: string;
    Icon: typeof IconSun;
    missing?: boolean;
  }[] = [
    { value: "light", label: "Edit light palette", Icon: IconSun },
    {
      value: "dark",
      label: "Edit dark palette",
      Icon: IconMoon,
      missing: !hasDarkVariant,
    },
  ];
  return (
    <div
      className="inline-flex rounded-md border border-border bg-background p-0.5"
      role="group"
      aria-label="Editing mode"
    >
      {items.map(({ value, label, Icon, missing }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-label={label}
          aria-pressed={mode === value}
          className={cn(
            "relative inline-flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors",
            mode === value
              ? "bg-accent text-foreground"
              : "hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
          {missing ? (
            // Small unfilled dot in the corner — "this variant doesn't
            // exist yet". Decorative; the section CTA is the real action.
            <span
              aria-hidden
              className="pointer-events-none absolute -top-0.5 -right-0.5 size-1.5 rounded-full border border-border bg-background"
            />
          ) : null}
        </button>
      ))}
    </div>
  );
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  return date.toLocaleTimeString();
}
