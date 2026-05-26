/**
 * Seeds three demo forms via the public HTTP API.
 *
 * Run:   pnpm tsx scripts/seed-demo-forms.mts
 *
 * Behaviour:
 * - Creates (or signs in to) a dedicated seed user: seed@formcraft.test
 * - Creates 3 forms as drafts
 * - Saves a versioned schema (pages → sections → fields) for each
 * - Prints the created form IDs / slugs at the end
 *
 * The seed user is separate from your real account on purpose. Sign in as
 *   email:    seed@formcraft.test
 *   password: test12345678
 * to see the forms in the dashboard.
 */

const API_BASE = process.env.API_BASE ?? "http://localhost:8000/api";

const SEED_USER = {
  fullName: "Barun Tiwary",
  email: "baruntiwary620@gmail.com",
  password: "12345678",
};

let cookieHeader = "";

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (cookieHeader) headers.set("Cookie", cookieHeader);

  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    // Keep just `name=value` for each Set-Cookie header
    const cookies = setCookie
      .split(/,(?=\s*\w+=)/)
      .map((c) => c.split(";")[0]?.trim())
      .filter(Boolean);
    cookieHeader = cookies.join("; ");
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status} ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

async function ensureUser() {
  try {
    const { id } = await api<{ id: string }>(
      "/authentication/createUserWithEmailAndPassword",
      { method: "POST", body: JSON.stringify(SEED_USER) },
    );
    console.log(`Created seed user (id: ${id})`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (!message.includes("already exists")) {
      throw err;
    }
    // Already exists — log in instead
    await api<{ id: string }>(
      "/authentication/loginUserWithEmailAndPassword",
      {
        method: "POST",
        body: JSON.stringify({
          email: SEED_USER.email,
          password: SEED_USER.password,
        }),
      },
    );
    console.log(`Signed in as existing seed user`);
  }
}

type CreatedForm = {
  id: string;
  title: string;
  slug: string;
  status: "draft" | "published" | "archived" | "closed";
};

async function createForm(title: string, description: string) {
  return api<CreatedForm>("/form/createForm", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  });
}

async function saveDraft(formId: string, schema: unknown) {
  return api<unknown>("/form-versions/saveDraft", {
    method: "POST",
    body: JSON.stringify({ formId, schema }),
  });
}

// ─── Schema helpers ─────────────────────────────────────────────────────────

type Field = {
  id: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "email"
    | "phone"
    | "select"
    | "checkbox"
    | "radio"
    | "date"
    | "datetime"
    | "file";
  name: string;
  label: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  order: number;
  sectionId: string;
  options?: { id: string; label: string; value: string }[];
};

function page(
  id: string,
  title: string,
  order: number,
  sectionIds: string[],
  description?: string,
) {
  return { id, title, order, sectionIds, ...(description && { description }) };
}

function section(
  id: string,
  title: string,
  order: number,
  pageId: string,
  fieldIds: string[],
  description?: string,
) {
  return {
    id,
    title,
    order,
    pageId,
    fieldIds,
    ...(description && { description }),
  };
}

function field(spec: Field) {
  return spec;
}

// ─── Form 1: Tech-product customer feedback ─────────────────────────────────

const techProductSchema = {
  pages: [
    page("p1", "Your experience", 0, ["s1", "s2"]),
    page("p2", "Recommend us", 1, ["s3"]),
  ],
  sections: [
    section(
      "s1",
      "About you",
      0,
      "p1",
      ["f1", "f2"],
      "We won't share your contact info.",
    ),
    section("s2", "Product feedback", 1, "p1", ["f3", "f4", "f5", "f6"]),
    section("s3", "Would you recommend us?", 0, "p2", ["f7", "f8"]),
  ],
  fields: [
    field({
      id: "f1",
      type: "text",
      name: "full_name",
      label: "Your name",
      placeholder: "Jane Doe",
      required: true,
      order: 0,
      sectionId: "s1",
    }),
    field({
      id: "f2",
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "you@example.com",
      required: true,
      order: 1,
      sectionId: "s1",
    }),
    field({
      id: "f3",
      type: "select",
      name: "product",
      label: "Which product did you buy?",
      required: true,
      order: 0,
      sectionId: "s2",
      options: [
        { id: "o1", label: "Laptop", value: "laptop" },
        { id: "o2", label: "Phone", value: "phone" },
        { id: "o3", label: "Tablet", value: "tablet" },
        { id: "o4", label: "Smart watch", value: "watch" },
      ],
    }),
    field({
      id: "f4",
      type: "radio",
      name: "rating",
      label: "Overall rating",
      required: true,
      order: 1,
      sectionId: "s2",
      options: [
        { id: "r1", label: "1 — Poor", value: "1" },
        { id: "r2", label: "2 — Fair", value: "2" },
        { id: "r3", label: "3 — Good", value: "3" },
        { id: "r4", label: "4 — Very good", value: "4" },
        { id: "r5", label: "5 — Excellent", value: "5" },
      ],
    }),
    field({
      id: "f5",
      type: "checkbox",
      name: "loved_features",
      label: "What did you love? (pick any)",
      order: 2,
      sectionId: "s2",
      options: [
        { id: "l1", label: "Design", value: "design" },
        { id: "l2", label: "Performance", value: "performance" },
        { id: "l3", label: "Battery life", value: "battery" },
        { id: "l4", label: "Camera", value: "camera" },
        { id: "l5", label: "Build quality", value: "build_quality" },
      ],
    }),
    field({
      id: "f6",
      type: "textarea",
      name: "issues",
      label: "Anything you didn't love?",
      placeholder: "Describe any problems you ran into...",
      order: 3,
      sectionId: "s2",
    }),
    field({
      id: "f7",
      type: "radio",
      name: "recommend",
      label: "Would you recommend this product to a friend?",
      required: true,
      order: 0,
      sectionId: "s3",
      options: [
        { id: "y", label: "Yes, definitely", value: "yes" },
        { id: "m", label: "Maybe", value: "maybe" },
        { id: "n", label: "No", value: "no" },
      ],
    }),
    field({
      id: "f8",
      type: "textarea",
      name: "why",
      label: "Tell us why",
      placeholder: "Your reasoning helps us improve.",
      order: 1,
      sectionId: "s3",
    }),
  ],
};

