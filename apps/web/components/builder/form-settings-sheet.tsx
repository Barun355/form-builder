"use client";

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
import type { BuilderState } from "./store";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: BuilderState;
};

export function FormSettingsSheet({ open, onOpenChange, state }: Props) {
  const ty = state.schema.thankYou ?? {};

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Form settings</SheetTitle>
          <SheetDescription>
            Customize how your form behaves and what respondents see after
            submitting.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-6">
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
