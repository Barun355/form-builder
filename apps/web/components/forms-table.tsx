"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowsSort,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconDotsVertical,
  IconShare,
  IconSortAscending,
  IconSortDescending,
} from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

import { ConfirmDialog } from "~/components/confirm-dialog";
import { ShareFormDialog } from "~/components/share-form-dialog";
import { StatusChip, type FormStatus } from "~/components/status-chip";
import { VersionBadge } from "~/components/version-badge";
import { buildFormPublicUrl } from "~/lib/share-urls";
import { useUser } from "~/hooks/auth";
import {
  useArchiveForm,
  useCloseForm,
  useDuplicateForm,
  useForms,
  usePublishForm,
  useRestoreForm,
  useSoftDeleteForm,
  useUnpublishForm,
} from "~/hooks/form";

type FormRow = {
  id: string;
  title: string;
  description: string | null;
  slug: string;
  status: FormStatus;
  visibility: "PUBLIC" | "UNLISTED";
  publishedVersionId: string | null;
  publishedVersionNumber: number | null;
  currentVersionNumber: number;
  submissionCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
});

type SortField = "updatedAt" | "createdAt" | "title";

function relativeTime(date: Date | null): string {
  if (!date) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return dateFormatter.format(date);
}

function SortableHeader({
  active,
  direction,
  label,
  onToggle,
}: {
  active: boolean;
  direction: "asc" | "desc";
  label: string;
  onToggle: () => void;
}) {
  const Icon = !active
    ? IconArrowsSort
    : direction === "asc"
      ? IconSortAscending
      : IconSortDescending;
  return (
    <Button variant="ghost" size="sm" className="-ml-2 h-8" onClick={onToggle}>
      {label}
      <Icon className="ml-1 size-4" />
    </Button>
  );
}

