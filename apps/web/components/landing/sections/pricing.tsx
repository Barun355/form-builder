"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";
import { AnimatePresence, m } from "framer-motion";

import { Button } from "~/components/ui/button";
import { EarlyAccessDialog } from "~/components/landing/early-access-dialog";
import { SectionHeader } from "~/components/landing/motion/section-header";
import { cn } from "~/lib/utils";

type Tier = {
  name: string;
  description: string;
  monthly: number;
  annual: number;
  unit: string;
  cta: { label: string; href: string };
  featured?: boolean;
  /** When true, clicking the CTA opens the early-access feedback dialog
   *  instead of navigating. Used for Pro and Business in v1 since we
   *  haven't built billing yet — we collect demand signal instead. */
  interestOnly?: boolean;
  features: { label: string; included: boolean }[];
};

const TIERS: Tier[] = [
  {
    name: "Free",
    description: "Perfect for indie projects and trying it out.",
    monthly: 0,
    annual: 0,
    unit: "forever",
    cta: { label: "Start free", href: "/signup" },
    features: [
      { label: "Up to 100 submissions / month", included: true },
      { label: "3 forms", included: true },
      { label: "Basic analytics", included: true },
      { label: "Simple Form branding", included: true },
      { label: "Remove branding", included: false },
      { label: "Team workspaces", included: false },
    ],
  },
  {
    name: "Pro",
    description: "For makers and small teams shipping seriously.",
    monthly: 19,
    annual: 190,
    unit: "user",
    featured: true,
    interestOnly: true,
    cta: { label: "Get early access", href: "#" },
    features: [
      { label: "Unlimited submissions", included: true },
      { label: "Unlimited forms", included: true },
      { label: "Full analytics + CSV export", included: true },
      { label: "Remove Simple Form branding", included: true },
      { label: "Custom domains", included: true },
      { label: "Team workspaces", included: false },
    ],
  },
  {
    name: "Business",
    description: "For teams collecting at scale, together.",
    monthly: 49,
    annual: 470,
    unit: "seat",
    interestOnly: true,
    cta: { label: "Get early access", href: "#" },
    features: [
      { label: "Everything in Pro", included: true },
      { label: "Team workspaces & roles", included: true },
      { label: "Custom branding & themes", included: true },
      { label: "API & webhooks", included: true },
      { label: "Priority support", included: true },
      { label: "SSO (SAML / OIDC)", included: true },
    ],
  },
];

export function Pricing() {
  const [interval, setInterval] = React.useState<"monthly" | "annual">(
    "monthly",
  );

  return (
    <section id="pricing" className="bg-muted/30 border-y border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          align="center"
          eyebrow="Pricing"
          title="Free forever. Pay when you scale."
          subtitle="No credit card to start. Switch plans anytime — bill stops the day you cancel."
          titleClassName="text-display-md"
        />

        <div className="mt-8 flex justify-center">
          <div className="inline-flex items-center bg-muted rounded-full p-1 border border-border relative">
            <ToggleButton
              active={interval === "monthly"}
              onClick={() => setInterval("monthly")}
            >
              Monthly
            </ToggleButton>
            <ToggleButton
              active={interval === "annual"}
              onClick={() => setInterval("annual")}
            >
              Annual
              <span className="text-[10px] uppercase tracking-wider text-success font-semibold">
                -20%
              </span>
            </ToggleButton>
          </div>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3 max-w-5xl mx-auto">
          {TIERS.map((tier) => {
            const price =
              interval === "monthly" ? tier.monthly : Math.round(tier.annual / 12);
            const annualNote =
              tier.monthly > 0 && interval === "annual"
                ? `$${tier.annual.toLocaleString()}/year, billed annually`
                : null;
            return (
              <div
                key={tier.name}
                className={cn(
                  "relative rounded-2xl border bg-card p-6 transition-all",
                  // Add top margin on mobile so the "Most popular" badge has
                  // breathing room from the tier above; remove at lg+ where
                  // the lift translation handles it.
                  tier.featured
                    ? "border-primary shadow-lg mt-4 lg:mt-0 lg:-translate-y-2 bg-primary/2"
                    : "border-border shadow-xs",
                )}
              >
                {tier.featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center bg-primary text-primary-foreground text-[10px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <h3 className="text-h3 text-foreground">{tier.name}</h3>
                <p className="mt-1 text-body-sm text-muted-foreground">
                  {tier.description}
                </p>
                <div className="mt-6 flex items-baseline gap-1">
                  {/* Price swap — popLayout slides old out / new in. Per
                      research: NOT a count-up tween (gimmicky for a
                      2-value swap), just a 180ms slide-fade. */}
                  <AnimatePresence mode="popLayout" initial={false}>
                    <m.span
                      key={`${tier.name}-${price}`}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -8, opacity: 0 }}
                      transition={{
                        duration: 0.18,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="text-display-md text-foreground tabular-nums tracking-tight inline-block"
                    >
                      ${price}
                    </m.span>
                  </AnimatePresence>
                  <span className="text-body-sm text-muted-foreground">
                    {tier.monthly > 0 ? `/mo · per ${tier.unit}` : `· ${tier.unit}`}
                  </span>
                </div>
                {/* Reserve space for the annual note so all three tier
                    cards align their CTAs at the same y-position. */}
                <div className="mt-1 min-h-5">
                  <AnimatePresence mode="wait" initial={false}>
                    {annualNote && (
                      <m.p
                        key={annualNote}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.18 }}
                        className="text-body-sm text-muted-foreground"
                      >
                        {annualNote}
                      </m.p>
                    )}
                  </AnimatePresence>
                </div>

                {tier.interestOnly ? (
                  <EarlyAccessDialog>
                    <Button
                      size="lg"
                      className="mt-6 w-full"
                      variant={tier.featured ? "default" : "outline"}
                    >
                      {tier.cta.label}
                    </Button>
                  </EarlyAccessDialog>
                ) : (
                  <Button
                    asChild
                    size="lg"
                    className="mt-6 w-full"
                    variant={tier.featured ? "default" : "outline"}
                  >
                    <Link href={tier.cta.href}>{tier.cta.label}</Link>
                  </Button>
                )}

                <ul className="mt-6 space-y-3">
                  {tier.features.map((f) => (
                    <li
                      key={f.label}
                      className="flex items-start gap-2.5 text-body-sm"
                    >
                      {f.included ? (
                        <Check className="size-4 text-success mt-0.5 shrink-0" />
                      ) : (
                        <Minus className="size-4 text-muted-foreground/60 mt-0.5 shrink-0" />
                      )}
                      <span
                        className={cn(
                          f.included
                            ? "text-foreground"
                            : "text-muted-foreground/70 line-through decoration-muted-foreground/50",
                        )}
                      >
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Toggle button with a shared-layout active pill. The active background
 * uses `layoutId` so framer-motion smoothly slides it between the two
 * buttons when the selection changes. The most-noticed micro-interaction
 * on the page.
 */
function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors inline-flex items-center gap-2 z-10",
        active
          ? "text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {active && (
        <m.span
          layoutId="pricing-toggle-active"
          className="absolute inset-0 rounded-full bg-card shadow-xs -z-10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      {children}
    </button>
  );
}
