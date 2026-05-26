import { trpc } from "~/trpc/client";

// ─── per-form ──────────────────────────────────────────────────────────────

export const useFormAnalyticsKpis = (formId: string | undefined) => {
  return trpc.analytics.form.kpis.useQuery(
    { formId: formId ?? "" },
    { enabled: Boolean(formId) },
  );
};

export const useFormAnalyticsTrend = (
  formId: string | undefined,
  days: 7 | 30 | 90 = 30,
) => {
  return trpc.analytics.form.trend.useQuery(
    { formId: formId ?? "", days },
    { enabled: Boolean(formId) },
  );
};

export const useFormAnalyticsAudience = (formId: string | undefined) => {
  return trpc.analytics.form.audience.useQuery(
    { formId: formId ?? "" },
    { enabled: Boolean(formId) },
  );
};

export const useFormAnalyticsFields = (formId: string | undefined) => {
  return trpc.analytics.form.fields.useQuery(
    { formId: formId ?? "" },
    { enabled: Boolean(formId) },
  );
};

// ─── global ────────────────────────────────────────────────────────────────

export const useGlobalAnalyticsKpis = () => {
  return trpc.analytics.global.kpis.useQuery();
};

export const useGlobalAnalyticsTopForms = (limit = 10) => {
  return trpc.analytics.global.topForms.useQuery({ limit });
};

export const useGlobalAnalyticsAudience = () => {
  return trpc.analytics.global.audience.useQuery();
};

// ─── refresh ───────────────────────────────────────────────────────────────

export const useRefreshFormAnalytics = (formId: string | undefined) => {
  const utils = trpc.useUtils();
  return async () => {
    if (!formId) return;
    await Promise.all([
      utils.analytics.form.kpis.invalidate({ formId }),
      utils.analytics.form.trend.invalidate({ formId }),
      utils.analytics.form.audience.invalidate({ formId }),
      utils.analytics.form.fields.invalidate({ formId }),
    ]);
  };
};

export const useRefreshGlobalAnalytics = () => {
  const utils = trpc.useUtils();
  return async () => {
    await Promise.all([
      utils.analytics.global.kpis.invalidate(),
      utils.analytics.global.topForms.invalidate(),
      utils.analytics.global.audience.invalidate(),
    ]);
  };
};
