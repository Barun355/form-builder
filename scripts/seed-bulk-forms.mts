/**
 * Bulk-seed script
 * ────────────────
 * Logs in as a fixed user, creates 10 different forms across varied use
 * cases, publishes each, then submits 100-200 fake responses per form via
 * the same public HTTP endpoints the browser hits (start → complete).
 *
 * Submission timestamps are NOW() (the API doesn't let clients backdate);
 * the trend chart will spike on today, the rest of the dashboard fills out
 * realistically. If you want spread-over-time data later, that's a DB UPDATE
 * step we'd add as a separate utility.
 *
 *   pnpm exec tsx scripts/seed-bulk-forms.mts
 *   (or)  apps/api/node_modules/.bin/tsx scripts/seed-bulk-forms.mts
 *
 * Tunables via env:
 *   API_BASE        default http://localhost:8000/api
 *   SEED_EMAIL      default baruntiwary620@gmail.com
 *   SEED_PASSWORD   default 12345678
 *   MIN_RESPONSES   default 100
 *   MAX_RESPONSES   default 200
 *   CONCURRENCY     default 20  (parallel submissions per form)
 */

const BASE = process.env.API_BASE ?? "http://localhost:8000/api";
const EMAIL = process.env.SEED_EMAIL ?? "baruntiwary620@gmail.com";
const PASSWORD = process.env.SEED_PASSWORD ?? "12345678";
const MIN_RESPONSES = Number(process.env.MIN_RESPONSES ?? 100);
const MAX_RESPONSES = Number(process.env.MAX_RESPONSES ?? 200);
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 20);

let cookies = "";

async function api(path: string, init: RequestInit = {}): Promise<unknown> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (cookies) headers.set("Cookie", cookies);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) cookies = setCookie.split(";")[0] ?? cookies;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`${res.status} ${path}: ${body.slice(0, 240)}`);
  }
  return res.json();
}

// ─── tRPC mirrors ────────────────────────────────────────────────────────

async function login() {
  return (await api("/authentication/loginUserWithEmailAndPassword", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })) as { id: string };
}

async function createForm(title: string, description: string) {
  return (await api("/form/createForm", {
    method: "POST",
    body: JSON.stringify({ title, description }),
  })) as { id: string; slug: string; title: string; status: string };
}

async function saveDraft(formId: string, schema: unknown) {
  return (await api("/form-versions/saveDraft", {
    method: "POST",
    body: JSON.stringify({ formId, schema }),
  })) as { id: string; version: number };
}

async function publishForm(id: string) {
  return (await api("/form/publishForm", {
    method: "POST",
    body: JSON.stringify({ id }),
  })) as {
    id: string;
    status: string;
    publishedVersionId: string;
    publishedVersion: { id: string; version: number };
  };
}

async function setFormVisibility(id: string, visibility: "PUBLIC" | "UNLISTED") {
  return (await api("/form/updateForm", {
    method: "POST",
    body: JSON.stringify({ id, visibility }),
  })) as { id: string; visibility: "PUBLIC" | "UNLISTED" };
}

async function startSubmission(versionId: string, meta: ClientMeta) {
  return (await api("/form-submissions/start", {
    method: "POST",
    body: JSON.stringify({ versionId, meta, honeypot: "" }),
  })) as { id: string };
}

async function completeSubmission(args: {
  submissionId: string;
  versionId: string;
  data: Record<string, unknown>;
}) {
  return (await api("/form-submissions/complete", {
    method: "POST",
    body: JSON.stringify({ ...args, honeypot: "" }),
  })) as { id: string; submittedAt: string };
}

// ─── Schema builders ─────────────────────────────────────────────────────

type FieldType =
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

interface FieldOption {
  id: string;
  label: string;
  value: string;
}
interface Field {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  order: number;
  sectionId: string;
  placeholder?: string;
  helpText?: string;
  required?: boolean;
  options?: FieldOption[];
  validation?: { min?: number; max?: number };
}
interface Section {
  id: string;
  title: string;
  description?: string;
  order: number;
  pageId: string;
  fieldIds: string[];
}
interface Page {
  id: string;
  title: string;
  description?: string;
  order: number;
  sectionIds: string[];
}
interface FormSchema {
  pages: Page[];
  sections: Section[];
  fields: Field[];
  thankYou?: {
    title?: string;
    message?: string;
    showSubmitAnotherButton?: boolean;
  };
}

