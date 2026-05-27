import { Resend } from "resend";

import type { MailerEnv } from "../env";
import type { MailProvider, SendMailInput, SendMailResult } from "../types";

export class ResendProvider implements MailProvider {
  readonly name = "resend" as const;
  private client: Resend;
  private defaultFrom: string;

  constructor(env: MailerEnv) {
    if (!env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is required when MAIL_PROVIDER=resend");
    }
    this.client = new Resend(env.RESEND_API_KEY);
    this.defaultFrom = env.MAIL_FROM;
  }

  async send(input: SendMailInput): Promise<SendMailResult> {
    const tags = input.tags
      ? Object.entries(input.tags).map(([name, value]) => ({ name, value }))
      : undefined;

    const res = await this.client.emails.send({
      from: input.from ?? this.defaultFrom,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      tags,
    });

    if (res.error || !res.data) {
      const message = res.error?.message ?? "Unknown Resend error";
      throw new Error(`Resend send failed: ${message}`);
    }

    return {
      id: res.data.id,
      provider: "resend",
      acceptedAt: new Date(),
    };
  }
}
