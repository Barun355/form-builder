export { mailer, Mailer } from "./adapter";
export { env } from "./env";
export type { MailerEnv } from "./env";
export type {
  MailProvider,
  MailProviderName,
  RenderedTemplate,
  SendMailInput,
  SendMailResult,
} from "./types";
export {
  sendWelcomeEmail,
  sendWelcomeEmailWithStatus,
  sendSubmissionsMilestoneEmail,
  sendFormsMilestoneEmail,
  sendFirstFormEmailWithStatus,
  isFormMilestone,
  isSubmissionMilestone,
  FORM_MILESTONES,
  SUBMISSION_MILESTONES,
} from "./senders";
export type { SendStatus } from "./senders";
