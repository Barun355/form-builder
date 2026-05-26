"use client";

import Link from "next/link";
import { ArrowRight, Compass, Users } from "lucide-react";
import { m } from "framer-motion";

import { SectionHeader } from "~/components/landing/motion/section-header";
import { Skeleton } from "~/components/ui/skeleton";
import { trpc } from "~/trpc/client";

const EASE = [0.22, 1, 0.36, 1] as const;
const cardVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
};

export function FeaturedForms() {
  const { data, isLoading } = trpc.form.listPublic.useQuery({ limit: 6 });
  const items = data?.items ?? [];

  if (!isLoading && items.length === 0) return null;

  return (
    <section id="explore" className="py-20 sm:py-28 bg-muted/20 border-y border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6">
          <SectionHeader
            eyebrow="Explore"
            title={<>See what others are shipping.</>}
            subtitle="Live forms built by the Simple Form community. Pop one open to see how it's structured — then build your own."
            titleClassName="text-display-md"
          />
          <Link
            href="/explore"
            className="inline-flex items-center text-body-sm text-primary hover:underline"
          >
            See all public forms
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
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-border bg-card p-5"
                >
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="mt-3 h-6 w-3/4" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1 h-4 w-2/3" />
                  <Skeleton className="mt-6 h-4 w-24" />
                </div>
              ))
            : items.map((f) => (
                <m.div key={f.id} variants={cardVariants}>
                  <Link
                    href={`/u/${f.userSlug}/${f.formSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="inline-flex items-center gap-1 text-caps text-primary px-2 py-0.5 rounded-full border border-primary/20 bg-primary/10">
                        <Compass className="size-3" />
                        Public
                      </span>
                      <span className="inline-flex items-center gap-1 text-body-sm text-muted-foreground tabular-nums">
                        <Users className="size-3.5" />
                        {f.submissionCount}
                      </span>
                    </div>
                    <h3 className="text-h4 text-foreground line-clamp-2">
                      {f.title}
                    </h3>
                    {f.description ? (
                      <p className="mt-1 text-body-sm text-muted-foreground line-clamp-2">
                        {f.description}
                      </p>
                    ) : null}
                    <div className="mt-auto pt-5 inline-flex items-center text-body-sm text-primary font-medium opacity-60 group-hover:opacity-100 transition-opacity">
                      Open form
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
