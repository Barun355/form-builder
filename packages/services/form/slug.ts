import { randomSuffix, slugify } from "../utils/slug";

/**
 * One-shot per-form slug generator. Slugify the title, append 4 random chars.
 * Uniqueness is per `(createdBy, slug)` at the DB level.
 */
export function generateFormSlug(title: string): string {
  return `${slugify(title, "form")}-${randomSuffix(4)}`;
}