function opts(...labels: string[]): FieldOption[] {
  return labels.map((label, i) => ({
    id: `o${i + 1}`,
    label,
    value: label.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, ""),
  }));
}

// ─── Random data helpers ─────────────────────────────────────────────────

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!;
}
function pickWeighted<T>(items: readonly [T, number][]): T {
  const total = items.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [item, w] of items) {
    r -= w;
    if (r <= 0) return item;
  }
  return items[items.length - 1]![0];
}
function pickN<T>(arr: readonly T[], min: number, max: number): T[] {
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const FIRST_NAMES = [
  "Aarav", "Aisha", "Akira", "Alex", "Amara", "Aria", "Ben", "Carlos",
  "Chen", "Dani", "Diego", "Elena", "Emma", "Fatima", "Felix", "Hana",
  "Hiro", "Isla", "Jade", "Jamal", "Kira", "Leo", "Liam", "Lin", "Maya",
  "Mateo", "Mira", "Nia", "Noah", "Olivia", "Omar", "Priya", "Raj",
  "Riya", "Sam", "Sara", "Sebastien", "Sofia", "Tariq", "Uma", "Vikram",
  "Wei", "Yara", "Yuki", "Zara",
];
const LAST_NAMES = [
  "Anderson", "Brown", "Chen", "Davis", "Garcia", "Hernandez", "Ivanov",
  "Jackson", "Khan", "Kim", "Lee", "Lopez", "Martinez", "Miller",
  "Nguyen", "O'Brien", "Patel", "Rao", "Rodriguez", "Sato", "Schmidt",
  "Singh", "Smith", "Tanaka", "Taylor", "Wang", "Wilson", "Williams",
  "Yamamoto", "Zhang",
];
const EMAIL_DOMAINS = [
  "gmail.com", "yahoo.com", "outlook.com", "icloud.com", "proton.me",
  "hey.com", "fastmail.com",
];
const CITIES = [
  "San Francisco", "New York", "London", "Tokyo", "Berlin", "Mumbai",
  "Sydney", "Toronto", "Singapore", "Mexico City", "Bangalore",
];
const COMPANIES = [
  "Acme Co", "Globex", "Initech", "Soylent", "Hooli", "Pied Piper",
  "Stark Industries", "Wayne Enterprises", "Wonka Industries", "Umbrella",
];

function makeName(): string {
  return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
}
function makeEmail(fullName: string): string {
  const [first, last] = fullName.toLowerCase().split(" ");
  return `${first}.${last}.${randInt(10, 99)}@${pick(EMAIL_DOMAINS)}`;
}
function makePhone(): string {
  return `+1-${randInt(200, 999)}-${randInt(100, 999)}-${randInt(1000, 9999)}`;
}
function makeFutureDate(daysOut = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + randInt(1, daysOut));
  return d.toISOString().slice(0, 10);
}
function makeFutureDatetime(daysOut = 30): string {
  const d = new Date();
  d.setDate(d.getDate() + randInt(1, daysOut));
  d.setHours(randInt(8, 22), [0, 15, 30, 45][randInt(0, 3)]!, 0, 0);
  return d.toISOString().slice(0, 16);
}

// Free-text snippets — short, plausibly human, varied
const FREE_TEXT_SNIPPETS = [
  "Love the speed and simplicity. Keep iterating.",
  "Pretty good overall, would recommend.",
  "Great product, the new dashboard is a huge improvement.",
  "Works well for our team. Onboarding was smooth.",
  "Solid. Found everything I was looking for.",
  "Some minor friction with mobile rendering but mostly fine.",
  "Wish there were more integration options.",
  "Helpful and intuitive. The team support is excellent.",
  "Saved us hours of manual work each week.",
  "Easy to set up. Took less than 10 minutes.",
  "A few quirks here and there but nothing blocking.",
  "Documentation could use some examples.",
  "Performance has been rock solid lately.",
  "Loving the new analytics dashboards.",
  "Would buy again. Subscription paid for itself in week one.",
  "Replaced three other tools we were paying for.",
  "Mostly happy. Some advanced features still rough.",
  "Excellent! Wouldn't change a thing.",
  "Sleek UI. The dark mode is appreciated.",
  "Fast support response — thank you.",
];
function makeFreeText(): string {
  return pick(FREE_TEXT_SNIPPETS);
}

