"use client";

import * as React from "react";
import {
  buildFontHref,
  compileTokensToCss,
  extractFontsFromTokens,
  type ThemeTokensI,
} from "@repo/theme";

type Props = {
  /** Theme tokens (live or snapshot). Pass `null` for the system default. */
  tokens: ThemeTokensI | null;
  /**
   * CSS attribute selector that anchors every emitted rule. Defaults to
   * `[data-sf-root]`. Override only if you're rendering multiple form
   * roots in the same DOM and want them themed independently.
   */
  scope?: string;
};

/**
 * Mounts a single `<style>` tag with the compiled theme CSS plus, if the
 * theme uses non-system fonts, a `<link>` to Google Fonts.
 *
 * The compiled CSS is scoped to the `data-sf-root` attribute (or the
 * caller-provided scope), so it can never style anything outside the form.
 * React 19 hoists `<link rel="stylesheet">` and `<style>` into `<head>`
 * automatically, so this component can live anywhere in the tree.
 *
 * Renders nothing when `tokens` is null — no work, no payload.
 */
export function ThemeStyle({ tokens, scope }: Props) {
  const css = React.useMemo(
    () => (tokens ? compileTokensToCss(tokens, scope) : ""),
    [tokens, scope],
  );
  const fontHref = React.useMemo(
    () => (tokens ? buildFontHref(extractFontsFromTokens(tokens)) : null),
    [tokens],
  );

  if (!tokens) return null;

  return (
    <>
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}
      <style dangerouslySetInnerHTML={{ __html: css }} />
    </>
  );
}
