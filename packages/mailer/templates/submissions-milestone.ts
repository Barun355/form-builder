import { htmlToText, renderLayout } from "./layout";
import { emailTheme as t } from "./theme";
import { escapeHtml } from "./escape";
import type { RenderedTemplate } from "../types";

export interface SubmissionsMilestoneProps {
  fullName: string;
  count: number; // 1 = first ever, plus 10/50/100/500/1000
  formTitle?: string;
  submissionsUrl: string;
}

export function submissionsMilestoneTemplate(
  props: SubmissionsMilestoneProps,
): RenderedTemplate {
  const firstName = props.fullName.split(" ")[0] ?? "there";
  const isFirst = props.count === 1;
  const subject = isFirst
    ? "You got your first response"
    : `${props.count.toLocaleString()} responses and counting`;
  const heading = isFirst
    ? "First response in the door"
    : `${props.count.toLocaleString()} responses`;
  const eyebrow = isFirst ? "First response" : "Milestone";

  const formLine = props.formTitle
    ? `<p style="margin-top: ${t.space.sm}px; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
         Latest activity on <strong style="font-weight: ${t.font.weight.semibold};">${escapeHtml(props.formTitle)}</strong>.
       </p>`
    : "";

  const body = isFirst
    ? `
      <p style="margin-top: 0; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        Nice work, ${escapeHtml(firstName)} — someone just filled out your form.
      </p>
      ${formLine}
      <p style="margin-top: ${t.space.sm}px; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        Head to submissions to see what they wrote.
      </p>
    `
    : `
      <p style="margin-top: 0; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        Big day, ${escapeHtml(firstName)} — your forms have collected <strong style="font-weight: ${t.font.weight.semibold};">${props.count.toLocaleString()}</strong> completed responses.
      </p>
      ${formLine}
      <p style="margin-top: ${t.space.sm}px; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        That's real signal. Keep it going.
      </p>
    `;

  const html = renderLayout({
    preheader: isFirst
      ? "Your first form submission just arrived."
      : `You've hit ${props.count.toLocaleString()} completed submissions.`,
    eyebrow,
    heading,
    body,
    ctaUrl: props.submissionsUrl,
    ctaLabel: "View submissions",
  });

  return {
    subject,
    html,
    text: htmlToText(html),
  };
}