// ─── Meta randomizer ─────────────────────────────────────────────────────

interface ClientMeta {
  deviceType?: string;
  browser?: string;
  os?: string;
  locale?: string;
  timezone?: string;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  userAgent?: string;
  screenResolution?: string;
}

const LOCALES = [
  ["en-US", "America/Los_Angeles"],
  ["en-US", "America/New_York"],
  ["en-GB", "Europe/London"],
  ["es-ES", "Europe/Madrid"],
  ["fr-FR", "Europe/Paris"],
  ["de-DE", "Europe/Berlin"],
  ["ja-JP", "Asia/Tokyo"],
  ["zh-CN", "Asia/Shanghai"],
  ["pt-BR", "America/Sao_Paulo"],
  ["hi-IN", "Asia/Kolkata"],
] as const;

const UTM_SOURCES = [
  ["twitter", "social", "launch_announcement"],
  ["linkedin", "social", "thought_leadership"],
  ["hackernews", "social", "feature_post"],
  ["producthunt", "referral", "launch_day"],
  ["google", "cpc", "brand_keywords"],
  ["newsletter", "email", "weekly_digest"],
  ["partner_blog", "referral", "guest_post_q2"],
] as const;

const REFERRERS = [
  "https://twitter.com",
  "https://news.ycombinator.com",
  "https://www.linkedin.com",
  "https://www.producthunt.com",
  "https://www.google.com",
  "",
  "",
];

function randomMeta(): ClientMeta {
  const deviceType = pickWeighted<string>([
    ["desktop", 60],
    ["mobile", 35],
    ["tablet", 5],
  ]);

  let browser: string;
  let os: string;
  let screen: string;

  if (deviceType === "desktop") {
    browser = pickWeighted<string>([
      ["Chrome 121", 50],
      ["Safari 17", 20],
      ["Firefox 122", 15],
      ["Edge 121", 15],
    ]);
    os = pickWeighted<string>([
      ["macOS 14.3", 35],
      ["Windows 10.0", 45],
      ["Linux x86_64", 20],
    ]);
    screen = pick(["1920x1080", "2560x1440", "1440x900", "1366x768"]);
  } else if (deviceType === "mobile") {
    browser = pickWeighted<string>([
      ["Mobile Safari 17", 50],
      ["Chrome Mobile 121", 45],
      ["Firefox Mobile 122", 5],
    ]);
    os = pickWeighted<string>([
      ["iOS 17.2", 50],
      ["Android 14", 50],
    ]);
    screen = pick(["390x844", "414x896", "375x667", "412x915"]);
  } else {
    browser = pick(["Mobile Safari 17", "Chrome 121"]);
    os = pick(["iPadOS 17.2", "Android 14"]);
    screen = pick(["1024x1366", "820x1180"]);
  }

  const [locale, timezone] = pick(LOCALES);

  const meta: ClientMeta = {
    deviceType,
    browser,
    os,
    locale,
    timezone,
    screenResolution: screen,
    userAgent: `Mozilla/5.0 (${os}) ${browser}`,
    referrer: pick(REFERRERS) || undefined,
  };

  // ~30% of submissions carry UTM tags
  if (Math.random() < 0.3) {
    const [source, medium, campaign] = pick(UTM_SOURCES);
    meta.utmSource = source;
    meta.utmMedium = medium;
    meta.utmCampaign = campaign;
  }

  return meta;
}

// ─── Data generator dispatching by field ─────────────────────────────────

interface SubmissionContext {
  fullName: string;
  email: string;
}

