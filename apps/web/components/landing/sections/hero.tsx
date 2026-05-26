import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";

import { Button } from "~/components/ui/button";
import { PillBadge } from "~/components/landing/primitives/pill-badge";
import { MiniBuilderCanvas } from "~/components/landing/visuals/mini-builder-canvas";
import { MiniKpiCard } from "~/components/landing/visuals/mini-kpi-card";
import { MiniTrendChart } from "~/components/landing/visuals/mini-trend-chart";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Decorative background — soft primary gradient + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/[0.06] via-background to-background"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-96 opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          maskImage:
            "linear-gradient(to bottom, black 0%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-12 sm:pt-24 sm:pb-20">
        <div className="text-center max-w-3xl mx-auto">
          <PillBadge>
            <Sparkles className="size-3.5 text-primary" />
            Now in beta · 1,531 forms submitted
          </PillBadge>

          <h1 className="mt-6 text-display-lg sm:text-display-xl text-foreground tracking-tight">
            Forms so <span className="text-primary">simple</span>, people
            actually{" "}
            <em className="not-italic underline decoration-primary/70 decoration-2 underline-offset-[6px]">
              finish
            </em>{" "}
            them.
          </h1>

          <p className="mt-6 text-body-lg text-muted-foreground max-w-2xl mx-auto">
            Build, ship, and analyze beautiful forms in minutes — no design
            skills required.
          </p>

          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            <Button asChild size="lg">
              <Link href="/signup">
                Start building
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="#features">
                <Play className="size-3.5 mr-2 fill-current" />
                See it live
              </Link>
            </Button>
          </div>

          <p className="mt-4 text-body-sm text-muted-foreground">
            Free forever for indie projects · Cancel anytime
          </p>
        </div>

        {/* Product visual collage */}
        <div className="relative mt-16 sm:mt-20 max-w-5xl mx-auto">
          <div className="relative">
            {/* Back layer — builder canvas */}
            <MiniBuilderCanvas className="relative z-10 mx-auto max-w-4xl" />

            {/* Floating KPI card — top-right. Pulled inside the container
                at lg- so it doesn't collide with the sticky nav glass. */}
            <div className="hidden md:block absolute right-2 lg:-right-4 -top-6 z-20 animate-in fade-in slide-in-from-right-4 duration-700">
              <MiniKpiCard />
            </div>

            {/* Floating trend chart — bottom-left. Clamped at lg so the
                chart doesn't overflow past viewport at 1024–1100px. */}
            <div className="hidden lg:block absolute left-0 xl:-left-12 -bottom-8 z-20 w-72 animate-in fade-in slide-in-from-left-4 duration-700">
              <MiniTrendChart caption="Submissions · 14d" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
