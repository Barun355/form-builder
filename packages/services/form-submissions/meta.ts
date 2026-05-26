import { UAParser } from "ua-parser-js";
import type { FormSubmissionMetaI } from "@repo/database/models/form-submissions";

export type ClientMeta = Partial<FormSubmissionMetaI>;

export interface MinimalRequest {
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Extracts a merged meta object from the server-visible request + the
 * client-supplied meta. The server-parsed User-Agent always wins for
 * device/browser/os/userAgent; client-only fields (locale, timezone, screen,
 * utm) are taken from the client.
 */
export function extractMeta(
  req?: MinimalRequest,
  clientMeta?: ClientMeta,
): Partial<FormSubmissionMetaI> {
  const userAgent = headerOf(req?.headers, "user-agent") ?? clientMeta?.userAgent;
  const referrer = clientMeta?.referrer ?? headerOf(req?.headers, "referer");

  let parsed: { deviceType?: string; browser?: string; os?: string } = {};
  if (userAgent) {
    const ua = new UAParser(userAgent).getResult();
    parsed = {
      deviceType: ua.device.type ?? "desktop",
      browser: [ua.browser.name, ua.browser.version].filter(Boolean).join(" "),
      os: [ua.os.name, ua.os.version].filter(Boolean).join(" "),
    };
  }

  return {
    ...(parsed.deviceType && { deviceType: parsed.deviceType }),
    ...(parsed.browser && { browser: parsed.browser }),
    ...(parsed.os && { os: parsed.os }),
    ...(userAgent && { userAgent }),
    ...(clientMeta?.locale && { locale: clientMeta.locale }),
    ...(clientMeta?.timezone && { timezone: clientMeta.timezone }),
    ...(clientMeta?.screenResolution && {
      screenResolution: clientMeta.screenResolution,
    }),
    ...(referrer && { referrer }),
    ...(clientMeta?.utmSource && { utmSource: clientMeta.utmSource }),
    ...(clientMeta?.utmMedium && { utmMedium: clientMeta.utmMedium }),
    ...(clientMeta?.utmCampaign && { utmCampaign: clientMeta.utmCampaign }),
  } as Partial<FormSubmissionMetaI>;
}

function headerOf(
  headers: Record<string, string | string[] | undefined> | undefined,
  name: string,
): string | undefined {
  if (!headers) return undefined;
  const value = headers[name] ?? headers[name.toLowerCase()];
  if (!value) return undefined;
  return Array.isArray(value) ? value[0] : value;
}