function generateValue(field: Field, ctx: SubmissionContext): unknown {
  switch (field.type) {
    case "text":
      if (/name/i.test(field.name) || /name/i.test(field.label))
        return ctx.fullName;
      if (/company|org/i.test(field.name)) return pick(COMPANIES);
      if (/city/i.test(field.name)) return pick(CITIES);
      if (/url|website|portfolio/i.test(field.name))
        return `https://${ctx.fullName.toLowerCase().split(" ").join("")}.example.com`;
      return makeFreeText();
    case "email":
      return ctx.email;
    case "phone":
      return makePhone();
    case "textarea":
      return makeFreeText();
    case "number": {
      const min = field.validation?.min ?? 0;
      const max = field.validation?.max ?? 100;
      return randInt(min, max);
    }
    case "select":
    case "radio":
      return pick(field.options ?? [{ value: "unknown" } as FieldOption]).value;
    case "checkbox": {
      const subset = pickN(field.options ?? [], 0, 3);
      return subset.map((o) => o.value);
    }
    case "date":
      return makeFutureDate(60);
    case "datetime":
      return makeFutureDatetime(60);
    case "file":
      return null; // file upload not implemented; skip
    default:
      return null;
  }
}

// ─── The 10 form specs ───────────────────────────────────────────────────

interface FormSpec {
  title: string;
  description: string;
  schema: FormSchema;
  // When `true`, after the form is published the seeder marks it as PUBLIC
  // so it shows up on the /explore page. Defaults to UNLISTED (omitted).
  isPublic?: boolean;
}

function f(
  id: string,
  type: FieldType,
  name: string,
  label: string,
  order: number,
  sectionId: string,
  extras: Partial<Field> = {},
): Field {
  return { id, type, name, label, order, sectionId, ...extras };
}

