import { trpc } from "~/trpc/client";

export const useDashboardStats = () => {
  return trpc.dashboard.stats.useQuery();
};

export const useSubmissionTrend = (days: 7 | 30 | 90 = 30) => {
  return trpc.dashboard.submissionTrend.useQuery({ days });
};

export const useRecentSubmissions = (limit = 5) => {
  return trpc.dashboard.recentSubmissions.useQuery({ limit });
};

/**
 * Invalidate every dashboard query at once. Wired to the "Refresh" button.
 */
export const useRefreshDashboard = () => {
  const utils = trpc.useUtils();
  return async () => {
    await Promise.all([
      utils.dashboard.stats.invalidate(),
      utils.dashboard.submissionTrend.invalidate(),
      utils.dashboard.recentSubmissions.invalidate(),
      utils.form.listForms.invalidate(),
    ]);
  };
};
