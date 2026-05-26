/**
 * Subscription plan limits and capability matrix.
 *
 * Single source of truth — referenced by:
 *   - Pricing card display copy (apps/web/components/landing/sections/pricing.tsx)
 *   - Form-creation cap check (packages/services/form/index.ts)
 *   - Submission-visibility cutoff (packages/services/plan-gating.ts)
 *   - Route-level access guards (packages/trpc/server/trpc.ts paidProcedure)
 *
 * Public submission acceptance is INTENTIONALLY not gated by plan —
 * users never lose data, they just lose visibility above their cap.
 */
export const PLANS = {
  free: {
    label: "Free",
    /** Latest N completed submissions per calendar month visible to owner */
    monthlySubmissionsVisible: 100,
    /** Max non-deleted forms the owner can create */
    formLimit: 3,
    /** Access to per-form + global analytics pages */
    advancedAnalytics: false,
    /** Access to individual submission detail page */
    submissionDetailAccess: false,
  },
  pro: {
    label: "Pro",
    monthlySubmissionsVisible: Number.POSITIVE_INFINITY,
    formLimit: Number.POSITIVE_INFINITY,
    advancedAnalytics: true,
    submissionDetailAccess: true,
  },
  business: {
    label: "Business",
    monthlySubmissionsVisible: Number.POSITIVE_INFINITY,
    formLimit: Number.POSITIVE_INFINITY,
    advancedAnalytics: true,
    submissionDetailAccess: true,
  },
} as const;

export type Plan = keyof typeof PLANS;

export function isPaidPlan(plan: Plan): boolean {
  return plan !== "free";
}
