import { htmlToText, renderLayout } from "./layout";
import { emailTheme as t } from "./theme";
import { escapeHtml } from "./escape";
import type { RenderedTemplate } from "../types";

export interface FormsMilestoneProps {
  fullName: string;
  count: number; // 1 = first form ever, plus 5/10/25
  formsUrl: string;
}

export function formsMilestoneTemplate(
  props: FormsMilestoneProps,
): RenderedTemplate {
  const firstName = props.fullName.split(" ")[0] ?? "there";
  const isFirst = props.count === 1;

  const subject = isFirst
    ? "Your first form is live"
    : `${props.count} forms shipped`;
  const heading = isFirst
    ? "First form, shipped"
    : `${props.count} forms and counting`;
  const eyebrow = isFirst ? "Milestone" : "Milestone";

  const body = isFirst
    ? `
      <p style="margin-top: 0; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        Big step, ${escapeHtml(firstName)} — your first form is live on Simple Form.
      </p>
      <p style="margin-top: ${t.space.sm}px; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        Share the public link with whoever you're collecting from, and watch responses roll in. Your forms dashboard is the home base for everything you build next.
      </p>
    `
    : `
      <p style="margin-top: 0; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        ${escapeHtml(firstName)} — you've shipped <strong style="font-weight: ${t.font.weight.semibold};">${props.count}</strong> forms on Simple Form. That's a real practice.
      </p>
      <p style="margin-top: ${t.space.sm}px; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        Templates, duplication, version history — all of it is built so the next form takes less time than the last.
      </p>
    `;

  const html = renderLayout({
    preheader: isFirst
      ? "Your first form on Simple Form just went live."
      : `You've shipped ${props.count} forms.`,
    eyebrow,
    heading,
    body,
    ctaUrl: props.formsUrl,
    ctaLabel: "Go to your forms",
  });

  return {
    subject,
    html,
    text: htmlToText(html),
  };
}
