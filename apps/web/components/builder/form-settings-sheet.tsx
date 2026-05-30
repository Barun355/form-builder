"use client";

import * as React from "react";
import { toast } from "sonner";
import { IconAlertTriangle } from "@tabler/icons-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "~/components/ui/sheet";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import { ThemePicker } from "~/components/theme-picker";
import { useSetFormTheme, useUpdateForm } from "~/hooks/form";
import type { BuilderState, FormVisibility } from "./store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: BuilderState;
};

export function FormSettingsSheet({ open, onOpenChange, state }: Props) {
  const ty = state.schema.thankYou ?? {};
  const { updateFormAsync, isPending } = useUpdateForm();
  const { mutateAsync: setFormThemeAsync, isPending: isSavingTheme } =
    useSetFormTheme();

  async function handleVisibilityChange(makePublic: boolean) {
    const next: FormVisibility = makePublic ? "PUBLIC" : "UNLISTED";
    const prev = state.visibility;
    if (next === prev) return;
    state.setVisibility(next); // optimistic
    try {
      await updateFormAsync({ id: state.formId, visibility: next });
      toast.success(
        next === "PUBLIC" ? "Form is now public" : "Form is now unlisted",
      );
    } catch (err) {
      state.setVisibility(prev);
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(`Visibility update failed: ${message}`);
    }
  }

  // Theme change is a one-shot UPDATE on `forms.theme_id` — propagates
  // to the public URL IMMEDIATELY (live-theme model). No re-publish needed,
  // no schema bundled.
  async function handleThemeChange(nextThemeId: string | null) {
    const prev = state.themeId;
    if (nextThemeId === prev) return;
    state.setThemeId(nextThemeId); // optimistic
    try {
      await setFormThemeAsync({
        id: state.formId,
        themeId: nextThemeId,
      });
      toast.success(
        nextThemeId === null
          ? "Theme detached — form will render System Default"
          : "Theme applied — live on the public URL",
      );
    } catch (err) {
      state.setThemeId(prev);
      const message =
        err instanceof Error ? err.message : "Failed to update theme";
      toast.error(`Theme update failed: ${message}`);
    }
  }

  const isPublic = state.visibility === "PUBLIC";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Form settings</SheetTitle>
          <SheetDescription>
            Customize how your form behaves and what respondents see after
            submitting.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-8 px-4 pb-8">
          <section>
            <h3 className="text-h4 text-foreground mb-3">Visibility</h3>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <Label htmlFor="visibility-public" className="cursor-pointer">
                    List on the Explore page
                  </Label>
                  <p className="text-body-sm text-muted-foreground">
                    {isPublic
                      ? "Anyone can discover this form on /explore."
                      : "Only people with the direct link can see this form."}
                  </p>
                </div>
                <Switch
                  id="visibility-public"
                  checked={isPublic}
                  disabled={isPending}
                  onCheckedChange={handleVisibilityChange}
                />
              </div>
              {isPublic ? (
                <div className="flex gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-body-sm text-warning-foreground">
                  <IconAlertTriangle className="size-4 mt-0.5 shrink-0 text-warning" />
                  <p>
                    This form is listed on the public{" "}
                    <span className="font-medium">/explore</span> page. Anyone
                    can view and submit it, and your submission count is
                    publicly visible. Switch back to Unlisted at any time.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section>
            <h3 className="text-h4 text-foreground mb-3">Appearance</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Theme</Label>
                <ThemePicker
                  value={state.themeId}
                  onChange={handleThemeChange}
                  disabled={isSavingTheme}
                />
                <p className="text-body-sm text-muted-foreground">
                  Paints the form&apos;s public URL. Theme edits flow
                  live — the public form reads the theme&apos;s current
                  tokens each render.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-h4 text-foreground mb-3">Thank you screen</h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ty-title">Title</Label>
                <Input
                  id="ty-title"
                  value={ty.title ?? ""}
                  placeholder="Thank you"
                  maxLength={200}
                  onChange={(e) =>
                    state.updateThankYou({
                      title: e.target.value || undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ty-msg">Message</Label>
                <Textarea
                  id="ty-msg"
                  rows={3}
                  value={ty.message ?? ""}
                  placeholder="Your response has been recorded."
                  maxLength={2000}
                  onChange={(e) =>
                    state.updateThankYou({
                      message: e.target.value || undefined,
                    })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="ty-another" className="cursor-pointer">
                  Show &ldquo;Submit another response&rdquo; button
                </Label>
                <Switch
                  id="ty-another"
                  checked={Boolean(ty.showSubmitAnotherButton)}
                  onCheckedChange={(v) =>
                    state.updateThankYou({
                      showSubmitAnotherButton: v ? true : undefined,
                    })
                  }
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ty-redirect">Redirect URL (optional)</Label>
                <Input
                  id="ty-redirect"
                  type="url"
                  placeholder="https://example.com/thanks"
                  value={ty.redirectUrl ?? ""}
                  onChange={(e) =>
                    state.updateThankYou({
                      redirectUrl: e.target.value || undefined,
                    })
                  }
                />
                <p className="text-body-sm text-muted-foreground">
                  Where to send respondents after they submit.
                </p>
              </div>

              {ty.redirectUrl ? (
                <div className="space-y-1.5">
                  <Label htmlFor="ty-delay">Redirect after (ms)</Label>
                  <Input
                    id="ty-delay"
                    type="number"
                    min={0}
                    max={60_000}
                    value={ty.redirectDelayMs ?? 3000}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      state.updateThankYou({
                        redirectDelayMs: Number.isFinite(n) ? n : undefined,
                      });
                    }}
                  />
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
