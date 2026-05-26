"use client";

import { TrendingUp } from "lucide-react";
import { m } from "framer-motion";

import { CountUp } from "~/components/landing/motion/count-up";

const EASE = [0.22, 1, 0.36, 1] as const;

export function MiniKpiCard({
  label = "Completion rate",
  value = 68,
  delta = "+18%",
  progress = 0.67,
}: {
  label?: string;
  value?: number;
  delta?: string;
  /** Fill ratio of the progress bar (0–1). */
  progress?: number;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-lg w-full max-w-56 min-w-48">
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-muted-foreground">{label}</span>
        <m.span
          className="inline-flex items-center gap-1 text-body-sm text-success"
          initial={{ opacity: 0, y: -4 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{
            type: "spring",
            stiffness: 380,
            damping: 22,
            delay: 0.9,
          }}
        >
          <TrendingUp className="size-3.5" />
          {delta}
        </m.span>
      </div>
      <p className="mt-2 text-h2 text-foreground tabular-nums">
        <CountUp to={value} suffix="%" duration={1.4} />
      </p>
      <div className="mt-3 h-1.5 rounded-full bg-muted overflow-hidden">
        <m.div
          className="h-full rounded-full bg-primary"
          style={{ width: `${progress * 100}%`, transformOrigin: "left center" }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 1.0, ease: EASE, delay: 0.3 }}
        />
      </div>
    </div>
  );
}
