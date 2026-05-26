"use client";

import { m } from "framer-motion";

import { cn } from "~/lib/utils";

const ROWS = [
  { initials: "MR", name: "Maya R.", role: "Product feedback", time: "just now", color: "bg-primary/15 text-primary" },
  { initials: "JL", name: "Jordan L.", role: "Bug report", time: "2m ago", color: "bg-info/15 text-info" },
  { initials: "AS", name: "Anu S.", role: "Newsletter", time: "5m ago", color: "bg-success/15 text-success" },
];

const EASE = [0.22, 1, 0.36, 1] as const;
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export function MiniSubmissionsList({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className,
      )}
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-body-sm font-medium text-foreground">
          Recent submissions
        </span>
        <span className="inline-flex items-center gap-1.5 text-body-sm text-muted-foreground">
          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
          Live
        </span>
      </div>
      {/* Rows stream in top-down, simulating live submissions landing */}
      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-10% 0px" }}
        variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } } }}
        className="divide-y divide-border"
      >
        {ROWS.map((r) => (
          <m.div
            key={r.name}
            variants={rowVariants}
            className="flex items-center gap-3 px-4 py-3"
          >
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center text-body-sm font-medium tabular-nums",
                r.color,
              )}
            >
              {r.initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm text-foreground truncate">{r.name}</p>
              <p className="text-body-sm text-muted-foreground truncate">
                {r.role}
              </p>
            </div>
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {r.time}
            </span>
          </m.div>
        ))}
      </m.div>
    </div>
  );
}
