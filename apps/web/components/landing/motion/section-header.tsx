"use client";

import * as React from "react";
import { m } from "framer-motion";

import { cn } from "~/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Eyebrow + h2 + subhead with a 70ms stagger between them.
 * Used across 7 sections (FeatureBento, HowItWorks, Templates, Testimonials,
 * Pricing, FAQ, ClosingCta). 60–80ms is the premium feel — 150ms+ reads
 * as theatrical demo.
 */
const child = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "left",
  className,
  titleClassName,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  align?: "left" | "center";
  className?: string;
  titleClassName?: string;
}) {
  return (
    <m.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-10% 0px" }}
      variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
      className={cn(
        align === "center" ? "text-center max-w-2xl mx-auto" : "max-w-2xl",
        className,
      )}
    >
      {eyebrow && (
        <m.p
          variants={child}
          className="text-caps uppercase text-primary text-xs tracking-wider font-semibold"
        >
          {eyebrow}
        </m.p>
      )}
      <m.h2
        variants={child}
        className={cn(
          "mt-2 text-display-md sm:text-display-lg text-foreground tracking-tight",
          titleClassName,
        )}
      >
        {title}
      </m.h2>
      {subtitle && (
        <m.p
          variants={child}
          className="mt-4 text-body-lg text-muted-foreground"
        >
          {subtitle}
        </m.p>
      )}
    </m.div>
  );
}
