"use client";

import * as React from "react";

import { useThemeBuilderStore } from "./store";

// Order matters here — it's the resolution priority. Closer-to-the-click
// (more specific) wins. `closest()` walks up the tree and stops at the
// first match, so we iterate selectors from MOST specific (submit button,
// individual input) to LEAST (form card, page background).
//
// Map: data-attribute selector → controls-panel accordion value.
const ZONE_MAP: readonly { selector: string; section: string }[] = [
  { selector: "[data-sf-submit]",              section: "buttons" },
  { selector: "[data-sf-required-mark]",       section: "colors" },
  { selector: "[data-sf-field-input]",         section: "inputs" },
  { selector: "[data-sf-field-label]",         section: "typography" },
  { selector: "[data-sf-field]",               section: "inputs" },
  { selector: "[data-sf-section-description]", section: "typography" },
  { selector: "[data-sf-heading]",             section: "typography" },
  { selector: "[data-sf-section]",             section: "typography" },
  { selector: ".sf-card",                      section: "surfaces" },
  { selector: "[data-sf-root]",                section: "background" },
];

// Combined matcher used by `closest()` — the union of all zone selectors.
// We rely on closest()'s tree walk to find the nearest ancestor that
// matches ANY of them, then disambiguate by checking each selector in
// priority order to pick the right section. This is two passes but the
// list is small and clicks aren't hot-path.
const COMBINED_SELECTOR = ZONE_MAP.map((z) => z.selector).join(", ");

// Zones that look bad with an outline (huge surfaces). For these we
// still open the matching section but skip the visual outline — the
// section opening IS the feedback.
const NO_OUTLINE_SELECTORS = new Set([".sf-card", "[data-sf-root]"]);

const HIGHLIGHT_DURATION_MS = 600;

function matchSection(el: Element): { match: Element; selector: string; section: string } | null {
  for (const zone of ZONE_MAP) {
    if (el.matches(zone.selector)) {
      return { match: el, selector: zone.selector, section: zone.section };
    }
  }
  return null;
}

/**
 * Attaches a click listener to the preview pane root. On click, walks up
 * the DOM from the event target to find the nearest themed zone, opens
 * the matching accordion section in the controls panel, and briefly
 * outlines the clicked zone for visual feedback (~600 ms).
 *
 * The accordion opens via the shared store (`selectedSection`); the
 * controls panel reads it as the Accordion's controlled `value` and
 * scrolls the matching item into view.
 *
 * Clicks that don't land in a known zone are no-ops. Native interactions
 * (focusing inputs, toggling checkboxes) are NOT prevented — the preview
 * stays interactive so the author can test the form.
 */
export function useClickToEdit(
  rootRef: React.RefObject<HTMLElement | null>,
): void {
  const setSelectedSection = useThemeBuilderStore((s) => s.setSelectedSection);
  // Track the currently-outlined element so we can clear its outline if a
  // new click lands on something else before the timeout fires.
  const lastHighlightedRef = React.useRef<HTMLElement | null>(null);
  const highlightTimerRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function handleClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target) return;
      const matched = target.closest(COMBINED_SELECTOR);
      if (!matched) return;
      const resolved = matchSection(matched);
      if (!resolved) return;

      setSelectedSection(resolved.section);

      if (!NO_OUTLINE_SELECTORS.has(resolved.selector)) {
        highlight(resolved.match as HTMLElement, lastHighlightedRef, highlightTimerRef);
      } else if (lastHighlightedRef.current) {
        // Clicking a no-outline zone after a previously highlighted one
        // should still clear the old outline immediately.
        clearOutline(lastHighlightedRef.current);
        lastHighlightedRef.current = null;
      }
    }

    root.addEventListener("click", handleClick);
    return () => {
      root.removeEventListener("click", handleClick);
      // If the preview unmounts mid-highlight, clear the outline + timer.
      if (highlightTimerRef.current !== null) {
        window.clearTimeout(highlightTimerRef.current);
        highlightTimerRef.current = null;
      }
      if (lastHighlightedRef.current) {
        clearOutline(lastHighlightedRef.current);
        lastHighlightedRef.current = null;
      }
    };
  }, [rootRef, setSelectedSection]);
}

function highlight(
  el: HTMLElement,
  lastRef: React.MutableRefObject<HTMLElement | null>,
  timerRef: React.MutableRefObject<number | null>,
): void {
  // Cancel any in-flight highlight so the user doesn't see flashing.
  if (timerRef.current !== null) {
    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }
  if (lastRef.current && lastRef.current !== el) {
    clearOutline(lastRef.current);
  }

  lastRef.current = el;
  el.style.outline = "2px solid var(--sf-color-primary)";
  el.style.outlineOffset = "2px";

  timerRef.current = window.setTimeout(() => {
    timerRef.current = null;
    if (lastRef.current === el) {
      clearOutline(el);
      lastRef.current = null;
    }
  }, HIGHLIGHT_DURATION_MS);
}

function clearOutline(el: HTMLElement): void {
  el.style.outline = "";
  el.style.outlineOffset = "";
}
