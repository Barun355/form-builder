import Link from "next/link";
import { ArrowRight, Mail } from "lucide-react";

import { Button } from "~/components/ui/button";

export function ClosingCta() {
  return (
    <section className="relative overflow-hidden border-t border-border">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/4 via-primary/6 to-primary/2"
      />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 sm:py-28 text-center">
        <h2 className="text-display-lg text-foreground tracking-tight max-w-3xl mx-auto">
          Stop building forms.{" "}
          <span className="text-primary">Start collecting answers.</span>
        </h2>
        <p className="mt-5 text-body-lg text-muted-foreground max-w-xl mx-auto">
          Free forever for indie projects. No credit card. Be live in two minutes.
        </p>
        <div className="mt-8 flex flex-wrap gap-3 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">
              Start building
              <ArrowRight className="size-4 ml-2" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <a href="mailto:hello@simpleform.app">
              <Mail className="size-4 mr-2" />
              Talk to us
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
