"use client";

import { m } from "framer-motion";

import { CountUp } from "~/components/landing/motion/count-up";
import { cn } from "~/lib/utils";

const SEGMENTS = [
  { label: "Desktop", pct: 60, color: "bg-chart-1" },
  { label: "Mobile", pct: 35, color: "bg-chart-2" },
  { label: "Tablet", pct: 5, color: "bg-chart-3" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

export function MiniAudience({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-muted-foreground">Device</span>
        <span className="text-body-sm text-foreground tabular-nums">
          <CountUp to={1531} />
        </span>
      </div>
      {/* Stacked bar: each segment scales out from left over a brief stagger */}
      <div className="flex h-2 rounded-full overflow-hidden">
        {SEGMENTS.map((s, i) => (
          <m.div
            key={s.label}
            className={s.color}
            style={{ width: `${s.pct}%`, transformOrigin: "left center" }}
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.2 + i * 0.08 }}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {SEGMENTS.map((s, i) => (
          <m.div
            key={s.label}
            className="flex items-center gap-1.5"
            initial={{ opacity: 0, y: 4 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10% 0px" }}
            transition={{ duration: 0.4, ease: EASE, delay: 0.55 + i * 0.06 }}
          >
            <span className={cn("size-2 rounded-sm", s.color)} />
            <span className="text-body-sm text-muted-foreground">
              {s.label}
            </span>
            <span className="ml-auto text-body-sm text-foreground tabular-nums">
              <CountUp to={s.pct} suffix="%" />
            </span>
          </m.div>
        ))}
      </div>
    </div>
  );
}
