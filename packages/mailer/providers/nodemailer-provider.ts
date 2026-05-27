import nodemailer, { type Transporter } from "nodemailer";

import type { MailerEnv } from "../env";
import type { MailProvider, SendMailInput, SendMailResult } from "../types";

export class NodemailerProvider implements MailProvider {
  readonly name = "nodemailer" as const;
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(env: MailerEnv) {
    // env.ts has already enforced that SMTP_HOST/USER/PASS are present when
    // provider=nodemailer, so non-null assertions are safe here.
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST!,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER!,
        pass: env.SMTP_PASS!,
      },
    });
    this.defaultFrom = env.MAIL_FROM;
  }

  async send(input: SendMailInput): Promise<SendMailResult> {
    // Tags aren't a first-class concept in SMTP; flatten to custom headers so
    // they survive into the message and can be tracked by inbox-side tooling.
    const headers = input.tags
      ? Object.fromEntries(
          Object.entries(input.tags).map(([k, v]) => [`X-Mailer-Tag-${k}`, v]),
        )
      : undefined;

    const info = await this.transporter.sendMail({
      from: input.from ?? this.defaultFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      headers,
    });

    return {
      id: info.messageId,
      provider: "nodemailer",
      acceptedAt: new Date(),
    };
  }
}
