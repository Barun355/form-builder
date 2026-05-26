"use client";

import { m } from "framer-motion";

import { CountUp } from "~/components/landing/motion/count-up";
import { cn } from "~/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;

export function MiniFunnel({ className }: { className?: string }) {
  const started = 1280;
  const reached = 1140;
  const completed = 980;
  const pct = Math.round((completed / started) * 100);
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-4 space-y-3",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-muted-foreground">
          Funnel · last 7d
        </span>
        <span className="text-body-sm text-success font-medium tabular-nums">
          <CountUp to={pct} suffix="%" />
        </span>
      </div>
      <Bar label="Started" value={started} max={started} tone="muted" delay={0.2} />
      <Bar label="Reached page 2" value={reached} max={started} tone="info" delay={0.32} />
      <Bar label="Completed" value={completed} max={started} tone="primary" delay={0.44} />
    </div>
  );
}

function Bar({
  label,
  value,
  max,
  tone,
  delay,
}: {
  label: string;
  value: number;
  max: number;
  tone: "muted" | "info" | "primary";
  delay: number;
}) {
  const pct = Math.round((value / max) * 100);
  const fill =
    tone === "primary"
      ? "bg-primary"
      : tone === "info"
        ? "bg-info"
        : "bg-muted-foreground/40";
  return (
    <div>
      <div className="flex items-center justify-between text-body-sm">
        <span className="text-foreground">{label}</span>
        <span className="text-muted-foreground tabular-nums">
          <CountUp to={value} />
        </span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
        <m.div
          className={cn("h-full rounded-full", fill)}
          style={{ width: `${pct}%`, transformOrigin: "left center" }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, margin: "-10% 0px" }}
          transition={{ duration: 0.9, ease: EASE, delay }}
        />
      </div>
    </div>
  );
}
