"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconArrowRight, IconClipboardText } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { StatusChip } from "~/components/status-chip";
import { useForms } from "~/hooks/form";

function relativeTime(date: Date | string | null): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
}

export function RecentFormsCard() {
  const router = useRouter();
  const { items, isLoading } = useForms({
    limit: 5,
    sort: "updatedAt",
    order: "desc",
  });

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h4 text-foreground">Recent forms</h2>
      </div>

      <div className="flex-1 space-y-1">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 border-b border-border last:border-0"
            >
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8 text-muted-foreground">
            <IconClipboardText
              className="size-8 mb-2 opacity-40"
              strokeWidth={1.5}
            />
            <p className="text-body-sm">No forms yet</p>
          </div>
        ) : (
          items.map((form) => (
            <button
              key={form.id}
              onClick={() => router.push(`/dashboard/forms/${form.id}/edit`)}
              className="flex w-full items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
            >
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <span className="text-body font-medium text-foreground truncate">
                  {form.title}
                </span>
                <StatusChip status={form.status} />
              </div>
              <span className="text-body-sm text-muted-foreground shrink-0 ml-3">
                {relativeTime(form.updatedAt)}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-border">
        <Button asChild variant="ghost" size="sm" className="w-full justify-between">
          <Link href="/dashboard/forms">
            View all forms
            <IconArrowRight className="size-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
