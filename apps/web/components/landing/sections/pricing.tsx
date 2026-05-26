"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Minus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

type Tier = {
  name: string;
  description: string;
  monthly: number;
  annual: number;
  unit: string;
  cta: { label: string; href: string };
  featured?: boolean;
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
    cta: { label: "Start 14-day trial", href: "/signup?plan=pro" },
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
    cta: { label: "Contact sales", href: "mailto:hello@simpleform.app" },
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
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-caps uppercase text-primary text-xs tracking-wider font-semibold">
            Pricing
          </p>
          <h2 className="mt-2 text-display-md text-foreground tracking-tight">
            Free forever. Pay when you scale.
          </h2>
          <p className="mt-3 text-body-lg text-muted-foreground">
            No credit card to start. Switch plans anytime — bill stops the day
            you cancel.
          </p>

          <div className="mt-8 inline-flex items-center bg-muted rounded-full p-1 border border-border">
            <button
              type="button"
              onClick={() => setInterval("monthly")}
              className={cn(
                "px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors",
                interval === "monthly"
                  ? "bg-card shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval("annual")}
              className={cn(
                "px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors inline-flex items-center gap-2",
                interval === "annual"
                  ? "bg-card shadow-xs text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Annual
              <span className="text-[10px] uppercase tracking-wider text-success font-semibold">
                -20%
              </span>
            </button>
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
                  <span className="text-display-md text-foreground tabular-nums tracking-tight">
                    ${price}
                  </span>
                  <span className="text-body-sm text-muted-foreground">
                    {tier.monthly > 0 ? `/mo · per ${tier.unit}` : `· ${tier.unit}`}
                  </span>
                </div>
                {/* Reserve space for the annual note so all three tier
                    cards align their CTAs at the same y-position. */}
                <p className="mt-1 text-body-sm text-muted-foreground min-h-5">
                  {annualNote}
                </p>

                <Button
                  asChild
                  size="lg"
                  className="mt-6 w-full"
                  variant={tier.featured ? "default" : "outline"}
                >
                  <Link href={tier.cta.href}>{tier.cta.label}</Link>
                </Button>

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
