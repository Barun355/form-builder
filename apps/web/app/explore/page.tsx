"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Compass, Users } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { LandingFooter } from "~/components/landing/landing-footer";
import { LandingNav } from "~/components/landing/landing-nav";
import { trpc } from "~/trpc/client";

const PAGE_SIZE = 24;

export default function ExplorePage() {
  const [pageIndex, setPageIndex] = React.useState(0);

  const { data, isLoading, isFetching } = trpc.form.listPublic.useQuery({
    limit: PAGE_SIZE,
    offset: pageIndex * PAGE_SIZE,
  });

  const items = data?.items ?? [];
  const totalCount = data?.totalCount ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const canPrev = pageIndex > 0;
  const canNext = pageIndex + 1 < pageCount;

  return (
    <div className="min-h-svh flex flex-col bg-background">
      <LandingNav />
      <main className="flex-1">
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <p className="text-caps uppercase text-primary text-xs tracking-wider font-semibold">
                Explore
              </p>
              <h1 className="mt-3 text-display-md text-foreground tracking-tight">
                Real forms from the community.
              </h1>
              <p className="mt-4 text-body text-muted-foreground">
                A live feed of every public form on Simple Form, ordered by
                submission count. Pop one open to see how it&apos;s structured,
                then{" "}
                <Link href="/signup" className="text-primary hover:underline">
                  build your own
                </Link>
                .
              </p>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
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
              ) : items.length === 0 ? (
                <div className="col-span-full rounded-2xl border border-dashed border-border bg-muted/30 p-12 text-center">
                  <Compass className="mx-auto size-8 text-muted-foreground" />
                  <p className="mt-4 text-h4 text-foreground">
                    No public forms yet
                  </p>
                  <p className="mt-2 text-body-sm text-muted-foreground">
                    Public forms appear here as soon as someone marks one as
                    public.
                  </p>
                  <Button asChild className="mt-6">
                    <Link href="/signup">
                      Build the first one
                      <ArrowRight className="size-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              ) : (
                items.map((f) => (
                  <Link
                    key={f.id}
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
                ))
              )}
            </div>

            {pageCount > 1 ? (
              <div className="mt-10 flex items-center justify-between gap-4">
                <p className="text-body-sm text-muted-foreground tabular-nums">
                  Page {pageIndex + 1} of {pageCount} · {totalCount} public form
                  {totalCount === 1 ? "" : "s"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
                    disabled={!canPrev || isFetching}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPageIndex((i) => i + 1)}
                    disabled={!canNext || isFetching}
                  >
                    Next
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
