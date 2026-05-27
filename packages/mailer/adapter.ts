import { logger } from "@repo/logger";

import { env, type MailerEnv } from "./env";
import { NodemailerProvider } from "./providers/nodemailer-provider";
import { ResendProvider } from "./providers/resend-provider";
import type {
  MailProvider,
  MailProviderName,
  SendMailInput,
  SendMailResult,
} from "./types";

/**
 * Adapter that picks a concrete MailProvider based on env.MAIL_PROVIDER.
 * Same method signature as the underlying providers — callers depend only
 * on this class, not on which transport is wired in.
 *
 * Default is nodemailer. Unknown values fall back to nodemailer with a
 * warning so a misconfigured env var doesn't crash the API on boot.
 */
export class Mailer implements MailProvider {
  readonly name: MailProviderName;
  private readonly inner: MailProvider;

  constructor(mailerEnv: MailerEnv = env) {
    switch (mailerEnv.MAIL_PROVIDER) {
      case "resend":
        this.inner = new ResendProvider(mailerEnv);
        break;
      case "nodemailer":
        this.inner = new NodemailerProvider(mailerEnv);
        break;
      default: {
        // Zod-typed already, but guard at runtime to be explicit.
        logger.warn(
          `Unknown MAIL_PROVIDER='${mailerEnv.MAIL_PROVIDER as string}', falling back to nodemailer`,
        );
        this.inner = new NodemailerProvider(mailerEnv);
      }
    }
    this.name = this.inner.name;
    logger.info(`Mailer initialised with provider=${this.name}`);
  }

  send(input: SendMailInput): Promise<SendMailResult> {
    return this.inner.send(input);
  }
}

export const mailer = new Mailer(env);
