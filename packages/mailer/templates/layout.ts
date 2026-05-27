/**
 * Cross-client email shell. Built around the constraints that survive
 * every major client in 2026:
 *
 *  - Inline styles on every element (Gmail Web strips <head><style>)
 *  - <table> for layout (Outlook still runs Word's HTML engine — no
 *    flexbox, no grid, no `display: block` on table substitutes)
 *  - No CSS shorthand (Word engine drops `padding: 10px 20px`-style)
 *  - No position/float — break Word + iOS Mail in different ways
 *  - 600px max container width (industry standard for preview panes)
 *  - Off-white background (avoids Gmail/Outlook dark-mode auto-inversion)
 *  - Bulletproof button: VML <v:roundrect> inside an `<!--[if mso]>`
 *    conditional for Outlook, regular styled <a> for everyone else
 *  - Format-detection meta stops iOS auto-linking phone numbers
 *  - Hidden preheader span — Gmail/Apple Mail show this as the
 *    inbox-list snippet next to the subject line
 *
 * The <style> block here is progressive-enhancement only: mobile tweaks
 * and dark-mode overrides. Anything in there is "nice to have"; the
 * inline-styled base must look right with the <style> block ignored.
 */

import { emailTheme } from "./theme";
import { escapeHtml } from "./escape";

// Short alias used heavily inside the layout — `t.color.foo` keeps lines short.
const t = emailTheme;

export interface LayoutInput {
  preheader: string;
  eyebrow?: string;
  heading: string;
  body: string; // pre-rendered HTML
  ctaUrl?: string;
  ctaLabel?: string;
  footerNote?: string;
}

