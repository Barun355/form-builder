/**
 * Email-safe mirror of the app's Aurora design system.
 *
 * Why a separate file: the app uses OKLCH (e.g. `oklch(0.55 0.22 280)`) which
 * email clients across the board do not support — Outlook, Gmail Web,
 * older Apple Mail will all silently fail to render the color. So we
 * hex-pin every token here. Values are visual matches to the OKLCH defs
 * in `apps/web/app/globals.css` (light mode), rounded to email-friendly
 * sRGB.
 *
 * A few intentional drifts from the in-app palette:
 *  - `background` is `#fafafa`, not `#ffffff` — pure white triggers the
 *    most aggressive auto-inversion in Gmail/Outlook dark mode. Off-white
 *    is left alone by all major clients.
 *  - `foreground` is `#1a1a1a`, not `#000000` — same reason.
 *  - `card` stays `#ffffff` so the content surface still pops against
 *    the off-white outer canvas.
 *
 * Numbers (space, radius, fontSize) are integers — fractional pixels
 * render inconsistently across the Outlook Word engine.
 */

export const emailTheme = {
  color: {
    background: "#fafafa",
    card: "#ffffff",
    foreground: "#1a1a1a",
    mutedForeground: "#74707a",
    primary: "#6c47d6",
    primaryForeground: "#ffffff",
    primarySoft: "#efeafa",
    primaryBorder: "#dccff5",
    border: "#e8e6ea",
    subtleBg: "#f4f3f6",
  },
  space: {
    xs: 8,
    sm: 12,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
  radius: {
    sm: 6,
    md: 8,
    lg: 12,
  },
  font: {
    family:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    size: {
      caption: 12,
      body: 15,
      h2: 18,
      h1: 22,
      eyebrow: 11,
    },
    weight: {
      regular: 400,
      medium: 500,
      semibold: 600,
    },
    lineHeight: {
      tight: 1.3,
      normal: 1.55,
    },
  },
  width: {
    container: 600,
  },
} as const;
