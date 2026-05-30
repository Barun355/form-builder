"use client";

import * as React from "react";
import {
  IconDeviceDesktop,
  IconDeviceMobile,
  IconDeviceTablet,
  IconExternalLink,
} from "@tabler/icons-react";
import Link from "next/link";

import { Button } from "~/components/ui/button";
import { FormRenderer } from "~/components/form-renderer";
import { ThemeStyle } from "~/components/theme-style";
import { sampleFormSchema } from "~/lib/theme-sample-form";
import { cn } from "~/lib/utils";
import { useClickToEdit } from "./click-to-edit";
import { useThemeBuilderStore, type PreviewDevice } from "./store";

/**
 * Right pane of the editor — built-in sample form rendered with the
 * current working-copy tokens. Updates on a 200ms debounce so live edits
 * feel instant without thrashing the compiler on every keystroke.
 *
 * Device toggle is pure CSS width clamping (no real emulation). The
 * "Open in new tab" link points at the standalone `/preview` route,
 * which renders the same sample form full-bleed with no editor chrome.
 */
export function ThemePreviewPane() {
  const tokens = useThemeBuilderStore((s) => s.tokens);
  const themeId = useThemeBuilderStore((s) => s.themeId);
  const previewDevice = useThemeBuilderStore((s) => s.previewDevice);
  const setPreviewDevice = useThemeBuilderStore((s) => s.setPreviewDevice);
  const editingMode = useThemeBuilderStore((s) => s.editingMode);

  // 200ms debounce on the live tokens snapshot the renderer consumes.
  // Pickers/sliders fire many updates per second; the user can't tell
  // the difference between 0ms and ~200ms, and we save a lot of work.
  const [debouncedTokens, setDebouncedTokens] = React.useState(tokens);
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedTokens(tokens), 200);
    return () => clearTimeout(t);
  }, [tokens]);

  // Click-to-edit: anywhere inside `data-sf-root`, a click on a themed
  // zone opens the matching accordion section in the controls panel.
  const previewRootRef = React.useRef<HTMLDivElement | null>(null);
  useClickToEdit(previewRootRef);

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-card px-3">
        <DeviceToggle device={previewDevice} onChange={setPreviewDevice} />

        <div className="flex items-center gap-2">
          <span className="text-caps uppercase text-muted-foreground">
            Live preview
          </span>
          <Button variant="ghost" size="sm" asChild>
            <Link
              href={`/dashboard/themes/${themeId}/preview`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <IconExternalLink className="size-4" />
              Open
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 items-start justify-center overflow-auto p-6">
        <div
          className={cn(
            "w-full overflow-hidden rounded-xl border border-border shadow-sm transition-all",
            DEVICE_WIDTH[previewDevice],
          )}
        >
          {/*
            The device-clamped container is the "screen". Inside it,
            `data-sf-root` covers the whole simulated viewport so the
            theme's page background paints behind the card — matching
            the two-layer contract from packages/theme/compile.ts. The
            min-h gives the bg something to fill on short forms.

            Mode class follows `editingMode` (NOT `tokens.mode`) — the
            preview always shows the variant the user is currently
            editing in the topbar. This decouples preview behavior from
            the publish-time default the viewer will see.
          */}
          <div
            ref={previewRootRef}
            className={cn(
              "min-h-[600px] sf-form",
              editingMode === "light" && "sf-light",
              editingMode === "dark" && "sf-dark",
            )}
            data-sf-root
          >
            <ThemeStyle tokens={debouncedTokens} />
            <div className="mx-auto w-full max-w-2xl px-6 py-12">
              <div className="sf-card">
                {/* Title header mirrors what PublicFormRenderer renders
                    around the live form. Without it the editor preview
                    has no `data-sf-heading="1"` surface, so the user
                    can't see heading-font/weight/primary changes land. */}
                {sampleFormSchema.pages[0]?.title ? (
                  <header className="mb-8">
                    <h1 data-sf-heading="1">
                      {sampleFormSchema.pages[0].title}
                    </h1>
                  </header>
                ) : null}
                <FormRenderer
                  schema={sampleFormSchema}
                  mode="preview"
                  withHoneypot={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const DEVICE_WIDTH: Record<PreviewDevice, string> = {
  desktop: "max-w-3xl",
  tablet: "max-w-xl",
  mobile: "max-w-sm",
};

function DeviceToggle({
  device,
  onChange,
}: {
  device: PreviewDevice;
  onChange: (d: PreviewDevice) => void;
}) {
  const items: { value: PreviewDevice; label: string; Icon: typeof IconDeviceDesktop }[] = [
    { value: "desktop", label: "Desktop", Icon: IconDeviceDesktop },
    { value: "tablet", label: "Tablet", Icon: IconDeviceTablet },
    { value: "mobile", label: "Mobile", Icon: IconDeviceMobile },
  ];
  return (
    <div className="inline-flex rounded-md border border-border bg-background p-0.5">
      {items.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          aria-label={label}
          aria-pressed={device === value}
          className={cn(
            "inline-flex items-center justify-center rounded p-1.5 text-muted-foreground transition-colors",
            device === value
              ? "bg-accent text-foreground"
              : "hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}
