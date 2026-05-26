"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { m } from "framer-motion";

import { SectionHeader } from "~/components/landing/motion/section-header";
import { templates, type TemplateAccent } from "~/lib/templates";
import { cn } from "~/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

const ACCENT_CLASSES: Record<TemplateAccent, string> = {
  primary: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/15 text-success border-success/30",
  warning: "bg-warning/15 text-warning border-warning/30",
  info: "bg-info/15 text-info border-info/30",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
};

export function Templates() {
  return (
    <section id="templates" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <SectionHeader
            eyebrow="Templates"
            title={<>Don&apos;t start from scratch.</>}
            subtitle="Ten battle-tested templates. Pick one, tweak it, ship it."
            titleClassName="text-display-md"
          />
          <Link
            href="/signup"
            className="inline-flex items-center text-body-sm text-primary hover:underline"
          >
            Browse all templates
            <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </div>

        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={{ visible: { transition: { staggerChildren: 0.04 } } }}
          className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {templates.map((t) => (
            <m.div key={t.slug} variants={cardVariants}>
            <Link
              href={`/signup?template=${t.slug}`}
              className="group flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full"
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={cn(
                    "inline-flex items-center text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border",
                    ACCENT_CLASSES[t.accent],
                  )}
                >
                  {t.tag}
                </span>
                <span className="inline-flex items-center gap-1 text-body-sm text-muted-foreground">
                  <FileText className="size-3.5" />
                  {t.fieldCount}
                </span>
              </div>
              {/* min-h holds 2 lines of h4 so cards align across the grid */}
              <h3 className="text-h4 text-foreground min-h-14">{t.title}</h3>
              <p className="mt-1 text-body-sm text-muted-foreground line-clamp-2">
                {t.description}
              </p>
              <div className="mt-4 space-y-1.5">
                {t.fieldLabels.slice(0, 3).map((label) => (
                  <div
                    key={label}
                    className="flex items-center gap-2 rounded-md border border-dotted border-border/60 bg-muted/40 px-2 py-1.5 text-body-sm text-muted-foreground"
                  >
                    <span className="size-1 rounded-full bg-muted-foreground/40" />
                    <span className="truncate">{label}</span>
                  </div>
                ))}
                {t.fieldLabels.length > 3 && (
                  <p className="text-body-sm text-muted-foreground pl-2">
                    + {t.fieldLabels.length - 3} more
                  </p>
                )}
              </div>
              {/* mt-auto pins to bottom; always rendered (no CLS) but
                  fades in fully on hover for a discoverable affordance. */}
              <div className="mt-auto pt-5 inline-flex items-center text-body-sm text-primary font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                Use template
                <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