// ─── Form 2: Form-builder product review ────────────────────────────────────

const formBuilderSchema = {
  pages: [
    page("p1", "About you & your usage", 0, ["s1", "s2"]),
    page("p2", "Your feedback", 1, ["s3"]),
  ],
  sections: [
    section("s1", "About you", 0, "p1", ["f1", "f2", "f3"]),
    section("s2", "Your usage", 1, "p1", ["f4", "f5"]),
    section("s3", "Overall experience", 0, "p2", ["f6", "f7", "f8", "f9"]),
  ],
  fields: [
    field({
      id: "f1",
      type: "text",
      name: "name",
      label: "Your name",
      order: 0,
      sectionId: "s1",
      required: true,
    }),
    field({
      id: "f2",
      type: "email",
      name: "email",
      label: "Work email",
      order: 1,
      sectionId: "s1",
      required: true,
    }),
    field({
      id: "f3",
      type: "select",
      name: "role",
      label: "Your role",
      order: 2,
      sectionId: "s1",
      options: [
        { id: "ro1", label: "Founder / CEO", value: "founder" },
        { id: "ro2", label: "Designer", value: "designer" },
        { id: "ro3", label: "Developer", value: "developer" },
        { id: "ro4", label: "Marketer", value: "marketer" },
        { id: "ro5", label: "Other", value: "other" },
      ],
    }),
    field({
      id: "f4",
      type: "number",
      name: "forms_created",
      label: "How many forms have you created with FormCraft?",
      order: 0,
      sectionId: "s2",
    }),
    field({
      id: "f5",
      type: "number",
      name: "submissions_received",
      label: "Roughly how many submissions have those forms received?",
      order: 1,
      sectionId: "s2",
    }),
    field({
      id: "f6",
      type: "radio",
      name: "overall_rating",
      label: "Overall, how would you rate FormCraft?",
      required: true,
      order: 0,
      sectionId: "s3",
      options: [
        { id: "r1", label: "★ 1", value: "1" },
        { id: "r2", label: "★ 2", value: "2" },
        { id: "r3", label: "★ 3", value: "3" },
        { id: "r4", label: "★ 4", value: "4" },
        { id: "r5", label: "★ 5", value: "5" },
      ],
    }),
    field({
      id: "f7",
      type: "select",
      name: "loved_feature",
      label: "Which feature do you love the most?",
      order: 1,
      sectionId: "s3",
      options: [
        { id: "lf1", label: "Drag-and-drop builder", value: "builder" },
        { id: "lf2", label: "Version history", value: "versions" },
        { id: "lf3", label: "Analytics", value: "analytics" },
        { id: "lf4", label: "Themes & branding", value: "themes" },
        { id: "lf5", label: "Integrations", value: "integrations" },
      ],
    }),
    field({
      id: "f8",
      type: "textarea",
      name: "missing_feature",
      label: "What's missing that you'd love to see?",
      order: 2,
      sectionId: "s3",
      placeholder: "We're listening.",
    }),
    field({
      id: "f9",
      type: "radio",
      name: "continue_using",
      label: "Will you keep using FormCraft over the next 3 months?",
      required: true,
      order: 3,
      sectionId: "s3",
      options: [
        { id: "c1", label: "Yes", value: "yes" },
        { id: "c2", label: "Probably", value: "probably" },
        { id: "c3", label: "Not sure", value: "unsure" },
        { id: "c4", label: "No", value: "no" },
      ],
    }),
  ],
};

