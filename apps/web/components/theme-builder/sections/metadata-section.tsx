"use client";

import { IconAlertTriangle } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Switch } from "~/components/ui/switch";
import { useThemeBuilderStore } from "../store";
import type { ThemeCategory, ThemeMode } from "@repo/theme";

/**
 * Metadata section — name (mirrors the topbar title), description,
 * category, cover image URL, visibility. These map 1:1 onto the columns
 * of the themes row; tokens are untouched.
 */
export function MetadataSection() {
  const meta = useThemeBuilderStore((s) => s.meta);
  const setMeta = useThemeBuilderStore((s) => s.setMeta);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);
  const mode = useThemeBuilderStore((s) => s.tokens.mode);
  const hasDarkVariant = useThemeBuilderStore(
    (s) => Boolean(s.tokens.palette?.dark),
  );
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const addDarkVariant = useThemeBuilderStore((s) => s.addDarkVariant);

  function setMode(next: ThemeMode) {
    setTokens((prev) => ({ ...prev, mode: next }));
  }

  // Selections that depend on a dark palette to actually do anything for
  // viewers. "dark" forces dark — falls back to light if there's nothing
  // to force. "auto" follows OS — without a dark variant the @media block
  // isn't emitted, so OS-dark viewers still see light. Either way, the
  // user probably meant to add a dark variant first.
  const needsDarkVariant = (mode === "dark" || mode === "auto") && !hasDarkVariant;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="meta-name">Name</Label>
        <Input
          id="meta-name"
          maxLength={80}
          value={meta.name}
          onChange={(e) => setMeta({ name: e.target.value })}
          disabled={!isOwner}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="meta-description">Description</Label>
        <Textarea
          id="meta-description"
          maxLength={255}
          rows={2}
          placeholder="What's this theme for? Who's it good for?"
          value={meta.description ?? ""}
          onChange={(e) =>
            setMeta({
              description: e.target.value.trim() === "" ? null : e.target.value,
            })
          }
          disabled={!isOwner}
        />
        <p className="text-body-sm text-muted-foreground">
          Shown on the theme card. Max 255 characters.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="meta-category">Category</Label>
        <Select
          value={meta.category}
          onValueChange={(v) => setMeta({ category: v as ThemeCategory })}
          disabled={!isOwner}
        >
          <SelectTrigger id="meta-category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="standard">Standard</SelectItem>
            <SelectItem value="branded">Branded</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="retro">Retro</SelectItem>
            <SelectItem value="dark">Dark</SelectItem>
            <SelectItem value="high_contrast">High contrast</SelectItem>
            <SelectItem value="minimal">Minimal</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="meta-cover">Cover image URL</Label>
        <Input
          id="meta-cover"
          type="url"
          placeholder="https://…/cover.png (optional)"
          value={meta.coverImageUrl ?? ""}
          onChange={(e) =>
            setMeta({
              coverImageUrl: e.target.value.trim() === "" ? null : e.target.value,
            })
          }
          disabled={!isOwner}
        />
        <p className="text-body-sm text-muted-foreground">
          16:9 looks best. If empty, a procedural swatch is generated from
          the theme&apos;s id.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="meta-mode">Default mode</Label>
        <Select
          value={mode}
          onValueChange={(v) => setMode(v as ThemeMode)}
          disabled={!isOwner}
        >
          <SelectTrigger id="meta-mode">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">Light only</SelectItem>
            <SelectItem value="dark">Dark only</SelectItem>
            <SelectItem value="auto">Follow viewer&apos;s OS (auto)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-body-sm text-muted-foreground">
          Controls how the public form renders for viewers.{" "}
          <strong className="font-medium text-foreground">Light</strong>{" "}
          forces light,{" "}
          <strong className="font-medium text-foreground">Dark</strong>{" "}
          forces dark,{" "}
          <strong className="font-medium text-foreground">Auto</strong>{" "}
          swaps based on the viewer&apos;s OS preference.
        </p>

        {needsDarkVariant ? (
          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/10 px-3 py-2.5">
            <IconAlertTriangle className="size-4 shrink-0 text-warning mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-foreground">
                {mode === "dark"
                  ? "Dark only without a dark palette will render the light palette to every viewer — the renderer falls back when there's nothing to force."
                  : "Auto without a dark palette can't swap for OS-dark viewers — they'll see the light palette."}
              </p>
              {isOwner ? (
                <Button
                  variant="link"
                  size="sm"
                  onClick={addDarkVariant}
                  className="h-auto p-0 mt-1 text-warning hover:text-warning"
                >
                  Add dark variant (clones from light)
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-3">
        <div className="min-w-0">
          <p className="text-body font-medium text-foreground">
            {meta.visibility === "PUBLIC" ? "Public" : "Private"}
          </p>
          <p className="text-body-sm text-muted-foreground">
            {meta.visibility === "PUBLIC"
              ? "Visible to everyone signed in."
              : "Visible only to you."}
          </p>
        </div>
        <Switch
          checked={meta.visibility === "PUBLIC"}
          onCheckedChange={(checked) =>
            setMeta({ visibility: checked ? "PUBLIC" : "PRIVATE" })
          }
          disabled={!isOwner}
          aria-label="Toggle visibility"
        />
      </div>
    </div>
  );
}
