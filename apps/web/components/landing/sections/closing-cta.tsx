"use client";

import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";
import { m } from "framer-motion";

import { Button } from "~/components/ui/button";
import { FadeIn } from "~/components/landing/motion/fade-in";

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/4 via-primary/6 to-primary/2"
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <FadeIn blur>
          <h2 className="text-display-lg text-foreground tracking-tight max-w-3xl mx-auto">
            Stop building forms.{" "}
            <span className="text-primary">Start collecting answers.</span>
          </h2>
        </FadeIn>
        <FadeIn delay={0.1}>
          <p className="mt-5 text-body-lg text-muted-foreground max-w-xl mx-auto">
            Free forever for indie projects. No credit card. Be live in two minutes.
          </p>
        </FadeIn>
        <FadeIn delay={0.2}>
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <m.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Button asChild size="lg">
                <Link href="/signup">
                  Start building
                  <ArrowRight className="size-4 ml-2" />
                </Link>
              </Button>
            </m.div>
            <Button asChild size="lg" variant="ghost">
              <a href="mailto:hello@simpleform.app">
                <Mail className="size-4 mr-2" />
                Talk to us
              </a>
            </Button>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