// ─── Form 3: Healthcare patient feedback ────────────────────────────────────

const healthcareSchema = {
  pages: [
    page("p1", "Your details", 0, ["s1"]),
    page("p2", "Your visit", 1, ["s2", "s3"]),
  ],
  sections: [
    section("s1", "Personal information", 0, "p1", ["f1", "f2", "f3", "f4"]),
    section("s2", "Visit details", 0, "p2", ["f5", "f6", "f7", "f8"]),
    section("s3", "Outcome", 1, "p2", ["f9", "f10", "f11"]),
  ],
  fields: [
    field({
      id: "f1",
      type: "text",
      name: "full_name",
      label: "Full name",
      required: true,
      order: 0,
      sectionId: "s1",
    }),
    field({
      id: "f2",
      type: "number",
      name: "age",
      label: "Age",
      order: 1,
      sectionId: "s1",
    }),
    field({
      id: "f3",
      type: "email",
      name: "email",
      label: "Email",
      order: 2,
      sectionId: "s1",
    }),
    field({
      id: "f4",
      type: "phone",
      name: "phone",
      label: "Phone number",
      order: 3,
      sectionId: "s1",
    }),
    field({
      id: "f5",
      type: "date",
      name: "visit_date",
      label: "Date of your visit",
      required: true,
      order: 0,
      sectionId: "s2",
    }),
    field({
      id: "f6",
      type: "select",
      name: "service_type",
      label: "What service did you receive?",
      required: true,
      order: 1,
      sectionId: "s2",
      options: [
        { id: "st1", label: "Consultation", value: "consultation" },
        { id: "st2", label: "Treatment", value: "treatment" },
        { id: "st3", label: "Surgery", value: "surgery" },
        { id: "st4", label: "Routine check-up", value: "checkup" },
        { id: "st5", label: "Telehealth", value: "telehealth" },
      ],
    }),
    field({
      id: "f7",
      type: "radio",
      name: "provider_courtesy",
      label: "How would you rate the courtesy of your provider?",
      required: true,
      order: 2,
      sectionId: "s2",
      options: [
        { id: "pc1", label: "1 — Poor", value: "1" },
        { id: "pc2", label: "2 — Fair", value: "2" },
        { id: "pc3", label: "3 — Good", value: "3" },
        { id: "pc4", label: "4 — Very good", value: "4" },
        { id: "pc5", label: "5 — Excellent", value: "5" },
      ],
    }),
    field({
      id: "f8",
      type: "radio",
      name: "wait_time_acceptable",
      label: "Was your wait time acceptable?",
      order: 3,
      sectionId: "s2",
      options: [
        { id: "wt1", label: "Yes", value: "yes" },
        { id: "wt2", label: "No", value: "no" },
      ],
    }),
    field({
      id: "f9",
      type: "radio",
      name: "issue_resolved",
      label: "Was your concern resolved during the visit?",
      required: true,
      order: 0,
      sectionId: "s3",
      options: [
        { id: "ir1", label: "Fully", value: "fully" },
        { id: "ir2", label: "Partially", value: "partially" },
        { id: "ir3", label: "Not really", value: "not_really" },
      ],
    }),
    field({
      id: "f10",
      type: "radio",
      name: "recommend",
      label: "Would you recommend us to others?",
      required: true,
      order: 1,
      sectionId: "s3",
      options: [
        { id: "r1", label: "Yes", value: "yes" },
        { id: "r2", label: "Maybe", value: "maybe" },
        { id: "r3", label: "No", value: "no" },
      ],
    }),
    field({
      id: "f11",
      type: "textarea",
      name: "comments",
      label: "Any other comments?",
      placeholder: "Tell us anything else we should know.",
      order: 2,
      sectionId: "s3",
    }),
  ],
};

// ─── Run ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding via ${API_BASE}\n`);
  await ensureUser();

  const targets = [
    {
      title: "Customer Feedback — Tech Product",
      description:
        "Tell us what worked, what didn't, and what we should build next.",
      schema: techProductSchema,
    },
    {
      title: "Customer Review — FormCraft",
      description: "Help us shape the next version of FormCraft.",
      schema: formBuilderSchema,
    },
    {
      title: "Patient Feedback — Care Services",
      description: "Your feedback helps us deliver better patient care.",
      schema: healthcareSchema,
    },
  ];

  for (const t of targets) {
    const form = await createForm(t.title, t.description);
    await saveDraft(form.id, t.schema);
    console.log(
      `  ✓ ${form.title}\n    id:     ${form.id}\n    slug:   ${form.slug}\n    status: ${form.status}\n`,
    );
  }

  console.log("Done. Sign in as seed@formcraft.test / test12345678 to view them.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
