import { randomBytes } from "crypto";

/**
 * URL-safe slug from arbitrary text. Strips accents, drops non-alphanumeric
 * characters, collapses repeated hyphens. Returns `"untitled"` if the input
 * slugifies to empty (e.g. all-emoji or non-Latin input).
 *
 * Caller may pass a custom fallback (e.g. "user") if the empty-input
 * sentinel matters semantically.
 */
export function slugify(input: string, fallback = "untitled"): string {
  const slug = input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  return slug.length > 0 ? slug : fallback;
}

/**
 * Cryptographically random suffix made of [a-z0-9].
 */
export function randomSuffix(length = 4): string {
  return randomBytes(length * 2)
    .toString("base64url")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, length);
}
