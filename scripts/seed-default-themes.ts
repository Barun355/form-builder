/**
 * Idempotent seed for the three house themes — System Default, Dark Studio,
 * Minimal Light — owned by a synthetic "Simple Form" system user. Public
 * themes any user can pick from the gallery on day one.
 *
 *   pnpm seed:default-themes
 *
 * Idempotency:
 *   - The system user is found-or-inserted by email.
 *   - Each preset is found-or-upserted by (createdBy, name). Tokens are
 *     refreshed on every run, so editing defaults.ts in @repo/theme and
 *     re-running this script propagates the change to the seeded rows.
 *   - Safe to run any number of times in a row.
 *
 * Why direct DB access (not the HTTP API): this script bootstraps state
 * BEFORE any user can sign in, and the upsert pattern is more honest as a
 * SQL transaction than as two HTTP calls (list + create/update). The
 * tokens come from the same @repo/theme module the runtime uses, so the
 * seed can never drift from defaults.ts.
 */

import { db, eq, and } from "@repo/database";
import { usersTable } from "@repo/database/models/user";
import { themesTable } from "@repo/database/models/theme";
import {
  defaultTokens,
  auroraTokens,
  minimalLightTokens,
  type ThemeTokensI,
} from "@repo/theme";

// ─── System user ────────────────────────────────────────────────────────
// Synthetic owner for the house themes. The salt/password are left null so
// the account cannot be used for sign-in — the only way to author content
// as this user is via this seed script. The userGlobalFormSlug is reserved
// here so a real human can't claim it later and accidentally inherit the
// house themes' apparent author chip on the gallery.

const SYSTEM_USER = {
  fullName: "Barun Tiwary",
  email: "baruntiwary620@gmail.com",
  userGlobalFormSlug: "barun-tiwary-azu5",
} as const;

// ─── Preset definitions ─────────────────────────────────────────────────
// Keep names stable — they're the dedup key for upsert. Tokens come from
// @repo/theme so any color/font edit in defaults.ts flows here on the
// next seed run.

interface PresetDef {
  name: string;
  description: string;
  category:
    | "standard"
    | "branded"
    | "event"
    | "retro"
    | "dark"
    | "high_contrast"
    | "minimal"
    | "other";
  tokens: ThemeTokensI;
}

const PRESETS: readonly PresetDef[] = [
  {
    name: "System Default",
    description:
      "The platform's default look. Clean violet primary on a near-white surface. Applied automatically when a form has no theme attached.",
    category: "standard",
    tokens: defaultTokens,
  },
  {
    name: "Aurora",
    description:
      "Showcase preset for dark-mode themes. Mode set to auto — light viewers see a soft violet-on-warm-white palette; dark viewers see violet-on-deep-indigo. Same shape, two color worlds.",
    category: "branded",
    tokens: auroraTokens,
  },
  {
    name: "Minimal Light",
    description:
      "Monochrome light theme with sharp corners and no shadows. Built for distraction-free, content-first forms.",
    category: "minimal",
    tokens: minimalLightTokens,
  },
] as const;

// ─── Main ───────────────────────────────────────────────────────────────

// Themes that used to be in the PRESETS list but were replaced. The seed
// soft-deletes any rows it still finds under the system user with these
// names, so the gallery doesn't show stale entries from previous runs.
// Idempotent: re-running is a no-op once the row is gone.
const RETIRED_NAMES: readonly string[] = ["Dark Studio"];

async function main() {
  console.log("▸ Ensuring system user exists…");
  const userId = await ensureSystemUser();
  console.log(`  ✓ ${SYSTEM_USER.email}  →  ${userId}`);

  let created = 0;
  let updated = 0;

  for (const preset of PRESETS) {
    const result = await upsertPreset(userId, preset);
    if (result === "created") created += 1;
    else updated += 1;
    console.log(`  ${result === "created" ? "+" : "↻"} ${preset.name}`);
  }

  let retired = 0;
  for (const name of RETIRED_NAMES) {
    if (await retirePreset(userId, name)) {
      retired += 1;
      console.log(`  − ${name} (retired)`);
    }
  }

  console.log("");
  console.log(
    `▸ Seed complete: ${created} created, ${updated} refreshed, ${retired} retired, ${PRESETS.length} active.`,
  );
}

async function ensureSystemUser(): Promise<string> {
  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, SYSTEM_USER.email))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(usersTable)
    .values({
      fullName: SYSTEM_USER.fullName,
      email: SYSTEM_USER.email,
      emailVerified: true,
      // salt / password left null — this account is not for sign-in.
      userGlobalFormSlug: SYSTEM_USER.userGlobalFormSlug,
      role: "admin",
    })
    .returning({ id: usersTable.id });

  if (!created) throw new Error("Failed to create system user");
  return created.id;
}

async function upsertPreset(
  ownerId: string,
  preset: PresetDef,
): Promise<"created" | "updated"> {
  const [existing] = await db
    .select({ id: themesTable.id })
    .from(themesTable)
    .where(
      and(
        eq(themesTable.createdBy, ownerId),
        eq(themesTable.name, preset.name),
        eq(themesTable.isDeleted, false),
      ),
    )
    .limit(1);

  if (existing) {
    await db
      .update(themesTable)
      .set({
        description: preset.description,
        category: preset.category,
        visibility: "PUBLIC",
        tokens: preset.tokens,
      })
      .where(eq(themesTable.id, existing.id));
    return "updated";
  }

  await db.insert(themesTable).values({
    createdBy: ownerId,
    name: preset.name,
    description: preset.description,
    category: preset.category,
    visibility: "PUBLIC",
    tokens: preset.tokens,
  });
  return "created";
}

/**
 * Soft-deletes a retired preset by name + owner. Returns true if a row
 * was actually deleted (so the seed can log it), false if nothing was
 * found (idempotent re-runs).
 */
async function retirePreset(ownerId: string, name: string): Promise<boolean> {
  const [existing] = await db
    .select({ id: themesTable.id })
    .from(themesTable)
    .where(
      and(
        eq(themesTable.createdBy, ownerId),
        eq(themesTable.name, name),
        eq(themesTable.isDeleted, false),
      ),
    )
    .limit(1);

  if (!existing) return false;

  await db
    .update(themesTable)
    .set({ isDeleted: true })
    .where(eq(themesTable.id, existing.id));
  return true;
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seed failed:", err);
    process.exit(1);
  });
