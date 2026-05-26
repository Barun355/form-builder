/**
 * UTM-tagged public-URL helpers for the share dialog.
 *
 * Scheme mirrors pulse-board exactly: utm_source + utm_medium only (no
 * utm_campaign). That keeps the analytics view consistent across products
 * and avoids attribution-suffix clutter in the share menu.
 */

export type SharePlatformKey = "twitter" | "linkedin" | "whatsapp" | "email";

export type SharePlatform = {
  key: SharePlatformKey;
  name: string;
  source: string; // utm_source
  medium: string; // utm_medium
};

export const SHARE_PLATFORMS: readonly SharePlatform[] = [
  { key: "twitter", name: "Twitter / X", source: "twitter", medium: "social" },
  { key: "linkedin", name: "LinkedIn", source: "linkedin", medium: "social" },
  { key: "whatsapp", name: "WhatsApp", source: "whatsapp", medium: "messaging" },
  { key: "email", name: "Email", source: "email", medium: "newsletter" },
] as const;

export function buildFormPublicUrl(args: {
  origin: string;
  userSlug: string;
  formSlug: string;
}): string {
  const { origin, userSlug, formSlug } = args;
  return `${origin.replace(/\/$/, "")}/u/${userSlug}/${formSlug}`;
}

export function buildShareUrl(baseUrl: string, platform: SharePlatform): string {
  const sep = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${sep}utm_source=${platform.source}&utm_medium=${platform.medium}`;
}
