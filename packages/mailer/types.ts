export type MailProviderName = "nodemailer" | "resend";

export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: Record<string, string>;
}

export interface SendMailResult {
  id: string;
  provider: MailProviderName;
  acceptedAt: Date;
}

export interface MailProvider {
  readonly name: MailProviderName;
  send(input: SendMailInput): Promise<SendMailResult>;
}

export interface RenderedTemplate {
  subject: string;
  html: string;
  text: string;
}
