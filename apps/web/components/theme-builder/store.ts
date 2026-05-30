"use client";

import { create } from "zustand";
import type {
  ThemeTokensI,
  ThemeCategory,
  ThemeVisibility,
} from "@repo/theme";

export type PreviewDevice = "desktop" | "tablet" | "mobile";

/**
 * Which palette the editor is currently writing into. NOT the same as
 * `tokens.mode` — `tokens.mode` is the published default (light/dark/auto,
 * what end viewers see); `editingMode` is a UI-only concern that routes
 * section writes between `palette.light` and `palette.dark`.
 *
 * "auto" is intentionally absent: there is no "auto" palette to edit.
 */
export type EditingMode = "light" | "dark";

export type ThemeMeta = {
  name: string;
  description: string | null;
  category: ThemeCategory;
  coverImageUrl: string | null;
  visibility: ThemeVisibility;
};

export type ThemeBuilderState = {
  // Identity
  themeId: string;
  isOwner: boolean;
  createdByName: string | null;

  // Working copy — what the user is editing.
  tokens: ThemeTokensI;
  meta: ThemeMeta;

  // Pristine baseline — what was last loaded from the server. Used to
  // compute `isDirty` and to support a Discard action.
  initialTokens: ThemeTokensI;
  initialMeta: ThemeMeta;

  // Save state
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;

  // Preview
  previewDevice: PreviewDevice;

  // Which palette color-bearing sections currently read/write. Resets to
  // "light" on every load.
  editingMode: EditingMode;

  // Which left-panel accordion item is currently expanded. Mirrors the
  // `value` of Radix's single-select Accordion. Driven by both direct
  // user clicks on accordion headers AND by the click-to-edit hook,
  // which maps clicks on themed preview zones to the matching section.
  // `null` means all sections collapsed.
  selectedSection: string | null;

  // Actions
  load: (input: {
    themeId: string;
    isOwner: boolean;
    createdByName: string | null;
    tokens: ThemeTokensI;
    meta: ThemeMeta;
  }) => void;
  setTokens: (updater: (prev: ThemeTokensI) => ThemeTokensI) => void;
  setMeta: (patch: Partial<ThemeMeta>) => void;
  markSaving: () => void;
  markSaved: (at: Date, fresh: { tokens: ThemeTokensI; meta: ThemeMeta }) => void;
  markSaveError: (message: string) => void;
  discard: () => void;
  setPreviewDevice: (device: PreviewDevice) => void;
  setEditingMode: (mode: EditingMode) => void;
  setSelectedSection: (value: string | null) => void;

  /**
   * Clone `palette.light` into `palette.dark` so the user can edit a dark
   * variant. No-op if `palette.dark` already exists. Marks the working
   * copy dirty.
   */
  addDarkVariant: () => void;

  /**
   * Drop `palette.dark` and flip editing back to light. Used when the
   * user wants the theme to be light-only again. No-op if there is no
   * dark variant.
   */
  removeDarkVariant: () => void;
};

// ─── Placeholder values ─────────────────────────────────────────────────
// Used at module load before `load()` hydrates the store with the real
// theme. Declared HERE (above the `create()` call) so they're outside the
// TDZ when zustand evaluates the initial state — moving them below would
// crash module init with "Cannot access 'PLACEHOLDER_TOKENS' before
// initialization".

const PLACEHOLDER_TOKENS = {} as ThemeTokensI;
const PLACEHOLDER_META: ThemeMeta = {
  name: "",
  description: null,
  category: "standard",
  coverImageUrl: null,
  visibility: "PRIVATE",
};

/**
 * `dirty` is derived from a structural compare on every set. We keep
 * baselines (`initialTokens`/`initialMeta`) so a Save can compare what
 * actually changed AND a Discard can roll back without re-fetching.
 *
 * The store is a plain singleton — only one editor mounts at a time. If
 * we ever need parallel editors, swap to a per-instance React context
 * around `createStore` like the form builder will eventually.
 */
