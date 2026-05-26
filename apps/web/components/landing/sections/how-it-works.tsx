"use client";

import { IconChartBar, IconCursorText, IconLink } from "@tabler/icons-react";
import { m } from "framer-motion";

import { SectionHeader } from "~/components/landing/motion/section-header";

const EASE = [0.22, 1, 0.36, 1] as const;
const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const STEPS = [
  {
    n: "01",
    title: "Build",
    body: "Drag fields onto the canvas. Reorder, configure, preview — instant.",
    Icon: IconCursorText,
  },
  {
    n: "02",
    title: "Share",
    body: "Get a public link. Embed anywhere. Mobile-first by default.",
    Icon: IconLink,
  },
  {
    n: "03",
    title: "Analyze",
    body: "Per-field distributions, funnels, and UTM cohorts — built in.",
    Icon: IconChartBar,
  },
];

export function HowItWorks() {
  return (
    <section className="bg-muted/30 border-y border-border py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          align="center"
          eyebrow="How it works"
          title="Three steps. Zero learning curve."
          titleClassName="text-display-md"
        />

        <div className="mt-16 relative">
          {/* Dashed line below the number circles, connecting their bottoms. */}
          <div
            aria-hidden
            className="hidden md:block absolute top-20 left-[16.7%] right-[16.7%] border-t-2 border-dashed border-primary/20"
          />

          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-10% 0px" }}
            variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
            className="relative grid gap-8 md:grid-cols-3"
          >
            {STEPS.map(({ n, title, body, Icon }) => (
              <m.div
                key={n}
                variants={stepVariants}
                className="relative bg-card border border-border rounded-2xl p-6 text-center transition-all duration-200 hover:border-primary/30 hover:-translate-y-0.5"
              >
                <div className="mx-auto size-14 rounded-full bg-primary/10 ring-4 ring-card flex items-center justify-center text-primary font-mono text-h3 font-semibold tabular-nums">
                  {n}
                </div>
                <div className="mt-5 inline-flex items-center gap-2">
                  <Icon className="size-4 text-muted-foreground" />
                  <h3 className="text-h3 text-foreground">{title}</h3>
                </div>
                <p className="mt-2 text-body text-muted-foreground max-w-xs mx-auto">
                  {body}
                </p>
              </m.div>
            ))}
          </m.div>
        </div>
      </div>
    </section>
  );
}
