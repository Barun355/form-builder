"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import {
  m,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";

import { Button } from "~/components/ui/button";
import { PillBadge } from "~/components/landing/primitives/pill-badge";
import { MiniBuilderCanvas } from "~/components/landing/visuals/mini-builder-canvas";
import { MiniKpiCard } from "~/components/landing/visuals/mini-kpi-card";
import { MiniTrendChart } from "~/components/landing/visuals/mini-trend-chart";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function Hero() {
  // Mouse parallax for floating overlays. KPI and chart move in opposite
  // directions (depth cue). Springs smooth raw mouse jitter. Capped at
  // ±8px per research — anything more reads as a portfolio gimmick.
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const kpiX = useSpring(useTransform(mouseX, [-1, 1], [-8, 8]), {
    stiffness: 150,
    damping: 20,
  });
  const kpiY = useSpring(useTransform(mouseY, [-1, 1], [-6, 6]), {
    stiffness: 150,
    damping: 20,
  });
  const chartX = useSpring(useTransform(mouseX, [-1, 1], [8, -8]), {
    stiffness: 150,
    damping: 20,
  });
  const chartY = useSpring(useTransform(mouseY, [-1, 1], [6, -6]), {
    stiffness: 150,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Normalize to [-1, 1] from card center.
    mouseX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    mouseY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  return (
    <section className="relative overflow-hidden">
      {/* Decorative background — soft primary gradient + grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-linear-to-b from-primary/6 via-background to-background"
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
          {/* Pill — spring entrance, slightly before headline */}
          <m.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 380,
              damping: 30,
              mass: 0.6,
            }}
          >
            <PillBadge>
              <Sparkles className="size-3.5 text-primary" />
              Now in beta · 1,531 forms submitted
            </PillBadge>
          </m.div>

          {/* Headline — whole-line fade-up (NOT word-by-word per research) */}
          <m.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.05 }}
            className="mt-6 text-display-lg sm:text-display-xl text-foreground tracking-tight"
          >
            Forms so <span className="text-primary">simple</span>, people
            actually{" "}
            <em className="not-italic underline decoration-primary/70 decoration-2 underline-offset-[6px]">
              finish
            </em>{" "}
            them.
          </m.h1>

          <m.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.15 }}
            className="mt-6 text-body-lg text-muted-foreground max-w-2xl mx-auto"
          >
            Build, ship, and analyze beautiful forms in minutes — no design
            skills required.
          </m.p>

          <m.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.25 }}
            className="mt-8 flex flex-wrap gap-3 justify-center"
          >
            {/* Primary CTA gets the subtle scale-on-hover/press. Secondary
                stays static — every-button-jitters reads jittery. */}
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
              <Link href="#features">
                <Play className="size-3.5 mr-2 fill-current" />
                See it live
              </Link>
            </Button>
          </m.div>

          <m.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, ease: EASE, delay: 0.35 }}
            className="mt-4 text-body-sm text-muted-foreground"
          >
            Free forever for indie projects · Cancel anytime
          </m.p>
        </div>

        {/* Product visual collage — the Vercel-signature blur-in reveal */}
        <m.div
          initial={{ opacity: 0, y: 16, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.35 }}
          onMouseMove={handleMouseMove}
          className="relative mt-16 sm:mt-20 max-w-5xl mx-auto"
        >
          <div className="relative">
            {/* Back layer — builder canvas */}
            <MiniBuilderCanvas className="relative z-10 mx-auto max-w-4xl" />

            {/* Floating KPI card — moves with cursor (+x, +y) */}
            <m.div
              style={{ x: kpiX, y: kpiY }}
              className="hidden md:block absolute right-2 lg:-right-4 -top-6 z-20"
            >
              <MiniKpiCard />
            </m.div>

            {/* Floating trend chart — moves opposite to KPI (depth cue) */}
            <m.div
              style={{ x: chartX, y: chartY }}
              className="hidden lg:block absolute left-0 xl:-left-12 -bottom-8 z-20 w-72"
            >
              <MiniTrendChart caption="Submissions · 14d" />
            </m.div>
          </div>
        </m.div>
      </div>
    </section>
  );
}