export const useThemeBuilderStore = create<ThemeBuilderState>((set, get) => ({
  themeId: "",
  isOwner: false,
  createdByName: null,
  tokens: PLACEHOLDER_TOKENS,
  meta: PLACEHOLDER_META,
  initialTokens: PLACEHOLDER_TOKENS,
  initialMeta: PLACEHOLDER_META,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  saveError: null,
  previewDevice: "desktop",
  editingMode: "light",
  selectedSection: "colors",

  load: ({ themeId, isOwner, createdByName, tokens, meta }) => {
    set({
      themeId,
      isOwner,
      createdByName,
      tokens,
      meta,
      initialTokens: tokens,
      initialMeta: meta,
      isDirty: false,
      isSaving: false,
      lastSavedAt: null,
      saveError: null,
      editingMode: "light",
      selectedSection: "colors",
    });
  },

  setTokens: (updater) => {
    const { tokens, initialTokens, meta, initialMeta } = get();
    const next = updater(tokens);
    set({
      tokens: next,
      isDirty: !shallowEqualTokens(next, initialTokens) || !shallowEqualMeta(meta, initialMeta),
    });
  },

  setMeta: (patch) => {
    const { tokens, initialTokens, meta, initialMeta } = get();
    const next = { ...meta, ...patch };
    set({
      meta: next,
      isDirty: !shallowEqualMeta(next, initialMeta) || !shallowEqualTokens(tokens, initialTokens),
    });
  },

  markSaving: () => set({ isSaving: true, saveError: null }),

  markSaved: (at, fresh) =>
    set({
      isSaving: false,
      isDirty: false,
      lastSavedAt: at,
      saveError: null,
      tokens: fresh.tokens,
      meta: fresh.meta,
      initialTokens: fresh.tokens,
      initialMeta: fresh.meta,
    }),

  markSaveError: (message) => set({ isSaving: false, saveError: message }),

  discard: () => {
    const { initialTokens, initialMeta } = get();
    set({
      tokens: initialTokens,
      meta: initialMeta,
      isDirty: false,
      saveError: null,
    });
  },

  setPreviewDevice: (device) => set({ previewDevice: device }),

  setEditingMode: (mode) => set({ editingMode: mode }),

  setSelectedSection: (value) => set({ selectedSection: value }),

  addDarkVariant: () => {
    const { tokens, initialTokens, meta, initialMeta } = get();
    if (tokens.palette.dark) return;
    // Deep clone so subsequent edits to dark don't leak back into light.
    // Palette is a plain JSON shape — JSON round-trip is the cheapest
    // correct clone here and runs once per "Add dark variant" click.
    const dark = JSON.parse(JSON.stringify(tokens.palette.light));
    // Auto-bump light → auto. Adding a dark variant on a light-only theme
    // almost always means "I want viewers in dark mode to see the dark
    // palette," NOT "I want a dark palette that nobody sees." Without
    // this, the user adds dark, sees it in the editor preview (driven by
    // editingMode), publishes, and is surprised viewers still see light
    // because the renderer reads `mode`. Dark / auto themes are left
    // alone — they already opted into a non-light viewer behavior.
    const nextMode = tokens.mode === "light" ? "auto" : tokens.mode;
    const next: ThemeTokensI = {
      ...tokens,
      mode: nextMode,
      palette: { ...tokens.palette, dark },
    };
    set({
      tokens: next,
      isDirty:
        !shallowEqualTokens(next, initialTokens) ||
        !shallowEqualMeta(meta, initialMeta),
    });
  },

  removeDarkVariant: () => {
    const { tokens, initialTokens, meta, initialMeta } = get();
    if (!tokens.palette.dark) return;
    // Strip `dark` while keeping `light`. Spread-then-delete keeps the
    // surrounding shape immutable; the next render sees a fresh palette.
    const nextPalette = { ...tokens.palette };
    delete nextPalette.dark;
    // Snap mode="dark" → "light" because dark with no dark palette is
    // contradictory (renderer would fall back to light anyway). Auto is
    // left alone — auto+light-only is a degenerate but legal state
    // ("follow OS, but I only have light to show either way").
    const nextMode = tokens.mode === "dark" ? "light" : tokens.mode;
    const next: ThemeTokensI = {
      ...tokens,
      mode: nextMode,
      palette: nextPalette,
    };
    set({
      tokens: next,
      editingMode: "light",
      isDirty:
        !shallowEqualTokens(next, initialTokens) ||
        !shallowEqualMeta(meta, initialMeta),
    });
  },
}));

// ─── Helpers ────────────────────────────────────────────────────────────

// Cheap shallow JSON compare. Tokens and meta are bounded shapes; the
// cost is negligible compared to a render cycle.
function shallowEqualTokens(a: ThemeTokensI, b: ThemeTokensI): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function shallowEqualMeta(a: ThemeMeta, b: ThemeMeta): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
