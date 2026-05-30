"use client";

import * as React from "react";
import { IconCheck, IconChevronDown, IconSearch } from "@tabler/icons-react";
import { FONTS, buildFontHref, getFontEntry } from "@repo/theme";
import type { FontCategory } from "@repo/theme";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { ScrollArea } from "~/components/ui/scroll-area";
import { cn } from "~/lib/utils";

const CATEGORY_LABEL: Record<FontCategory, string> = {
  system: "System",
  sans: "Sans",
  serif: "Serif",
  mono: "Mono",
};

const CATEGORY_ORDER: readonly FontCategory[] = ["sans", "serif", "mono", "system"];

// One link to Google Fonts that loads every NON-system font in the catalog,
// so each row inside the picker renders the font name in its own face.
// React 19 dedupes by href, so opening the picker twice (or two pickers
// side by side) mounts a single shared stylesheet.
const ALL_FONTS_HREF = buildFontHref(FONTS.map((f) => f.value));

type Props = {
  /** Current font value (from `FONTS[].value`). */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Accessible label for the trigger button. */
  ariaLabel?: string;
};

/**
 * Searchable font picker used in the Typography section. Trigger shows
 * the current font name in its own face. The popover loads the full
 * preview catalog on first open so every row renders in its own family.
 *
 * Filtering is plain client-side substring match on the value — the
 * catalog is ~20 items, no need for fuzzy search or virtualization.
 */
export function FontPicker({ value, onChange, disabled, ariaLabel }: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const current = getFontEntry(value);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return FONTS.filter((f) => !q || f.value.toLowerCase().includes(q));
  }, [query]);

  // Group filtered entries by category, preserving CATEGORY_ORDER.
  const grouped = React.useMemo(() => {
    const groups: Record<FontCategory, typeof FONTS> = {
      system: [],
      sans: [],
      serif: [],
      mono: [],
    };
    for (const f of filtered) {
      // Type-safe push via mutable cast — `FONTS` is readonly but each
      // category bucket holds the same element shape.
      (groups[f.category] as FontEntry[]).push(f);
    }
    return CATEGORY_ORDER
      .map((cat) => ({ cat, items: groups[cat] }))
      .filter((g) => g.items.length > 0);
  }, [filtered]);

  return (
    <>
      {/* Load all preview fonts when the popover is or has been open.
          Keep mounted after first open so reopening is instant. */}
      {open && ALL_FONTS_HREF ? (
        <link rel="stylesheet" href={ALL_FONTS_HREF} />
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-label={ariaLabel ?? `Pick font (current: ${current.value})`}
            className="w-full justify-between font-normal"
          >
            <span
              className="truncate text-left"
              style={{ fontFamily: current.stack }}
            >
              {current.value}
            </span>
            <IconChevronDown className="size-4 shrink-0 text-muted-foreground" />
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-72 p-0" align="start">
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <IconSearch className="size-4 shrink-0 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search fonts"
              className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
              autoFocus
            />
          </div>

          <ScrollArea className="max-h-72">
            <div className="flex flex-col py-1">
              {grouped.length === 0 ? (
                <p className="px-3 py-4 text-body-sm text-muted-foreground">
                  No fonts match &ldquo;{query}&rdquo;
                </p>
              ) : (
                grouped.map(({ cat, items }) => (
                  <div key={cat} className="flex flex-col">
                    <p className="px-3 pt-2 pb-1 text-caps uppercase text-muted-foreground">
                      {CATEGORY_LABEL[cat]}
                    </p>
                    {items.map((f) => {
                      const isCurrent = f.value === value;
                      return (
                        <button
                          key={f.value}
                          type="button"
                          onClick={() => {
                            onChange(f.value);
                            setOpen(false);
                          }}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 text-left text-body hover:bg-accent",
                            isCurrent && "bg-accent",
                          )}
                          style={{ fontFamily: f.stack }}
                        >
                          <span className="truncate">{f.value}</span>
                          {isCurrent ? (
                            <IconCheck className="size-4 shrink-0 text-primary" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </>
  );
}

// Local re-import of the type so the helper can cast through it without
// pulling the whole `FontEntry` type into the public surface here.
type FontEntry = (typeof FONTS)[number];
