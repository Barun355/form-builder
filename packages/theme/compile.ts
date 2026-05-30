import type {
  ThemeTokensI,
  PaddingPreset,
  ShadowIntensity,
  TypeScale,
  Density,
  InputStyleTokens,
  ButtonStyleTokens,
  InputColorTokens,
  ColorPalette,
  BackgroundTokens,
} from "./types";
import { getFontStack } from "./fonts";

// ─── Token → CSS compiler ───────────────────────────────────────────────
// Pure function: tokens in, CSS string out. Every selector emitted is
// prefixed with the scope selector so themes can NEVER style anything
// outside the form root. Unit test in compile.test.ts enforces this
// invariant — any new emission must respect it.
//
// EVERY COLORED VALUE FLOWS THROUGH A CSS CUSTOM PROPERTY. The root
// `[data-sf-root]` rule declares the full set of `--sf-*` variables;
// element rules below reference them via `var(--sf-…)`. Inline hex
// values appear ONLY for per-field overrides (which target one field
// type and don't participate in the dark-mode swap).
//
// This shape exists so PR B (dark-mode variants) can drop an
// `@media (prefers-color-scheme: dark) { [data-sf-root] { --sf-color-…: dark.…; } }`
// block — and every consuming element rule picks up the new value with
// no further edits. Non-colored properties (radius, padding, shadow,
// font, border-width) stay inline because they don't differ per mode.
//
// ─── DOM CONTRACT — TWO LAYERS ──────────────────────────────────────────
// Consumers MUST render two nested elements for the theme to paint
// correctly:
//
//   <div data-sf-root>          ← gets PAGE background
//                                  (solid/gradient/image from tokens.background)
//     <div class="sf-card">     ← gets SURFACE styling
//                                  (colors.surface, surfaces.cardRadius/Shadow/borderWidth)
//       ...form chrome + fields...
//     </div>
//   </div>
//
// If you collapse the two into one element, the surface styling targets
// nothing and the page background paints whatever shape the merged div
// happens to have — usually a constrained card instead of the full page.
// See public-form-renderer.tsx, theme-preview-pane.tsx, and the standalone
// /preview route for the canonical structure.

const DEFAULT_SCOPE = "[data-sf-root]";

const SHADOWS: Record<ShadowIntensity, string> = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0,0,0,0.05)",
  md: "0 4px 6px -1px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.06)",
  lg: "0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.06)",
};

const PADDINGS: Record<PaddingPreset, string> = {
  snug: "6px 10px",
  comfortable: "10px 14px",
  spacious: "14px 20px",
};

const TYPE_SCALES: Record<TypeScale, { h1: string; h2: string; body: string }> = {
  sm: { h1: "1.5rem", h2: "1.25rem", body: "0.875rem" },
  md: { h1: "1.75rem", h2: "1.375rem", body: "1rem" },
  lg: { h1: "2rem", h2: "1.5rem", body: "1.125rem" },
};

const DENSITY_GAPS: Record<Density, string> = {
  compact: "12px",
  regular: "20px",
  comfortable: "28px",
};

const BG_POSITION: Record<NonNullable<Extract<BackgroundTokens, { type: "image" }>["position"]>, string> = {
  "top-left": "top left",
  top: "top center",
  "top-right": "top right",
  left: "center left",
  center: "center center",
  right: "center right",
  "bottom-left": "bottom left",
  bottom: "bottom center",
  "bottom-right": "bottom right",
};

/**
 * Build the form-root background declaration value. Returns the CSS
 * value, not a property — caller stuffs it into a CSS variable that the
 * root rule's `background:` reads.
 */
function backgroundValue(bg: BackgroundTokens): string {
  if (bg.type === "solid") return bg.color;
  if (bg.type === "gradient") {
    return `linear-gradient(${bg.angle}deg, ${bg.from}, ${bg.to})`;
  }
  // image
  const safeUrl = JSON.stringify(bg.url); // quote + escape for url(...)
  const layers: string[] = [];
  if (bg.overlay) {
    const c = bg.overlay.color;
    const op = Math.max(0, Math.min(1, bg.overlay.opacity));
    layers.push(`linear-gradient(${withAlpha(c, op)}, ${withAlpha(c, op)})`);
  }
  layers.push(`url(${safeUrl})`);
  return layers.join(", ");
}

