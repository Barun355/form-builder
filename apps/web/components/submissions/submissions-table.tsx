"use client";

import * as React from "react";

import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { useFormSubmissions } from "~/hooks/form-submissions";

type Props = {
  formId: string;
  status?: "started" | "completed";
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
  onRowClick: (submissionId: string) => void;
};

function relativeTime(date: Date | null): string {
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 60 / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function SubmissionsTable({
  formId,
  status,
  dateFrom,
  dateTo,
  search,
  onRowClick,
}: Props) {
  const query = useFormSubmissions(
    formId,
    { status, dateFrom, dateTo, search },
  );

  const items = query.data?.pages.flatMap((p) => p?.items ?? []) ?? [];
  const totalCount = query.data?.pages[0]?.totalCount ?? 0;

  return (
    <div className="space-y-3">
      <div className="text-body-sm text-muted-foreground">
        {totalCount} submission{totalCount === 1 ? "" : "s"}
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Status</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead>Device</TableHead>
              <TableHead>Browser</TableHead>
              <TableHead>Source</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {query.isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={`s-${idx}`}>
                  {Array.from({ length: 6 }).map((__, c) => (
                    <TableCell key={c}>
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : query.isError ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-destructive">
                  Failed to load submissions
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {search || status || dateFrom || dateTo
                    ? "No submissions match your filters."
                    : "Awaiting first response."}
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => {
                const meta = (row.meta ?? {}) as Record<string, string | undefined>;
                return (
                  <TableRow
                    key={row.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onRowClick(row.id)}
                  >
                    <TableCell>
                      <span className="text-caps uppercase text-foreground">
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {relativeTime(new Date(row.startedAt))}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {row.submittedAt
                        ? relativeTime(new Date(row.submittedAt))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground capitalize">
                      {meta.deviceType ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {meta.browser ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                      {meta.utmSource ?? meta.referrer ?? "—"}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {query.hasNextPage ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            disabled={query.isFetchingNextPage}
            onClick={() => query.fetchNextPage()}
          >
            {query.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
