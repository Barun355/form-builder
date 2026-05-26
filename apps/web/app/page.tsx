import type { Metadata } from "next";

import { LandingNav } from "~/components/landing/landing-nav";
import { LandingFooter } from "~/components/landing/landing-footer";
import { Hero } from "~/components/landing/sections/hero";
import { SocialProofBar } from "~/components/landing/sections/social-proof-bar";
import { FeatureBento } from "~/components/landing/sections/feature-bento";
import { HowItWorks } from "~/components/landing/sections/how-it-works";
import { Templates } from "~/components/landing/sections/templates";
import { Testimonials } from "~/components/landing/sections/testimonials";
import { Pricing } from "~/components/landing/sections/pricing";
import { Faq } from "~/components/landing/sections/faq";
import { ClosingCta } from "~/components/landing/sections/closing-cta";

export const metadata: Metadata = {
  title: "Simple Form — Forms so simple, people actually finish them",
  description:
    "Build, ship, and analyze beautiful forms in minutes. Ten ready-made templates, real-time analytics, free forever for indie projects.",
  openGraph: {
    title: "Simple Form",
    description:
      "Forms so simple, people actually finish them. Free forever for indie projects.",
    type: "website",
  },
};

export default function LandingPage() {
  return (
    <div className="min-h-svh flex flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <Hero />
        <SocialProofBar />
        <FeatureBento />
        <HowItWorks />
        <Templates />
        <Testimonials />
        <Pricing />
        <Faq />
        <ClosingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
