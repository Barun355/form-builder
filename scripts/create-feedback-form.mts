/**
 * One-shot: create the early-access feedback form on production, then
 * write the resulting public URL into apps/web/lib/feedback-form-url.ts.
 *
 * Usage:
 *   pnpm tsx scripts/create-feedback-form.mts
 *
 * Env overrides:
 *   API_BASE    — default https://back-form.dosomething.qzz.io/api
 *   APP_BASE    — default https://simple-form.dosomething.qzz.io
 *   SEED_EMAIL  — default baruntiwary620@gmail.com
 *   SEED_PASSWORD
 */

import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// REST/OpenAPI mirror, NOT the tRPC native protocol. The tRPC native
// endpoint at /trpc speaks a wrapped wire format with batching that's
// awkward to hit from a raw fetch. The /api mount exposes plain JSON
// POST/GET endpoints — same routes, simpler shape.
const API_BASE =
  process.env.API_BASE ?? "http://localhost:8000/api";
const APP_BASE =
  process.env.APP_BASE ?? "http://localhost:3000";
const EMAIL = process.env.SEED_EMAIL ?? "baruntiwary620@gmail.com";
const PASSWORD = process.env.SEED_PASSWORD ?? "12345678";

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGET_FILE = resolve(__dirname, "../apps/web/lib/feedback-form-url.ts");

// ─── HTTP helper ─────────────────────────────────────────────────────────

let cookies = "";

async function api<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (cookies) headers.set("Cookie", cookies);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookies = setCookie.split(";")[0] ?? cookies;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${path}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

// ─── Form schema ─────────────────────────────────────────────────────────

const TITLE = "Help shape Simple Form's paid plans";
const DESCRIPTION =
  "Tell us what you'd pay for — we'll reach out the moment paid tiers launch.";

const SCHEMA = {
  pages: [
    {
      id: "p1",
      title: "Early access",
      order: 0,
      sectionIds: ["s1", "s2"],
    },
  ],
  sections: [
    {
      id: "s1",
      title: "About you",
      order: 0,
      pageId: "p1",
      fieldIds: ["plan", "use_case", "email"],
    },
    {
      id: "s2",
      title: "Your needs",
      order: 1,
      pageId: "p1",
      fieldIds: ["nps", "features", "missing", "fair_price", "anything_else"],
    },
  ],
  fields: [
    {
      id: "plan",
      type: "select",
      name: "plan_interest",
      label: "Which plan are you interested in?",
      order: 0,
      sectionId: "s1",
      required: true,
      options: [
        { id: "o-pro", label: "Pro", value: "pro" },
        { id: "o-biz", label: "Business", value: "business" },
        { id: "o-cur", label: "Just curious", value: "curious" },
      ],
    },
    {
      id: "use_case",
      type: "radio",
      name: "use_case",
      label: "What's your use case?",
      order: 1,
      sectionId: "s1",
      required: true,
      options: [
        { id: "u-indie", label: "Indie maker", value: "indie" },
        { id: "u-small", label: "Small team", value: "small" },
        { id: "u-mid", label: "Mid-market", value: "mid" },
        { id: "u-ent", label: "Enterprise", value: "enterprise" },
      ],
    },
    {
      id: "email",
      type: "email",
      name: "email",
      label: "Email for early-access notification",
      order: 2,
      sectionId: "s1",
      required: true,
      placeholder: "you@example.com",
    },
    {
      id: "nps",
      type: "radio",
      name: "nps",
      label: "How likely are you to recommend Simple Form? (0 = not at all, 10 = absolutely)",
      order: 0,
      sectionId: "s2",
      options: Array.from({ length: 11 }, (_, i) => ({
        id: `nps-${i}`,
        label: String(i),
        value: String(i),
      })),
    },
    {
      id: "features",
      type: "checkbox",
      name: "features",
      label: "Which features matter most?",
      order: 1,
      sectionId: "s2",
      options: [
        { id: "f-unlimited", label: "Unlimited submissions", value: "unlimited_submissions" },
        { id: "f-branding", label: "Remove Simple Form branding", value: "remove_branding" },
        { id: "f-team", label: "Team workspaces", value: "team" },
        { id: "f-api", label: "API & webhooks", value: "api" },
        { id: "f-domains", label: "Custom domains", value: "custom_domains" },
        { id: "f-sso", label: "SSO (SAML / OIDC)", value: "sso" },
        { id: "f-analytics", label: "Advanced analytics", value: "analytics" },
      ],
    },
    {
      id: "missing",
      type: "textarea",
      name: "missing",
      label: "What's missing from the Free tier that would make you upgrade?",
      order: 2,
      sectionId: "s2",
      placeholder: "Anything specific that's blocking you...",
    },
    {
      id: "fair_price",
      type: "text",
      name: "fair_price",
      label: "What price would feel fair for your team's usage? ($/mo)",
      order: 3,
      sectionId: "s2",
      placeholder: "e.g. $25/mo",
    },
    {
      id: "anything_else",
      type: "textarea",
      name: "anything_else",
      label: "Anything else?",
      order: 4,
      sectionId: "s2",
    },
  ],
  thankYou: {
    title: "Thanks — we'll be in touch",
    message:
      "We'll reach out the moment paid tiers launch. Your input shapes what we ship.",
  },
};

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`▸ API base: ${API_BASE}`);
  console.log(`▸ App base: ${APP_BASE}`);
  console.log(`▸ Logging in as ${EMAIL}…`);
  await api("/authentication/loginUserWithEmailAndPassword", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });

  console.log("▸ Fetching user slug…");
  const me = (await api("/authentication/getCurrentUserDetails")) as {
    userGlobalFormSlug: string;
  };

  console.log("▸ Creating form…");
  const form = (await api("/form/createForm", {
    method: "POST",
    body: JSON.stringify({ title: TITLE, description: DESCRIPTION }),
  })) as { id: string; slug: string };

  console.log(`  id=${form.id} slug=${form.slug}`);

  console.log("▸ Saving draft schema…");
  await api("/form-versions/saveDraft", {
    method: "POST",
    body: JSON.stringify({ formId: form.id, schema: SCHEMA }),
  });

  console.log("▸ Publishing form…");
  await api("/form/publishForm", {
    method: "POST",
    body: JSON.stringify({ id: form.id }),
  });

  const publicUrl = `${APP_BASE}/u/${me.userGlobalFormSlug}/${form.slug}`;
  console.log(`✓ Public URL: ${publicUrl}`);

  console.log(`▸ Writing to ${TARGET_FILE}…`);
  const fileContent = `/**
 * Public URL of the Simple Form feedback form — used by the early-access
 * dialog on the pricing page and by the PlanLockedFallback component
 * shown to Free users on gated routes.
 *
 * Generated by scripts/create-feedback-form.mts at ${new Date().toISOString()}.
 * Re-run that script and the constant below will be overwritten.
 */
export const FEEDBACK_FORM_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL ??
  ${JSON.stringify(publicUrl)};
`;
  await writeFile(TARGET_FILE, fileContent, "utf8");

  console.log("✓ Done. Restart `pnpm dev` to pick up the new URL.");
}

main().catch((err) => {
  console.error("✗ Failed:", err);
  process.exit(1);
});
