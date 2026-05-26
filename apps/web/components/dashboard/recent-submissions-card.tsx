"use client";

import { useRouter } from "next/navigation";
import { IconInbox } from "@tabler/icons-react";

import { Skeleton } from "~/components/ui/skeleton";
import { useRecentSubmissions } from "~/hooks/dashboard";

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

export function RecentSubmissionsCard() {
  const router = useRouter();
  const { data, isLoading } = useRecentSubmissions(5);

  return (
    <div className="rounded-2xl border bg-card p-5 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h4 text-foreground">Recent submissions</h2>
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
        ) : !data || data.length === 0 ? (
          <div className="flex flex-col items-center text-center py-8 text-muted-foreground">
            <IconInbox className="size-8 mb-2 opacity-40" strokeWidth={1.5} />
            <p className="text-body-sm">No submissions yet</p>
            <p className="text-body-sm mt-1">
              Submissions will appear here once people start filling out your
              forms.
            </p>
          </div>
        ) : (
          data.map((submission) => (
            <button
              key={submission.id}
              onClick={() =>
                router.push(
                  `/dashboard/forms/${submission.formId}/submissions`,
                )
              }
              className="flex w-full items-center justify-between py-2 border-b border-border last:border-0 hover:bg-muted/50 -mx-2 px-2 rounded transition-colors text-left"
            >
              <span className="text-body font-medium text-foreground truncate flex-1 min-w-0">
                {submission.formTitle}
              </span>
              <span className="text-body-sm text-muted-foreground shrink-0 ml-3">
                {relativeTime(submission.submittedAt)}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
