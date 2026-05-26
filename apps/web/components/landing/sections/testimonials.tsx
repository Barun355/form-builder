"use client";

import { Quote } from "lucide-react";
import { m } from "framer-motion";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { SectionHeader } from "~/components/landing/motion/section-header";
import { cn } from "~/lib/utils";

const EASE = [0.22, 1, 0.36, 1] as const;
const cardVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

const QUOTES = [
  {
    quote:
      "Cut our form-build time from two days to twenty minutes. The funnel view caught a drop-off we'd been blind to for months.",
    name: "Maya Reddy",
    role: "Head of Product",
    company: "Northwind",
    initials: "MR",
    accent: "bg-primary/15 text-primary",
  },
  {
    quote:
      "We replaced three different SaaS tools with Simple Form on a weekend. Submission rates went up, not down.",
    name: "Jordan Lee",
    role: "Engineering Manager",
    company: "Loftwell",
    initials: "JL",
    accent: "bg-info/15 text-info",
  },
  {
    quote:
      "Templates that actually look like what we'd build ourselves. Per-field analytics nobody else ships out of the box.",
    name: "Anu Sharma",
    role: "Solo founder",
    company: "Trailbend",
    initials: "AS",
    accent: "bg-success/15 text-success",
  },
];

export function Testimonials() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          align="center"
          eyebrow="Loved by builders"
          title="Real teams, real outcomes."
          titleClassName="text-display-md"
        />

        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-10% 0px" }}
          variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
          className="mt-12 grid gap-5 md:grid-cols-3"
        >
          {QUOTES.map((q) => (
            <m.div
              key={q.name}
              variants={cardVariants}
              className="rounded-2xl border border-border bg-card p-6 flex flex-col"
            >
              <Quote className="size-5 text-primary/60 mb-3" />
              <p className="text-body text-foreground leading-relaxed flex-1">
                {q.quote}
              </p>
              <div className="mt-6 flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className={cn(q.accent, "font-medium")}>
                    {q.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm text-foreground font-medium">
                    {q.name}
                  </p>
                  <p className="text-body-sm text-muted-foreground truncate">
                    {q.role} · {q.company}
                  </p>
                </div>
              </div>
            </m.div>
          ))}
        </m.div>
      </div>
    </section>
  );
}