export function renderLayout(input: LayoutInput): string {
  const { preheader, eyebrow, heading, body, ctaUrl, ctaLabel, footerNote } =
    input;

  const eyebrowMarkup = eyebrow
    ? `<tr>
        <td style="padding-left: ${t.space.xl}px; padding-right: ${t.space.xl}px; padding-top: ${t.space.lg}px; padding-bottom: 0;">
          <div style="font-family: ${t.font.family}; font-size: ${t.font.size.eyebrow}px; font-weight: ${t.font.weight.semibold}; letter-spacing: 0.08em; text-transform: uppercase; color: ${t.color.primary};">
            ${escapeHtml(eyebrow)}
          </div>
        </td>
      </tr>`
    : "";

  const ctaMarkup =
    ctaUrl && ctaLabel ? renderBulletproofButton(ctaUrl, ctaLabel) : "";

  const footerNoteMarkup = footerNote
    ? `<p style="margin-top: ${t.space.md}px; margin-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.caption}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.mutedForeground};">${footerNote}</p>`
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no, url=no" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(heading)}</title>
    <!--[if mso]>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
    <style type="text/css">
      table { border-collapse: collapse; }
      td, th, div, p, a { font-family: Arial, sans-serif !important; }
    </style>
    <![endif]-->
    <style type="text/css">
      /* Progressive enhancement only — the base design must render
         correctly without any rule below this line. */
      body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
      table { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
      img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
      a { text-decoration: none; }
      @media only screen and (max-width: 620px) {
        .container { width: 100% !important; }
        .px-32 { padding-left: 20px !important; padding-right: 20px !important; }
        .h1 { font-size: 20px !important; }
      }
    </style>
  </head>
  <body style="margin: 0; padding: 0; width: 100%; background-color: ${t.color.background}; font-family: ${t.font.family};">
    <!-- Preheader — hidden in body, surfaces in inbox preview -->
    <div style="display: none; max-height: 0; max-width: 0; overflow: hidden; opacity: 0; mso-hide: all; font-size: 1px; line-height: 1px; color: ${t.color.background};">
      ${escapeHtml(preheader)}
    </div>

    <!-- Outer wrapper -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: ${t.color.background}; width: 100%;">
      <tr>
        <td align="center" style="padding-top: ${t.space.xl}px; padding-bottom: ${t.space.xl}px; padding-left: ${t.space.md}px; padding-right: ${t.space.md}px;">

          <!-- Container -->
          <table role="presentation" class="container" width="${t.width.container}" cellpadding="0" cellspacing="0" border="0" style="width: ${t.width.container}px; max-width: ${t.width.container}px; background-color: ${t.color.card}; border-radius: ${t.radius.lg}px; border: 1px solid ${t.color.border};">

            <!-- Wordmark header -->
            <tr>
              <td class="px-32" style="padding-left: ${t.space.xl}px; padding-right: ${t.space.xl}px; padding-top: ${t.space.lg}px; padding-bottom: 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td style="vertical-align: middle; padding-right: 8px;">
                      <div style="width: 22px; height: 22px; background-color: ${t.color.primary}; border-radius: 6px; line-height: 22px; text-align: center;">
                        <span style="display: inline-block; font-family: ${t.font.family}; font-size: 13px; font-weight: ${t.font.weight.semibold}; color: ${t.color.primaryForeground};">S</span>
                      </div>
                    </td>
                    <td style="vertical-align: middle;">
                      <span style="font-family: ${t.font.family}; font-size: 14px; font-weight: ${t.font.weight.semibold}; color: ${t.color.foreground}; letter-spacing: -0.01em;">Simple Form</span>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            ${eyebrowMarkup}

            <!-- Heading -->
            <tr>
              <td class="px-32" style="padding-left: ${t.space.xl}px; padding-right: ${t.space.xl}px; padding-top: ${t.space.sm}px; padding-bottom: 0;">
                <h1 class="h1" style="margin: 0; font-family: ${t.font.family}; font-size: ${t.font.size.h1}px; line-height: ${t.font.lineHeight.tight}; font-weight: ${t.font.weight.semibold}; color: ${t.color.foreground}; letter-spacing: -0.02em;">${escapeHtml(heading)}</h1>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td class="px-32" style="padding-left: ${t.space.xl}px; padding-right: ${t.space.xl}px; padding-top: ${t.space.md}px; padding-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.body}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.foreground};">
                ${body}
              </td>
            </tr>

            ${ctaMarkup}

            <!-- Footer note (within the card) -->
            <tr>
              <td class="px-32" style="padding-left: ${t.space.xl}px; padding-right: ${t.space.xl}px; padding-top: ${t.space.md}px; padding-bottom: ${t.space.xl}px;">
                ${footerNoteMarkup}
              </td>
            </tr>
          </table>

          <!-- Outside-the-card footer -->
          <table role="presentation" width="${t.width.container}" cellpadding="0" cellspacing="0" border="0" style="width: ${t.width.container}px; max-width: ${t.width.container}px;">
            <tr>
              <td align="center" style="padding-top: ${t.space.md}px; padding-bottom: 0; font-family: ${t.font.family}; font-size: ${t.font.size.caption}px; line-height: ${t.font.lineHeight.normal}; color: ${t.color.mutedForeground};">
                © ${new Date().getFullYear()} Simple Form · You received this because you have a Simple Form account.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Bulletproof CTA — Outlook (Word engine) ignores border-radius on <a> /
 * styled-as-button, so we ship a VML <v:roundrect> inside an `<!--[if mso]>`
 * conditional. Other clients hide the VML and render the styled <a>.
 */
function renderBulletproofButton(href: string, label: string): string {
  const bg = emailTheme.color.primary;
  const fg = emailTheme.color.primaryForeground;
  const radius = emailTheme.radius.md;
  const safeHref = escapeHtml(href);
  const safeLabel = escapeHtml(label);
  return `<tr>
    <td class="px-32" style="padding-left: ${emailTheme.space.xl}px; padding-right: ${emailTheme.space.xl}px; padding-top: ${emailTheme.space.lg}px; padding-bottom: 0;">
      <!--[if mso]>
      <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${safeHref}" style="height:44px;v-text-anchor:middle;width:200px;" arcsize="18%" stroke="f" fillcolor="${bg}">
        <w:anchorlock/>
        <center style="color:${fg};font-family:Arial,sans-serif;font-size:15px;font-weight:600;">${safeLabel}</center>
      </v:roundrect>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <a href="${safeHref}" target="_blank" style="display: inline-block; background-color: ${bg}; color: ${fg}; font-family: ${emailTheme.font.family}; font-size: ${emailTheme.font.size.body}px; font-weight: ${emailTheme.font.weight.semibold}; line-height: 44px; padding-left: 22px; padding-right: 22px; border-radius: ${radius}px; text-decoration: none; mso-hide: all;">${safeLabel}</a>
      <!--<![endif]-->
    </td>
  </tr>`;
}

export function htmlToText(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
