/**
 * Env drift detector.
 *
 * Verifies that env-manifest.json and the Zod schemas in code agree on
 * which environment variables exist. Catches the "I added a Zod field
 * but forgot to update the manifest" case before it boots.
 *
 * Run via:   pnpm check:env
 * Exits 1 if any drift is found (so CI / setup.sh can gate on it).
 *
 * Implementation note: rather than introspecting Zod v4 internals (which
 * change between minor versions and need to unwrap `superRefine` etc.),
 * we just read the .ts source files and regex-extract the keys defined
 * inside `z.object({ ... })`. Brittle in theory; robust in practice for
 * our controlled-style env files.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// ─── Configure which files declare envs ──────────────────────────────────

// Each entry: absolute path + a label for error messages.
const ZOD_SOURCES = [
  { path: "packages/database/env.ts", label: "database" },
  { path: "packages/services/env.ts", label: "services" },
  { path: "packages/logger/env.ts", label: "logger" },
  { path: "packages/mailer/env.ts", label: "mailer" },
  { path: "apps/api/src/env.ts", label: "api" },
];

// The web app uses @t3-oss/env-nextjs (server + client blocks). Its keys
// are explicitly listed here since the format differs from raw Zod.
const T3_SOURCES = [
  { path: "apps/web/env.js", label: "web" },
];

// ─── Extract keys from source ────────────────────────────────────────────

function extractKeysFromZodSource(src: string): string[] {
  // Our env.ts files contain exactly one `z.object({...})` declaration
  // and no other object literals. Skip depth tracking entirely — match
  // any SCREAMING_SNAKE_CASE key followed by `: z` at the start of a
  // (trimmed) line. Safe given the controlled file shape.
  const keys = new Set<string>();
  for (const raw of src.split("\n")) {
    const line = raw.trim();
    if (line.startsWith("//") || line.startsWith("*")) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*:\s*z\b/);
    if (m && m[1]) keys.add(m[1]);
  }
  return [...keys];
}

function extractKeysFromT3Source(src: string): string[] {
  // For @t3-oss/env-nextjs, fields live inside `server: { … }` and
  // `client: { … }` blocks. Same regex works because t3-env still wraps
  // Zod schemas.
  return extractKeysFromZodSource(src);
}

// ─── Aggregate keys from all sources ─────────────────────────────────────

interface SourceKey {
  key: string;
  source: string;
}

const sourceKeys: SourceKey[] = [];
for (const { path: p, label } of ZOD_SOURCES) {
  const src = readFileSync(resolve(ROOT, p), "utf8");
  for (const k of extractKeysFromZodSource(src)) {
    sourceKeys.push({ key: k, source: label });
  }
}
for (const { path: p, label } of T3_SOURCES) {
  const src = readFileSync(resolve(ROOT, p), "utf8");
  for (const k of extractKeysFromT3Source(src)) {
    sourceKeys.push({ key: k, source: label });
  }
}

// ─── Load manifest ───────────────────────────────────────────────────────

const manifest = JSON.parse(
  readFileSync(resolve(ROOT, "env-manifest.json"), "utf8"),
) as { vars: Record<string, { targets: string[] }> };

const manifestKeys = new Set(Object.keys(manifest.vars));
const sourceKeySet = new Set(sourceKeys.map((s) => s.key));

// ─── Diff ────────────────────────────────────────────────────────────────

const missingInManifest: SourceKey[] = sourceKeys.filter(
  (s) => !manifestKeys.has(s.key),
);
const missingInSource = [...manifestKeys].filter((k) => !sourceKeySet.has(k));

// Dedupe missingInManifest by key (a var declared in two schemas would
// otherwise be reported twice).
const seen = new Set<string>();
const uniqueMissing = missingInManifest.filter((s) => {
  if (seen.has(s.key)) return false;
  seen.add(s.key);
  return true;
});

// ─── Report ──────────────────────────────────────────────────────────────

let exitCode = 0;

if (uniqueMissing.length > 0) {
  console.error("✗ Declared in code but missing from env-manifest.json:");
  for (const { key, source } of uniqueMissing) {
    console.error(`    ${key.padEnd(34)}  (from ${source})`);
  }
  exitCode = 1;
}

if (missingInSource.length > 0) {
  console.error(
    `${exitCode > 0 ? "\n" : ""}✗ In env-manifest.json but unused in any Zod / t3-env schema:`,
  );
  for (const key of missingInSource) {
    console.error(`    ${key}`);
  }
  exitCode = 1;
}

if (exitCode === 0) {
  console.log(
    `✓ env-manifest.json in sync with ${sourceKeys.length} key declarations across ${ZOD_SOURCES.length + T3_SOURCES.length} sources`,
  );
}

process.exit(exitCode);
