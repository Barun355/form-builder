"use client";

import * as React from "react";
import { IconChevronDown, IconHistory, IconTrash } from "@tabler/icons-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";
import { ConfirmDialog } from "~/components/confirm-dialog";
import {
  useDeleteVersion,
  useFormVersion,
  useFormVersions,
} from "~/hooks/form-versions";
import type { BuilderState } from "./store";

type Props = {
  state: BuilderState;
};

export function VersionDropdown({ state }: Props) {
  const {
    formId,
    versions,
    selectedVersionId,
    publishedVersionId,
    isDirty,
    switchVersion,
    setVersions,
  } = state;

  const [open, setOpen] = React.useState(false);
  const [pendingSwitch, setPendingSwitch] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<string | null>(null);

  const { items: refreshedVersions, refetch: refetchVersions } =
    useFormVersions(formId);
  const { refetch: fetchTarget } = useFormVersion(pendingSwitch ?? undefined);
  const { mutateAsync: deleteVersionAsync } = useDeleteVersion();

  // Refresh local versions list when remote changes
  React.useEffect(() => {
    if (refreshedVersions.length > 0) {
      const latestId = refreshedVersions[0]?.id ?? null;
      if (latestId) {
        setVersions(
          refreshedVersions.map((v) => ({
            id: v.id,
            version: v.version,
            isPublished: v.isPublished,
            submissionCount: v.submissionCount,
            createdAt: new Date(v.createdAt),
          })),
          latestId,
        );
      }
    }
  }, [refreshedVersions, setVersions]);

  const selectedVersion =
    versions.find((v) => v.id === selectedVersionId) ?? versions[0];

  async function performSwitch(versionId: string) {
    const { data } = await fetchTarget();
    if (!data) {
      toast.error("Failed to load version");
      return;
    }
    switchVersion(versionId, data.schema as never);
    toast.success(`Switched to v${data.version}`);
  }

  function requestSwitch(versionId: string) {
    if (versionId === selectedVersionId) return;
    setOpen(false);
    if (isDirty) {
      setPendingSwitch(versionId);
    } else {
      setPendingSwitch(versionId);
      void performSwitch(versionId);
    }
  }

  if (versions.length === 0) {
    return <Skeleton className="h-8 w-32" />;
  }

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1.5">
            <IconHistory className="size-3.5" />
            {selectedVersion ? (
              <>
                <span className="tabular-nums">v{selectedVersion.version}</span>
                {selectedVersion.id === publishedVersionId ? (
                  <span className="text-caps uppercase text-success ml-1">
                    Live
                  </span>
                ) : null}
              </>
            ) : null}
            <IconChevronDown className="size-3.5 opacity-60" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 p-0">
          <div className="max-h-80 overflow-y-auto py-1">
            {versions.map((v) => {
              const isCurrent = v.id === selectedVersionId;
              const isPublished = v.id === publishedVersionId;
              const canDelete =
                !isPublished && v.submissionCount === 0 && versions.length > 1;
              return (
                <div
                  key={v.id}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2 py-1.5 mx-1 rounded-md",
                    "hover:bg-accent cursor-pointer",
                    isCurrent && "bg-accent",
                  )}
                  onClick={() => requestSwitch(v.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body-sm font-medium tabular-nums">
                        v{v.version}
                      </span>
                      {isPublished ? (
                        <span className="text-caps uppercase text-success">
                          Live
                        </span>
                      ) : null}
                    </div>
                    <div className="text-caps uppercase text-muted-foreground">
                      {v.submissionCount} response
                      {v.submissionCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  {canDelete ? (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(v.id);
                      }}
                      className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive inline-flex items-center justify-center"
                      aria-label="Delete version"
                    >
                      <IconTrash className="size-3.5" />
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Confirm-discard dialog when switching while dirty */}
      <ConfirmDialog
        open={Boolean(pendingSwitch) && isDirty}
        onOpenChange={(o) => {
          if (!o) setPendingSwitch(null);
        }}
        title="Discard unsaved changes?"
        description="You have unsaved edits. Switching versions will discard them."
        confirmLabel="Discard & switch"
        destructive
        onConfirm={async () => {
          if (pendingSwitch) await performSwitch(pendingSwitch);
          setPendingSwitch(null);
        }}
      />

      {/* Delete-version confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
        title="Delete this version?"
        description="This version will be permanently removed. Versions with submissions or the published version can't be deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          if (!deleteTarget) return;
          try {
            await deleteVersionAsync({ id: deleteTarget });
            toast.success("Version deleted");
            await refetchVersions();
          } catch (err) {
            const message = err instanceof Error ? err.message : "Failed";
            toast.error(`Delete failed: ${message}`);
          }
          setDeleteTarget(null);
        }}
      />
    </>
  );
}
