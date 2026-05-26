"use client";

import * as React from "react";

import { cn } from "~/lib/utils";

type Size = "hero" | "medium" | "wide";
type IconTone = "filled" | "ghost";

export function FeatureCard({
  size = "medium",
  icon,
  iconTone = "filled",
  title,
  description,
  visual,
  tinted,
  className,
}: {
  size?: Size;
  icon?: React.ReactNode;
  /** "filled" = primary-tinted tile (the brand anchor). "ghost" = icon only,
       no tile — use for supporting cells to avoid repetitive icon tiles. */
  iconTone?: IconTone;
  title: string;
  description: string;
  visual?: React.ReactNode;
  tinted?: boolean;
  className?: string;
}) {
  // Spotlight cursor: write x/y CSS vars on the card so a child element
  // can render a radial gradient that follows the cursor. Per research,
  // the one "extra" Linear / Resend / Cal.com still ship in 2026.
  // Implemented as plain DOM mutation (no React state) — runs at 60fps,
  // doesn't trigger re-renders.
  const ref = React.useRef<HTMLDivElement>(null);
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--spot-x", `${e.clientX - r.left}px`);
    el.style.setProperty("--spot-y", `${e.clientY - r.top}px`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border transition-all duration-200 ease-out",
        "hover:border-primary/30 hover:shadow-md",
        tinted ? "bg-primary/4" : "bg-card",
        size === "hero" ? "p-8 sm:p-10" : "p-6",
        className,
      )}
    >
      {/* Spotlight layer — fades in on hover, follows cursor via CSS vars.
          Uses theme-aware --spotlight token so the glow reads as "visible
          but subtle" against both white and dark card surfaces. Tighter
          radius (320px vs the old 400px) gives the glow a defined focal
          point instead of a diffuse wash. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(320px circle at var(--spot-x, 50%) var(--spot-y, 50%), var(--spotlight), transparent 65%)",
        }}
      />

      <div className="relative flex flex-col h-full gap-5">
        {/* Header — fixed-ish height so the visual zone is predictable */}
        <div className="flex-none">
          {icon && (
            <div
              className={cn(
                "flex items-center justify-center mb-4",
                iconTone === "filled"
                  ? "h-10 w-10 rounded-lg bg-primary/10 text-primary"
                  : "h-10 w-10 text-muted-foreground -ml-1",
              )}
            >
              {icon}
            </div>
          )}
          <h3
            className={cn(
              "text-foreground",
              size === "hero" ? "text-h2" : "text-h3",
            )}
          >
            {title}
          </h3>
          <p className="mt-2 text-body text-muted-foreground max-w-md">
            {description}
          </p>
        </div>

        {/* Visual zone.
            - Hero (2x2 spanning, ~860px tall on md+): visual STRETCHES to
              fill the slot via `[&>*]:h-full`. Otherwise the fixed-height
              canvas would float at the bottom with empty space above.
            - Other cells: visual is bottom-anchored at its intrinsic
              height — `overflow-hidden` clips any overflow at the top edge. */}
        {visual && (size === "hero" ? (
          <div
            className={cn(
              "relative flex-1 min-h-0 -mx-6 -mb-6 sm:-mx-10 sm:-mb-10",
              "flex *:h-full *:w-full",
            )}
          >
            {visual}
          </div>
        ) : (
          <div className="relative flex-1 min-h-0 -mx-6 -mb-6 overflow-hidden">
            <div className="absolute inset-x-6 bottom-0">{visual}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
