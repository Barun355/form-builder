import { logger } from "@repo/logger";

import { mailer } from "./adapter";
import { env } from "./env";
import { welcomeTemplate } from "./templates/welcome";
import { submissionsMilestoneTemplate } from "./templates/submissions-milestone";
import { formsMilestoneTemplate } from "./templates/forms-milestone";

export const SUBMISSION_MILESTONES = [1, 10, 50, 100, 500, 1000] as const;
export const FORM_MILESTONES = [1, 5, 10, 25] as const;

export type SubmissionMilestone = (typeof SUBMISSION_MILESTONES)[number];
export type FormMilestone = (typeof FORM_MILESTONES)[number];

export function isSubmissionMilestone(n: number): n is SubmissionMilestone {
  return (SUBMISSION_MILESTONES as readonly number[]).includes(n);
}

export function isFormMilestone(n: number): n is FormMilestone {
  return (FORM_MILESTONES as readonly number[]).includes(n);
}

interface UserRecipient {
  id: string;
  email: string;
  fullName: string;
}

/**
 * Wraps a send attempt so callers can `void sendXxx(...)` without worrying
 * about the request being held up or an unhandled rejection bubbling out.
 * Errors are logged with the user id + template tag.
 */
async function safeSend(
  tag: string,
  user: UserRecipient,
  fn: () => Promise<unknown>,
): Promise<void> {
  try {
    await fn();
  } catch (err) {
    logger.error(`[mailer] ${tag} failed`, {
      userId: user.id,
      email: user.email,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}

export function sendWelcomeEmail(user: UserRecipient): Promise<void> {
  const dashboardUrl = `${env.APP_ORIGIN.replace(/\/$/, "")}/dashboard`;
  const rendered = welcomeTemplate({
    fullName: user.fullName,
    dashboardUrl,
  });
  return safeSend("welcome", user, () =>
    mailer.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: { template: "welcome", userId: user.id },
    }),
  );
}

export function sendSubmissionsMilestoneEmail(
  user: UserRecipient,
  count: number,
  formTitle?: string,
): Promise<void> {
  if (!isSubmissionMilestone(count)) return Promise.resolve();
  const submissionsUrl = `${env.APP_ORIGIN.replace(/\/$/, "")}/dashboard/forms`;
  const rendered = submissionsMilestoneTemplate({
    fullName: user.fullName,
    count,
    formTitle,
    submissionsUrl,
  });
  return safeSend("submissions-milestone", user, () =>
    mailer.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: {
        template: "submissions-milestone",
        userId: user.id,
        milestone: String(count),
      },
    }),
  );
}

export function sendFormsMilestoneEmail(
  user: UserRecipient,
  count: number,
): Promise<void> {
  if (!isFormMilestone(count)) return Promise.resolve();
  const formsUrl = `${env.APP_ORIGIN.replace(/\/$/, "")}/dashboard/forms`;
  const rendered = formsMilestoneTemplate({
    fullName: user.fullName,
    count,
    formsUrl,
  });
  return safeSend("forms-milestone", user, () =>
    mailer.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: {
        template: "forms-milestone",
        userId: user.id,
        milestone: String(count),
      },
    }),
  );
}

// ─── Status-returning variants ───────────────────────────────────────────
// Used by tRPC procedures that need to surface delivery status back to the
// client. They await the send, catch any error, and never throw — so the
// procedure's own flow is unaffected by mail failures. Same logging as
// safeSend so server-side observability is unchanged.

export interface SendStatus {
  sent: boolean;
  error?: string;
}

async function tryAndStatus(
  tag: string,
  user: UserRecipient,
  fn: () => Promise<unknown>,
): Promise<SendStatus> {
  try {
    await fn();
    return { sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error(`[mailer] ${tag} failed`, {
      userId: user.id,
      email: user.email,
      message,
    });
    return { sent: false, error: message };
  }
}

export function sendWelcomeEmailWithStatus(
  user: UserRecipient,
): Promise<SendStatus> {
  const dashboardUrl = `${env.APP_ORIGIN.replace(/\/$/, "")}/dashboard`;
  const rendered = welcomeTemplate({
    fullName: user.fullName,
    dashboardUrl,
  });
  return tryAndStatus("welcome", user, () =>
    mailer.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: { template: "welcome", userId: user.id },
    }),
  );
}

export function sendFirstFormEmailWithStatus(
  user: UserRecipient,
): Promise<SendStatus> {
  const formsUrl = `${env.APP_ORIGIN.replace(/\/$/, "")}/dashboard/forms`;
  const rendered = formsMilestoneTemplate({
    fullName: user.fullName,
    count: 1,
    formsUrl,
  });
  return tryAndStatus("forms-milestone:first", user, () =>
    mailer.send({
      to: user.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      tags: {
        template: "forms-milestone",
        userId: user.id,
        milestone: "1",
      },
    }),
  );
}