const FORMS: FormSpec[] = [
  // 1 — Customer satisfaction (SaaS)
  {
    title: "Q1 Product Satisfaction Survey",
    description: "Help us understand how your team uses our SaaS.",
    schema: {
      pages: [{ id: "p1", title: "Your feedback", order: 0, sectionIds: ["s1", "s2"] }],
      sections: [
        { id: "s1", title: "About you", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3"] },
        { id: "s2", title: "Your experience", order: 1, pageId: "p1", fieldIds: ["f4", "f5", "f6", "f7"] },
      ],
      fields: [
        f("f1", "text", "name", "Your name", 0, "s1", { required: true }),
        f("f2", "email", "email", "Work email", 1, "s1", { required: true }),
        f("f3", "select", "company_size", "Company size", 2, "s1", {
          options: opts("1-10", "11-50", "51-200", "201-1000", "1000+"),
        }),
        f("f4", "radio", "satisfaction", "Overall satisfaction", 0, "s2", {
          required: true,
          options: opts("Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"),
        }),
        f("f5", "number", "nps", "How likely to recommend (0–10)", 1, "s2", {
          validation: { min: 0, max: 10 },
        }),
        f("f6", "checkbox", "favorite_features", "Most useful features", 2, "s2", {
          options: opts("Dashboard", "Reporting", "Integrations", "Mobile", "API", "Notifications"),
        }),
        f("f7", "textarea", "improvement", "What should we improve?", 3, "s2"),
      ],
      thankYou: {
        title: "Thanks for your feedback!",
        message: "Your responses help us prioritize the roadmap.",
      },
    },
  },

  // 2 — Event registration
  {
    isPublic: true,
    title: "DevConf 2026 — Attendee Registration",
    description: "Reserve your seat for the developer conference.",
    schema: {
      pages: [
        { id: "p1", title: "Contact", order: 0, sectionIds: ["s1"] },
        { id: "p2", title: "Logistics", order: 1, sectionIds: ["s2"] },
      ],
      sections: [
        { id: "s1", title: "About you", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3", "f4"] },
        { id: "s2", title: "Attendance details", order: 0, pageId: "p2", fieldIds: ["f5", "f6", "f7"] },
      ],
      fields: [
        f("f1", "text", "name", "Full name", 0, "s1", { required: true }),
        f("f2", "email", "email", "Email", 1, "s1", { required: true }),
        f("f3", "phone", "phone", "Phone", 2, "s1"),
        f("f4", "text", "company", "Company / org", 3, "s1"),
        f("f5", "select", "ticket_type", "Ticket type", 0, "s2", {
          required: true,
          options: opts("Early bird", "Standard", "VIP", "Student"),
        }),
        f("f6", "checkbox", "dietary", "Dietary restrictions", 1, "s2", {
          options: opts("Vegetarian", "Vegan", "Gluten-free", "Halal", "Kosher", "None"),
        }),
        f("f7", "datetime", "arrival", "Expected arrival time", 2, "s2"),
      ],
    },
  },

  // 3 — Job application
  {
    title: "Senior Engineer — Application",
    description: "Tell us about yourself.",
    schema: {
      pages: [{ id: "p1", title: "Application", order: 0, sectionIds: ["s1", "s2"] }],
      sections: [
        { id: "s1", title: "Contact", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3"] },
        { id: "s2", title: "Background", order: 1, pageId: "p1", fieldIds: ["f4", "f5", "f6", "f7", "f8"] },
      ],
      fields: [
        f("f1", "text", "name", "Full name", 0, "s1", { required: true }),
        f("f2", "email", "email", "Email", 1, "s1", { required: true }),
        f("f3", "phone", "phone", "Phone", 2, "s1"),
        f("f4", "number", "years_experience", "Years of experience", 0, "s2", {
          validation: { min: 0, max: 40 },
        }),
        f("f5", "number", "expected_salary", "Expected salary (USD)", 1, "s2", {
          validation: { min: 50000, max: 350000 },
        }),
        f("f6", "select", "role", "Role applying for", 2, "s2", {
          required: true,
          options: opts("Backend", "Frontend", "Full-stack", "DevOps", "Data engineering"),
        }),
        f("f7", "text", "portfolio_url", "Portfolio URL", 3, "s2"),
        f("f8", "textarea", "why_us", "Why us?", 4, "s2"),
      ],
    },
  },

  // 4 — Bug report
  {
    isPublic: true,
    title: "Bug Report — Internal",
    description: "Help engineering reproduce and fix issues quickly.",
    schema: {
      pages: [{ id: "p1", title: "Bug details", order: 0, sectionIds: ["s1"] }],
      sections: [
        { id: "s1", title: "What happened?", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3", "f4", "f5", "f6"] },
      ],
      fields: [
        f("f1", "text", "title", "Short title", 0, "s1", { required: true }),
        f("f2", "radio", "severity", "Severity", 1, "s1", {
          required: true,
          options: opts("Low", "Medium", "High", "Critical"),
        }),
        f("f3", "radio", "reproducible", "Reliably reproducible?", 2, "s1", {
          options: opts("Yes", "Sometimes", "No"),
        }),
        f("f4", "select", "browser", "Browser", 3, "s1", {
          options: opts("Chrome", "Safari", "Firefox", "Edge", "Other"),
        }),
        f("f5", "textarea", "steps", "Steps to reproduce", 4, "s1"),
        f("f6", "text", "screenshot_url", "Screenshot URL (optional)", 5, "s1"),
      ],
    },
  },

  // 5 — Newsletter signup
  {
    title: "Weekly Newsletter Signup",
    description: "Pick your topics — one email per week.",
    schema: {
      pages: [{ id: "p1", title: "Subscribe", order: 0, sectionIds: ["s1"] }],
      sections: [
        { id: "s1", title: "Subscribe", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3", "f4"] },
      ],
      fields: [
        f("f1", "email", "email", "Email", 0, "s1", { required: true }),
        f("f2", "text", "name", "First name", 1, "s1"),
        f("f3", "checkbox", "topics", "Topics you want", 2, "s1", {
          options: opts("Engineering", "Design", "Product", "AI", "Startups", "Career"),
        }),
        f("f4", "radio", "frequency", "How often?", 3, "s1", {
          options: opts("Weekly", "Bi-weekly", "Monthly"),
        }),
      ],
    },
  },

  // 6 — Product feedback (NPS-style)
  {
    title: "Post-trial Product Feedback",
    description: "Help us understand your trial experience.",
    schema: {
      pages: [{ id: "p1", title: "Feedback", order: 0, sectionIds: ["s1"] }],
      sections: [
        { id: "s1", title: "Your trial", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3", "f4", "f5"] },
      ],
      fields: [
        f("f1", "radio", "rating", "Overall rating", 0, "s1", {
          required: true,
          options: opts("1 — Poor", "2 — Fair", "3 — Good", "4 — Very good", "5 — Excellent"),
        }),
        f("f2", "select", "most_used", "Most-used feature", 1, "s1", {
          options: opts("Templates", "Builder", "Analytics", "Integrations", "Sharing"),
        }),
        f("f3", "textarea", "missing", "What was missing?", 2, "s1"),
        f("f4", "radio", "continue", "Will you continue using us?", 3, "s1", {
          options: opts("Definitely", "Maybe", "No"),
        }),
        f("f5", "email", "email", "Email (for follow-up)", 4, "s1"),
      ],
    },
  },

  // 7 — Restaurant reservation
  {
    isPublic: true,
    title: "Reservation — Maison Vert",
    description: "Book a table.",
    schema: {
      pages: [{ id: "p1", title: "Reservation", order: 0, sectionIds: ["s1", "s2"] }],
      sections: [
        { id: "s1", title: "Contact", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3"] },
        { id: "s2", title: "Details", order: 1, pageId: "p1", fieldIds: ["f4", "f5", "f6", "f7", "f8"] },
      ],
      fields: [
        f("f1", "text", "name", "Name", 0, "s1", { required: true }),
        f("f2", "email", "email", "Email", 1, "s1", { required: true }),
        f("f3", "phone", "phone", "Phone", 2, "s1", { required: true }),
        f("f4", "number", "party_size", "Party size", 0, "s2", {
          required: true,
          validation: { min: 1, max: 12 },
        }),
        f("f5", "date", "date", "Reservation date", 1, "s2", { required: true }),
        f("f6", "datetime", "time", "Time", 2, "s2", { required: true }),
        f("f7", "select", "seating", "Seating preference", 3, "s2", {
          options: opts("Indoor", "Outdoor", "Bar", "No preference"),
        }),
        f("f8", "textarea", "special_requests", "Special requests", 4, "s2"),
      ],
    },
  },

  // 8 — Course enrollment
  {
    title: "Online Course Enrollment",
    description: "Tell us about your background and pick a track.",
    schema: {
      pages: [{ id: "p1", title: "Enroll", order: 0, sectionIds: ["s1"] }],
      sections: [
        { id: "s1", title: "Your enrollment", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3", "f4", "f5", "f6"] },
      ],
      fields: [
        f("f1", "text", "name", "Full name", 0, "s1", { required: true }),
        f("f2", "email", "email", "Email", 1, "s1", { required: true }),
        f("f3", "select", "course", "Which course?", 2, "s1", {
          required: true,
          options: opts("Intro to TypeScript", "React Patterns", "System Design", "Postgres for App Devs", "AI Engineering"),
        }),
        f("f4", "radio", "level", "Experience level", 3, "s1", {
          options: opts("Beginner", "Intermediate", "Advanced"),
        }),
        f("f5", "checkbox", "schedule", "Preferred schedule", 4, "s1", {
          options: opts("Weekday mornings", "Weekday evenings", "Weekend mornings", "Weekend afternoons"),
        }),
        f("f6", "textarea", "goals", "What do you hope to learn?", 5, "s1"),
      ],
    },
  },

  // 9 — Volunteer signup
  {
    title: "Community Volunteer Signup",
    description: "Join the next community drive.",
    schema: {
      pages: [{ id: "p1", title: "Signup", order: 0, sectionIds: ["s1"] }],
      sections: [
        { id: "s1", title: "About you", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3", "f4", "f5", "f6"] },
      ],
      fields: [
        f("f1", "text", "name", "Full name", 0, "s1", { required: true }),
        f("f2", "email", "email", "Email", 1, "s1", { required: true }),
        f("f3", "phone", "phone", "Phone", 2, "s1"),
        f("f4", "checkbox", "interests", "Areas you want to help with", 3, "s1", {
          options: opts("Logistics", "Cooking", "Cleanup", "Outreach", "Mentoring", "Tech support"),
        }),
        f("f5", "checkbox", "availability", "When are you available?", 4, "s1", {
          options: opts("Weekday mornings", "Weekday evenings", "Saturdays", "Sundays"),
        }),
        f("f6", "textarea", "skills", "Skills or relevant experience", 5, "s1"),
      ],
    },
  },

  // 10 — Contact us
  {
    isPublic: true,
    title: "Contact Us",
    description: "We'll get back to you within one business day.",
    schema: {
      pages: [{ id: "p1", title: "Message", order: 0, sectionIds: ["s1"] }],
      sections: [
        { id: "s1", title: "Your message", order: 0, pageId: "p1", fieldIds: ["f1", "f2", "f3", "f4", "f5"] },
      ],
      fields: [
        f("f1", "text", "name", "Name", 0, "s1", { required: true }),
        f("f2", "email", "email", "Email", 1, "s1", { required: true }),
        f("f3", "select", "subject", "What's this about?", 2, "s1", {
          required: true,
          options: opts("General", "Sales", "Support", "Partnership", "Press"),
        }),
        f("f4", "textarea", "message", "Your message", 3, "s1", { required: true }),
        f("f5", "radio", "preferred_contact", "Preferred contact method", 4, "s1", {
          options: opts("Email", "Phone"),
        }),
      ],
    },
  },
];

// ─── Concurrency helper ──────────────────────────────────────────────────

async function pMap<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  const runners = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i]!, i);
    }
  });
  await Promise.all(runners);
  return results;
}

// ─── Per-form submission flow ────────────────────────────────────────────

async function submitOnce(versionId: string, schema: FormSchema): Promise<void> {
  const meta = randomMeta();
  const { id } = await startSubmission(versionId, meta);

  const fullName = makeName();
  const ctx: SubmissionContext = {
    fullName,
    email: makeEmail(fullName),
  };

  const data: Record<string, unknown> = {};
  for (const field of schema.fields) {
    data[field.id] = generateValue(field, ctx);
  }

  await completeSubmission({ submissionId: id, versionId, data });
}

// ─── Main ────────────────────────────────────────────────────────────────

async function main() {
  console.log(`Seeding via ${BASE}`);
  console.log(`User: ${EMAIL}`);
  await login();
  console.log("Logged in.\n");

  let totalSubmissions = 0;
  const startedAt = Date.now();

  for (const [index, spec] of FORMS.entries()) {
    const label = `[${index + 1}/${FORMS.length}]`;
    process.stdout.write(`${label} ${spec.title}...\n`);

    const form = await createForm(spec.title, spec.description);
    await saveDraft(form.id, spec.schema);
    const published = await publishForm(form.id);
    if (spec.isPublic) {
      await setFormVisibility(form.id, "PUBLIC");
    }

    const targetCount = randInt(MIN_RESPONSES, MAX_RESPONSES);
    const tasks = Array.from({ length: targetCount }, (_, i) => i);

    let done = 0;
    let failed = 0;
    const t0 = Date.now();

    await pMap(tasks, CONCURRENCY, async () => {
      try {
        await submitOnce(published.publishedVersion.id, spec.schema);
        done += 1;
      } catch (err) {
        failed += 1;
        if (failed <= 3) {
          console.error(
            `  ! submit failure (${failed}):`,
            err instanceof Error ? err.message : err,
          );
        }
      }
    });

    const ms = Date.now() - t0;
    console.log(
      `       ${done.toString().padStart(3, " ")}/${targetCount} responses` +
        (failed ? ` (${failed} failed)` : "") +
        `  in ${(ms / 1000).toFixed(1)}s  ·  /u/?/${form.slug}\n`,
    );
    totalSubmissions += done;
  }

  const totalMs = Date.now() - startedAt;
  console.log(
    `\nDone. ${FORMS.length} forms · ${totalSubmissions} total responses · ${(totalMs / 1000).toFixed(1)}s elapsed`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
