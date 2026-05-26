"use client";

import {
  IconAbc,
  IconAt,
  IconCalendar,
  IconChevronDown,
  IconCircleDot,
  IconHash,
  IconList,
  IconSquare,
} from "@tabler/icons-react";
import { m } from "framer-motion";

import { cn } from "~/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

const PALETTE = [
  { Icon: IconAbc, label: "Text" },
  { Icon: IconAt, label: "Email" },
  { Icon: IconHash, label: "Number" },
  { Icon: IconChevronDown, label: "Select" },
  { Icon: IconCircleDot, label: "Radio" },
  { Icon: IconSquare, label: "Checkbox" },
  { Icon: IconCalendar, label: "Date" },
  { Icon: IconList, label: "Long text" },
];

export function MiniBuilderCanvas({
  className,
  tilt = false,
}: {
  className?: string;
  tilt?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card shadow-xl overflow-hidden",
        // h-full lets the canvas stretch when its parent gives it height
        // (hero bento cell); falls back to intrinsic height elsewhere.
        "flex flex-col h-full",
        tilt && "-rotate-[1.5deg]",
        className,
      )}
    >
      {/* Top bar — fixed height */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2 shrink-0">
        <div className="flex gap-1.5">
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
          <span className="size-2.5 rounded-full bg-muted-foreground/20" />
        </div>
        <span className="ml-2 text-body-sm text-muted-foreground font-mono">
          customer-feedback
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] text-success uppercase tracking-wider font-semibold">
          <span className="size-1.5 rounded-full bg-success" />
          Saved
        </span>
      </div>

      {/* Body grows to fill remaining height; min keeps it readable when
          the parent gives no explicit height (small/mobile contexts). */}
      <div className="grid grid-cols-[140px_1fr] flex-1 min-h-[300px]">
        {/* Palette */}
        <div className="border-r border-border bg-muted/40 p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Elements
          </p>
          {PALETTE.map(({ Icon, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-body-sm text-foreground hover:bg-card transition-colors"
            >
              <Icon className="size-3.5 text-muted-foreground" />
              <span className="truncate">{label}</span>
            </div>
          ))}
        </div>

        {/* Canvas — field blocks stream in top-down, simulating
            dragging-onto-canvas. Stagger 80ms, starts 200ms after parent. */}
        <m.div
          className="p-5 space-y-3"
          style={{
            backgroundImage:
              "radial-gradient(var(--canvas-grid) 1px, transparent 1px)",
            backgroundSize: "16px 16px",
            backgroundColor: "var(--canvas)",
          }}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={{
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
          }}
        >
          <FieldBlockMock label="Your name" type="Text" required />
          <FieldBlockMock label="Work email" type="Email" required />
          <FieldBlockMock label="Overall satisfaction" type="Single choice" dragging />
          <FieldBlockMock label="What should we improve?" type="Long text" />
        </m.div>
      </div>
    </div>
  );
}

function FieldBlockMock({
  label,
  type,
  required,
  dragging,
}: {
  label: string;
  type: string;
  required?: boolean;
  dragging?: boolean;
}) {
  return (
    <m.div
      variants={fieldVariants}
      className={cn(
        "rounded-lg border bg-card px-3 py-2.5 shadow-xs transition-all",
        dragging
          ? "border-primary shadow-lg ring-2 ring-primary/20 -rotate-1"
          : "border-border",
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-body text-foreground font-medium">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </span>
        <span className="text-[10px] text-muted-foreground font-mono uppercase">
          {type}
        </span>
      </div>
      <div className="mt-2 h-7 rounded-md border border-dashed border-border bg-background/60" />
    </m.div>
  );
}
