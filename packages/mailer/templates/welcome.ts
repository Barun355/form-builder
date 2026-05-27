import { htmlToText, renderLayout } from "./layout";
import { emailTheme as t } from "./theme";
import type { RenderedTemplate } from "../types";

export interface WelcomeProps {
  fullName: string;
  dashboardUrl: string;
}

export function welcomeTemplate(props: WelcomeProps): RenderedTemplate {
  const firstName = props.fullName.split(" ")[0] ?? "there";
  const html = renderLayout({
    preheader: "Welcome to Simple Form. Let's build your first form.",
    eyebrow: "Welcome",
    heading: `Welcome, ${firstName}`,
    body: `
      <p style="margin-top: 0; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        Thanks for signing up for Simple Form — glad to have you on board.
      </p>
      <p style="margin-top: ${t.space.sm}px; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
        You can spin up your first form in under two minutes — pick a template, tweak a few fields, share the link. Your dashboard is waiting whenever you're ready.
      </p>
    `,
    ctaUrl: props.dashboardUrl,
    ctaLabel: "Open dashboard",
    footerNote:
      "If you didn't create this account, you can safely ignore this email.",
  });

  return {
    subject: "Welcome to Simple Form",
    html,
    text: htmlToText(html),
  };
}