/** Hex `#rrggbb` + alpha 0..1 → `rgba(r,g,b,a)`. Hex-with-alpha passes through. */
function withAlpha(hex: string, alpha: number): string {
  const v = hex.replace("#", "");
  if (v.length < 6) return hex;
  const r = parseInt(v.slice(0, 2), 16);
  const g = parseInt(v.slice(2, 4), 16);
  const b = parseInt(v.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(3)})`;
}

function rules(scope: string, body: string): string {
  return `${scope} { ${body} }\n`;
}

function selector(scope: string, suffix: string, body: string): string {
  return `${scope} ${suffix} { ${body} }\n`;
}

/**
 * The full set of CSS custom-property declarations for ONE palette
 * variant. Single source of truth for "which colored values become
 * variables". The dark-mode override blocks (`.sf-dark` and the auto-mode
 * `@media (prefers-color-scheme: dark)`) re-emit the same keys with the
 * dark palette's values — every consuming rule picks up the swap with
 * no further edits.
 *
 * NOTE on `--sf-bg-size` / `--sf-bg-position`: they exist as variables
 * (not inline on the root) so the dark variant can swap them when its
 * background type differs (e.g. light=solid, dark=image). Non-image
 * backgrounds set `auto` / `0 0` defaults which CSS ignores.
 */
function declarePaletteVariables(palette: ColorPalette): string[] {
  const { colors, buttons, inputs, background } = palette;
  // Image-only properties — honor `fit` (cover/contain) and the named
  // position. Solid/gradient backgrounds set harmless defaults that CSS
  // ignores for non-image backgrounds.
  const bgSize = background.type === "image" ? background.fit : "auto";
  const bgPosition =
    background.type === "image" ? BG_POSITION[background.position] : "0 0";
  return [
    // Semantic colors — the core palette every element rule reads from.
    `--sf-color-background: ${colors.background};`,
    `--sf-color-surface: ${colors.surface};`,
    `--sf-color-foreground: ${colors.foreground};`,
    `--sf-color-muted-foreground: ${colors.mutedForeground};`,
    `--sf-color-primary: ${colors.primary};`,
    `--sf-color-primary-foreground: ${colors.primaryForeground};`,
    // Soft-tinted primary for focus rings, selection highlights, etc.
    // Auto-derived (no editor surface) so changing Primary in the Colors
    // panel automatically refreshes the ring without a separate control.
    // The 20% alpha is a tuned value — visible but not distracting.
    `--sf-color-primary-soft: ${withAlpha(colors.primary, 0.2)};`,
    `--sf-color-accent: ${colors.accent};`,
    `--sf-color-border: ${colors.border};`,
    `--sf-color-error: ${colors.error};`,
    `--sf-color-success: ${colors.success};`,

    // Input-specific colors — values that have no clean semantic
    // equivalent OR that pair naturally with the input chrome rather
    // than the surface chrome:
    //
    //   --sf-input-bg     — input fill (often distinct from card
    //                       surface; common pattern: white inputs on a
    //                       dark card).
    //   --sf-input-text   — text the user types into the input. Paired
    //                       with input-bg, NOT with surface foreground.
    //                       Without this, dark-themed forms with white
    //                       inputs would show light foreground on white
    //                       input → invisible text the moment the user
    //                       types. (See color-fix.md §2b.)
    //
    // Per-component button colors + the rest of the per-component input
    // colors (border, focus border, helper, error) intentionally aren't
    // declared here — the semantic palette drives them directly.
    `--sf-input-bg: ${inputs.backgroundColor};`,
    `--sf-input-text: ${inputs.textColor};`,

    // Page background — full CSS background shorthand value plus the
    // size+position pair (vars so the dark variant can swap them).
    `--sf-page-bg: ${backgroundValue(background)};`,
    `--sf-bg-size: ${bgSize};`,
    `--sf-bg-position: ${bgPosition};`,
  ];
}

/**
 * Pick which palette variant lights up the base block. For `mode: "light"`
 * (the default) or `mode: "auto"` it's `palette.light`. For `mode: "dark"`
 * with a dark palette, the dark palette becomes the base — light viewers
 * still see dark because the theme forced it.
 */
function basePaletteFor(tokens: ThemeTokensI): ColorPalette {
  if (tokens.mode === "dark" && tokens.palette.dark) return tokens.palette.dark;
  return tokens.palette.light;
}

/**
 * Build the input element rule body using CSS variables. Used for the
 * base `[data-sf-field-input]` rule. Per-field overrides use their own
 * inline-value emitter below — they don't participate in the dark-mode
 * variable swap.
 *
 * Color sourcing:
 *   - background: `--sf-input-bg`     (input-specific; no semantic equivalent)
 *   - text:       `--sf-input-text`   (paired with --sf-input-bg, NOT with
 *                                      semantic foreground — see color-fix
 *                                      docs §2b for why)
 *   - border:     `--sf-color-border` (semantic — same as card border)
 *   - focus border + ring: see baseInputFocusBody
 */
function baseInputBody(inputStyle: InputStyleTokens): string {
  return [
    `background: var(--sf-input-bg);`,
    `color: var(--sf-input-text);`,
    `border: ${inputStyle.borderWidth}px solid var(--sf-color-border);`,
    `border-radius: ${inputStyle.borderRadius}px;`,
    `padding: ${PADDINGS[inputStyle.padding]};`,
    `font: inherit;`,
    `width: 100%;`,
    `box-sizing: border-box;`,
    `transition: border-color 0.15s ease, box-shadow 0.15s ease;`,
  ].join(" ");
}

function baseInputFocusBody(): string {
  // Focus border = semantic primary; focus ring = `--sf-color-primary-soft`
  // (auto-derived from primary at 20% alpha in declarePaletteVariables).
  // Both flow from the same Primary picker in the Colors panel — no
  // separate ring control.
  return [
    `border-color: var(--sf-color-primary);`,
    `box-shadow: 0 0 0 3px var(--sf-color-primary-soft);`,
    `outline: none;`,
  ].join(" ");
}

/**
 * Per-field override rule body. Emits inline values for ONLY the
 * color properties present on the partial override; other properties
 * fall through the cascade to the base `[data-sf-field-input]` rule.
 *
 * Doesn't reference CSS variables on purpose — per-field overrides are
 * intentionally a hard, single-mode override. If you want to override
 * just the `email` field's background in dark mode separately, that's
 * a v1.x feature (see implementation plan §5e).
 */
function inputOverrideBody(override: Partial<InputColorTokens>): string {
  const parts: string[] = [];
  if (override.backgroundColor !== undefined) parts.push(`background: ${override.backgroundColor};`);
  if (override.textColor !== undefined) parts.push(`color: ${override.textColor};`);
  if (override.borderColor !== undefined) parts.push(`border-color: ${override.borderColor};`);
  return parts.join(" ");
}

function inputOverrideFocusBody(override: Partial<InputColorTokens>): string {
  const parts: string[] = [];
  if (override.focusBorderColor !== undefined) parts.push(`border-color: ${override.focusBorderColor};`);
  if (override.focusRingColor !== undefined) parts.push(`box-shadow: 0 0 0 3px ${override.focusRingColor};`);
  return parts.join(" ");
}

/**
 * Submit button rule body. Takes the SHARED button shape; colors flow
 * through SEMANTIC palette variables so the Primary / On-primary / Accent
 * rows in the Colors panel actually drive the button:
 *
 *   - background        → `--sf-color-primary`
 *   - text              → `--sf-color-primary-foreground`
 *   - hover background  → `--sf-color-accent`  (in `buttonHoverBody`)
 *
 * Per-component `palette.buttons.*` colors are intentionally not consumed
 * here; semantic primary/on-primary/accent are the single source of truth
 * for button look. The palette.buttons fields stay in the schema as
 * forward-compat for a future per-component override layer.
 */
function buttonBody(buttonStyle: ButtonStyleTokens): string {
  return [
    `background: var(--sf-color-primary);`,
    `color: var(--sf-color-primary-foreground);`,
    `border: none;`,
    `border-radius: var(--sf-radius-button);`,
    `padding: ${PADDINGS[buttonStyle.padding]};`,
    `box-shadow: var(--sf-shadow-button);`,
    `font-weight: 600;`,
    `cursor: pointer;`,
    `transition: filter 0.15s ease, transform 0.05s ease;`,
  ].join(" ");
}

function buttonHoverBody(): string {
  // Hover background = semantic accent. Pairs with the row description
  // "Accent — Hover backgrounds, subtle accents." When the user wants the
  // hover to feel like a darkened primary, they set accent ≈ primary; for
  // distinct hover states they pick a contrasting accent.
  return `background: var(--sf-color-accent);`;
}

/**
 * Compile tokens to scoped CSS. All output is anchored under `scope`.
 *
 * @param tokens - the theme token document
 * @param scope - the CSS selector that anchors EVERY emitted rule (default `[data-sf-root]`)
 */
export function compileTokensToCss(
  tokens: ThemeTokensI,
  scope: string = DEFAULT_SCOPE,
): string {
  const out: string[] = [];
  const { typography, surfaces, buttonStyle, inputStyle, spacing, perField } = tokens;
  const scales = TYPE_SCALES[typography.scale];

  // Pick the palette that lights up the base block. Light/auto → light;
  // dark → dark (the theme forces dark regardless of OS). The override
  // blocks emitted further down let class-based or @media swaps reroute
  // the variables without retouching any consuming rule.
  const basePalette = basePaletteFor(tokens);

  // Root: declare all `--sf-*` variables + the small set of non-color
  // values that stay inline (typography, density-derived gap, etc.).
  const rootBody = [
    ...declarePaletteVariables(basePalette),
    `--sf-radius-card: ${surfaces.cardRadius}px;`,
    `--sf-radius-button: ${buttonStyle.borderRadius}px;`,
    `--sf-radius-input: ${inputStyle.borderRadius}px;`,
    `--sf-shadow-card: ${SHADOWS[surfaces.cardShadow]};`,
    `--sf-shadow-button: ${SHADOWS[buttonStyle.shadow]};`,
    `--sf-gap: ${DENSITY_GAPS[spacing]};`,
    `background: var(--sf-page-bg);`,
    `background-size: var(--sf-bg-size);`,
    `background-position: var(--sf-bg-position);`,
    `color: var(--sf-color-foreground);`,
    `font-family: ${getFontStack(typography.bodyFamily)};`,
    `font-size: ${scales.body};`,
    `line-height: 1.55;`,
    typography.letterSpacing != null ? `letter-spacing: ${typography.letterSpacing}em;` : "",
  ].filter(Boolean).join(" ");

  out.push(rules(scope, rootBody));

  // ─── Dark-mode override blocks ────────────────────────────────────────
  // When the theme has a `palette.dark` we emit BOTH:
  //   1. `.sf-light` / `.sf-dark` class overrides — explicit, class-based
  //      forcing. The editor preview pane sets the class to preview a
  //      specific variant; an embedding host can set it for app-wide
  //      light/dark control.
  //   2. (auto only) `@media (prefers-color-scheme: dark)` — when the
  //      theme defaults to following the OS, the dark vars swap in
  //      without JS.
  //
  // Class selectors (specificity 0,2,0) outrank the bare root (0,1,0) AND
  // anything inside the @media block (also 0,1,0 — @media doesn't change
  // specificity), so `.sf-light` reliably forces light even when the OS
  // prefers dark and an auto-mode @media block is in the stylesheet.
  //
  // Light-only themes emit none of these — the base block is the only
  // truth and the form paints one way only.
  if (tokens.palette.dark) {
    const lightVars = declarePaletteVariables(tokens.palette.light).join(" ");
    const darkVars = declarePaletteVariables(tokens.palette.dark).join(" ");

    out.push(rules(`${scope}.sf-light`, lightVars));
    out.push(rules(`${scope}.sf-dark`, darkVars));

    if (tokens.mode === "auto") {
      out.push(`@media (prefers-color-scheme: dark) { ${scope} { ${darkVars} } }\n`);
    }
  }

  // Headings — attribute-based so the rule fires regardless of the
  // underlying tag (form titles render as <h1>, section titles render
  // as <h3> today; both carry data-sf-heading=<level>). Element-based
  // h1/h2 rules used to miss section titles entirely because the
  // renderer doesn't emit h2.
  //
  //   data-sf-heading="1" — top-level (form title). Tinted with semantic
  //                         --sf-color-primary so it pops against body text.
  //   data-sf-heading="2" — sub-headings (section titles). Uses semantic
  //                         foreground EXPLICITLY (not via cascade) so the
  //                         Tailwind `text-foreground` class on the
  //                         renderer's h3 element can't beat us on
  //                         specificity. (See color-fix.md §2a.)
  const headingWeight = typography.headingWeight ?? 600;
  out.push(
    selector(
      scope,
      `[data-sf-heading="1"]`,
      `font-family: ${getFontStack(typography.headingFamily)}; font-size: ${scales.h1}; font-weight: ${headingWeight}; line-height: 1.2; margin: 0 0 0.5em; color: var(--sf-color-primary);`,
    ),
  );
  out.push(
    selector(
      scope,
      `[data-sf-heading="2"]`,
      `font-family: ${getFontStack(typography.headingFamily)}; font-size: ${scales.h2}; font-weight: ${headingWeight}; line-height: 1.25; margin: 0 0 0.5em; color: var(--sf-color-foreground);`,
    ),
  );

  // Form card surface (wraps the fields list).
  out.push(selector(scope, `.sf-card`, `background: var(--sf-color-surface); border: ${surfaces.borderWidth}px solid var(--sf-color-border); border-radius: var(--sf-radius-card); box-shadow: var(--sf-shadow-card); padding: var(--sf-gap);`));

  // Section spacing.
  out.push(selector(scope, `[data-sf-section]`, `margin-bottom: var(--sf-gap);`));

  // Section description — uses the SEMANTIC muted-foreground (not the
  // input-specific helper color). This wires up `--sf-color-muted-foreground`
  // which was previously declared but never consumed.
  out.push(
    selector(
      scope,
      `[data-sf-section-description]`,
      `color: var(--sf-color-muted-foreground); font-size: 0.9em; margin: 0 0 var(--sf-gap);`,
    ),
  );

  // Fields list rhythm.
  out.push(selector(scope, `[data-sf-field]`, `margin-bottom: var(--sf-gap);`));

  // Labels.
  out.push(selector(scope, `[data-sf-field-label]`, `display: block; font-weight: 500; color: var(--sf-color-foreground); margin-bottom: 6px; font-size: 0.95em;`));

  // Required-field marker (the asterisk next to required field labels).
  // Wires the semantic `--sf-color-error` to a visible element so the
  // Error row in the Colors panel actually does something. Field-level
  // error text still uses `--sf-input-error` for fine-grained control.
  out.push(
    selector(
      scope,
      `[data-sf-required-mark]`,
      `color: var(--sf-color-error); margin-left: 2px; font-weight: 600;`,
    ),
  );

  // Helpers and errors — both routed to semantic vars so the Colors panel
  // rows (Muted text, Error) drive them. Per-component
  // `palette.inputs.helperColor` / `errorColor` are intentionally not
  // consumed; semantic is the single source of truth.
  out.push(
    selector(
      scope,
      `[data-sf-field-helper]`,
      `color: var(--sf-color-muted-foreground); font-size: 0.85em; margin-top: 4px;`,
    ),
  );
  out.push(
    selector(
      scope,
      `[data-sf-field-error]`,
      `color: var(--sf-color-error); font-size: 0.85em; margin-top: 4px;`,
    ),
  );

  // Inputs (the global rule). Targets the input element inside the wrapper.
  out.push(selector(scope, `[data-sf-field-input]`, baseInputBody(inputStyle)));
  out.push(selector(scope, `[data-sf-field-input]:focus, [data-sf-field-input]:focus-within`, baseInputFocusBody()));

  // Submit button.
  out.push(selector(scope, `[data-sf-submit]`, buttonBody(buttonStyle)));
  out.push(selector(scope, `[data-sf-submit]:hover`, buttonHoverBody()));
  out.push(selector(scope, `[data-sf-submit]:active`, `transform: translateY(1px);`));

  // Per-field overrides. Inline values — they don't participate in the
  // dark-mode variable swap (see implementation plan §5e).
  for (const [fieldType, override] of Object.entries(perField)) {
    if (!override || Object.keys(override).length === 0) continue;
    const body = inputOverrideBody(override);
    if (body) {
      out.push(selector(
        scope,
        `[data-sf-field="${fieldType}"] [data-sf-field-input]`,
        body,
      ));
    }
    const focusBody = inputOverrideFocusBody(override);
    if (focusBody) {
      out.push(selector(
        scope,
        `[data-sf-field="${fieldType}"] [data-sf-field-input]:focus, [data-sf-field="${fieldType}"] [data-sf-field-input]:focus-within`,
        focusBody,
      ));
    }
  }

  return out.join("");
}

/** Field families a compiled theme references, for font preloading. */
export function extractFontsFromTokens(tokens: ThemeTokensI): string[] {
  return [tokens.typography.headingFamily, tokens.typography.bodyFamily];
}
