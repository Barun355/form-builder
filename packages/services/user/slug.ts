import { slugify, randomSuffix } from "../utils/slug";

export { slugify, randomSuffix };

/**
 * One-shot per-user slug generator. Combines slugify + random suffix.
 * Per locked decision: no retry on collision — the unique constraint
 * surfaces the (extremely unlikely) collision as an INSERT error.
 */
export function generateUserGlobalFormSlug(fullName: string): string {
  return `${slugify(fullName, "user")}-${randomSuffix(4)}`;
}
