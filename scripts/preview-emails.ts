/**
 * Renders each email template to /tmp/email-preview/*.html so you can
 * open them in a browser and eyeball cross-client parity.
 *
 * Usage:
 *   pnpm tsx scripts/preview-emails.mts
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { welcomeTemplate } from "../packages/mailer/templates/welcome";
import { formsMilestoneTemplate } from "../packages/mailer/templates/forms-milestone";
import { submissionsMilestoneTemplate } from "../packages/mailer/templates/submissions-milestone";

const OUT = "/tmp/email-preview";
mkdirSync(OUT, { recursive: true });

const previews = [
  {
    file: "welcome.html",
    rendered: welcomeTemplate({
      fullName: "Arundhati Roy",
      dashboardUrl: "http://localhost:3000/dashboard",
    }),
  },
  {
    file: "first-form.html",
    rendered: formsMilestoneTemplate({
      fullName: "Arundhati Roy",
      count: 1,
      formsUrl: "http://localhost:3000/dashboard/forms",
    }),
  },
  {
    file: "first-submission.html",
    rendered: submissionsMilestoneTemplate({
      fullName: "Arundhati Roy",
      count: 1,
      formTitle: "Customer feedback Q1",
      submissionsUrl: "http://localhost:3000/dashboard/forms",
    }),
  },
];

for (const { file, rendered } of previews) {
  writeFileSync(resolve(OUT, file), rendered.html, "utf8");
  console.log(`✓ ${file} — subject: ${rendered.subject}`);
}

console.log(`\nOpen any of these in a browser:`);
for (const { file } of previews) {
  console.log(`  file://${OUT}/${file}`);
}
