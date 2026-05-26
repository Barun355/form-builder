import { IconCrown } from "@tabler/icons-react";

import { FEEDBACK_FORM_URL } from "~/lib/feedback-form-url";

type Feature = "analytics" | "submission_detail" | "global_analytics";

const COPY: Record<Feature, { title: string; description: string }> = {
  analytics: {
    title: "Per-form analytics is a Pro feature",
    description:
      "Funnel breakdowns, per-field distributions, and audience cohorts are part of Simple Form Pro. Tell us what you need — we'll reach out the moment paid plans launch.",
  },
  global_analytics: {
    title: "Global analytics is a Pro feature",
    description:
      "Cross-form rollups, audience and UTM breakdowns across your entire workspace ship with Simple Form Pro. Tell us what you'd find most useful and we'll let you know when paid tiers go live.",
  },
  submission_detail: {
    title: "Submission detail is a Pro feature",
    description:
      "Drilling into individual responses, replaying the form against the version they filled, and exporting context-rich payloads are part of Simple Form Pro. Help us prioritize by sharing what you need.",
  },
};

export function PlanLockedFallback({ feature }: { feature: Feature }) {
  const { title, description } = COPY[feature];
  return (
    <div className="mx-auto max-w-3xl p-6 sm:p-10">
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-6 sm:px-10 pt-8 pb-6 border-b border-border">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 text-primary px-3 py-1 text-body-sm font-medium">
            <IconCrown className="size-3.5" />
            Pro feature
          </div>
          <h1 className="mt-4 text-h2 text-foreground">{title}</h1>
          <p className="mt-2 text-body text-muted-foreground max-w-xl">
            {description}
          </p>
        </div>
        <iframe
          src={FEEDBACK_FORM_URL}
          loading="lazy"
          className="w-full h-[640px] border-0"
          title="Simple Form early-access feedback"
        />
      </div>
    </div>
  );
}
