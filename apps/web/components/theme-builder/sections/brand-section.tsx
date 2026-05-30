"use client";

import * as React from "react";
import { IconAlertCircle } from "@tabler/icons-react";

import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { cn } from "~/lib/utils";
import { useThemeBuilderStore } from "../store";

/**
 * Brand section — logo URL + brand name. These live on the tokens
 * document (`tokens.brand`) so they're snapshotted into published form
 * versions alongside the rest of the look. The brand name surfaces in
 * gallery cards via the metadata section, not from here.
 */
export function BrandSection() {
  const brand = useThemeBuilderStore((s) => s.tokens.brand);
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);

  const [logoError, setLogoError] = React.useState(false);
  React.useEffect(() => {
    // Reset error state when the URL changes.
    setLogoError(false);
  }, [brand.logoUrl]);

  function patchBrand(patch: { name?: string; logoUrl?: string | undefined }) {
    setTokens((prev) => ({ ...prev, brand: { ...prev.brand, ...patch } }));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="brand-logo">Logo URL</Label>
        <div className="flex items-center gap-3">
          <Input
            id="brand-logo"
            type="url"
            placeholder="https://your.brand/logo.svg"
            value={brand.logoUrl ?? ""}
            onChange={(e) =>
              patchBrand({ logoUrl: e.target.value.trim() || undefined })
            }
            disabled={!isOwner}
          />
          <LogoPreview
            url={brand.logoUrl}
            errored={logoError}
            onError={() => setLogoError(true)}
          />
        </div>
        <p className="text-body-sm text-muted-foreground">
          HTTPS only. Recommend a square SVG or PNG at least 64&times;64.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="brand-name">Brand name</Label>
        <Input
          id="brand-name"
          maxLength={80}
          placeholder="Your brand"
          value={brand.name ?? ""}
          onChange={(e) =>
            patchBrand({ name: e.target.value.trim() || undefined })
          }
          disabled={!isOwner}
        />
        <p className="text-body-sm text-muted-foreground">
          Optional — surfaces near the form header in preview when set.
        </p>
      </div>
    </div>
  );
}

function LogoPreview({
  url,
  errored,
  onError,
}: {
  url: string | undefined;
  errored: boolean;
  onError: () => void;
}) {
  if (!url) {
    return (
      <div className="grid size-12 shrink-0 place-items-center rounded-md border border-dashed border-border text-body-sm text-muted-foreground">
        —
      </div>
    );
  }
  if (errored || !url.startsWith("https://")) {
    return (
      <div
        className={cn(
          "grid size-12 shrink-0 place-items-center rounded-md border border-destructive/40 bg-destructive/5 text-destructive",
        )}
        title="Logo failed to load or scheme is not https"
      >
        <IconAlertCircle className="size-5" />
      </div>
    );
  }
  return (
    <div className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt=""
        className="size-full object-contain"
        onError={onError}
        loading="lazy"
      />
    </div>
  );
}