export function FormsTable() {
  const router = useRouter();
  const { user } = useUser();

  const [pageIndex, setPageIndex] = React.useState(0);
  const [pageSize, setPageSize] = React.useState(10);
  const [searchInput, setSearchInput] = React.useState("");
  const [search, setSearch] = React.useState<string | undefined>(undefined);
  const [sort, setSort] = React.useState<SortField>("updatedAt");
  const [order, setOrder] = React.useState<"asc" | "desc">("desc");

  const [deleteTarget, setDeleteTarget] = React.useState<FormRow | null>(null);
  const [shareTarget, setShareTarget] = React.useState<FormRow | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim() === "" ? undefined : searchInput.trim());
      setPageIndex(0);
    }, 250);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { items, totalCount, isLoading, isError, error } = useForms({
    sort,
    order,
    search,
    limit: pageSize,
    offset: pageIndex * pageSize,
  });

  // Mutations
  const { mutateAsync: publishAsync } = usePublishForm();
  const { mutateAsync: unpublishAsync } = useUnpublishForm();
  const { mutateAsync: archiveAsync } = useArchiveForm();
  const { mutateAsync: closeAsync } = useCloseForm();
  const { mutateAsync: restoreAsync } = useRestoreForm();
  const { duplicateFormAsync } = useDuplicateForm();
  const { softDeleteFormAsync } = useSoftDeleteForm();

  const rows = React.useMemo<FormRow[]>(
    () =>
      items.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        slug: row.slug,
        status: row.status,
        visibility: row.visibility,
        publishedVersionId: row.publishedVersionId,
        publishedVersionNumber: row.publishedVersionNumber,
        currentVersionNumber: row.currentVersionNumber,
        submissionCount: row.submissionCount,
        createdAt: row.createdAt ? new Date(row.createdAt) : null,
        updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
      })),
    [items],
  );

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));
  const canPrev = pageIndex > 0;
  const canNext = pageIndex + 1 < pageCount;

  function toggleSort(field: SortField) {
    if (sort === field) {
      setOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSort(field);
      setOrder("desc");
    }
    setPageIndex(0);
  }

  async function handleAction(
    label: string,
    fn: () => Promise<unknown>,
    successMessage?: string,
  ) {
    try {
      await fn();
      if (successMessage) toast.success(successMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Action failed";
      toast.error(`${label} failed: ${message}`);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <Input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search forms by title or description..."
          className="h-9 max-w-sm"
        />
        <div className="text-sm text-muted-foreground tabular-nums">
          {totalCount} form{totalCount === 1 ? "" : "s"}
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>
                <SortableHeader
                  label="Title"
                  active={sort === "title"}
                  direction={sort === "title" ? order : "desc"}
                  onToggle={() => toggleSort("title")}
                />
              </TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead>
                <SortableHeader
                  label="Updated"
                  active={sort === "updatedAt"}
                  direction={sort === "updatedAt" ? order : "desc"}
                  onToggle={() => toggleSort("updatedAt")}
                />
              </TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <TableRow key={`skeleton-${idx}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-40" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-16" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-8 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-7 w-7" />
                  </TableCell>
                </TableRow>
              ))
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-destructive"
                >
                  Failed to load forms{error?.message ? `: ${error.message}` : ""}
                </TableCell>
              </TableRow>
            ) : rows.length ? (
              rows.map((row) => (
                <TableRow
                  key={row.id}
                  role="button"
                  tabIndex={0}
                  className="group cursor-pointer transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none"
                  onClick={() => router.push(`/dashboard/forms/${row.id}/edit`)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      router.push(`/dashboard/forms/${row.id}/edit`);
                    }
                  }}
                >
                  <TableCell>
                    <span className="font-medium text-foreground">
                      {row.title}
                    </span>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell>
                    <VersionBadge
                      status={row.status}
                      publishedVersionNumber={row.publishedVersionNumber}
                      currentVersionNumber={row.currentVersionNumber}
                    />
                  </TableCell>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 text-mono-sm font-mono text-muted-foreground">
                      {row.slug}
                    </code>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {row.submissionCount}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {relativeTime(row.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                          aria-label="More actions"
                        >
                          <IconDotsVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/forms/${row.id}/edit`)
                          }
                        >
                          Edit
                        </DropdownMenuItem>
                        {row.status !== "draft" ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/forms/${row.id}/submissions`,
                                )
                              }
                            >
                              View submissions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(
                                  `/dashboard/forms/${row.id}/analytics`,
                                )
                              }
                            >
                              View analytics
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        {row.status === "published" ? (
                          <DropdownMenuItem
                            onClick={() => setShareTarget(row)}
                          >
                            <IconShare className="size-4" />
                            Share
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuItem
                          onClick={() =>
                            handleAction(
                              "Duplicate",
                              () => duplicateFormAsync({ id: row.id }),
                              "Form duplicated",
                            )
                          }
                        >
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {row.status === "draft" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                "Publish",
                                () => publishAsync({ id: row.id }),
                                "Form published",
                              )
                            }
                          >
                            Publish
                          </DropdownMenuItem>
                        ) : null}
                        {row.status === "published" ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(
                                  "Unpublish",
                                  () => unpublishAsync({ id: row.id }),
                                  "Form unpublished",
                                )
                              }
                            >
                              Unpublish
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction(
                                  "Close",
                                  () => closeAsync({ id: row.id }),
                                  "Form closed",
                                )
                              }
                            >
                              Close
                            </DropdownMenuItem>
                          </>
                        ) : null}
                        {row.status === "published" ||
                        row.status === "closed" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                "Archive",
                                () => archiveAsync({ id: row.id }),
                                "Form archived",
                              )
                            }
                          >
                            Archive
                          </DropdownMenuItem>
                        ) : null}
                        {row.status === "archived" ||
                        row.status === "closed" ? (
                          <DropdownMenuItem
                            onClick={() =>
                              handleAction(
                                "Restore",
                                () => restoreAsync({ id: row.id }),
                                "Form restored",
                              )
                            }
                          >
                            Restore
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setDeleteTarget(row)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  {search
                    ? `No forms match "${search}"`
                    : "No forms yet. Click \"Create new form\" to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {pageCount} · {totalCount} total
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                setPageSize(Number(value));
                setPageIndex(0);
              }}
            >
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[5, 10, 20, 50, 100].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => setPageIndex(0)}
              disabled={!canPrev}
            >
              <span className="sr-only">First page</span>
              <IconChevronsLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
              disabled={!canPrev}
            >
              <span className="sr-only">Previous page</span>
              <IconChevronLeft />
            </Button>
            <Button
              variant="outline"
              className="size-8"
              size="icon"
              onClick={() => setPageIndex((i) => i + 1)}
              disabled={!canNext}
            >
              <span className="sr-only">Next page</span>
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
              onClick={() => setPageIndex(pageCount - 1)}
              disabled={!canNext}
            >
              <span className="sr-only">Last page</span>
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>

      {shareTarget && user ? (
        <ShareFormDialog
          open={Boolean(shareTarget)}
          onOpenChange={(o) => !o && setShareTarget(null)}
          title={shareTarget.title}
          publicUrl={buildFormPublicUrl({
            origin: window.location.origin,
            userSlug: user.userGlobalFormSlug,
            formSlug: shareTarget.slug,
          })}
          visibility={shareTarget.visibility}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete form?"
        description={
          deleteTarget
            ? `"${deleteTarget.title}" will be hidden and its submissions preserved. You can restore it later from the database.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          await handleAction(
            "Delete",
            () => softDeleteFormAsync({ id: deleteTarget.id }),
            "Form deleted",
          );
        }}
      />
    </div>
  );
}
