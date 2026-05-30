"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconArrowLeft,
  IconChevronDown,
  IconEye,
  IconSettings,
  IconShare,
} from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { useUser } from "~/hooks/auth";
import { ShareFormDialog } from "~/components/share-form-dialog";
import { buildFormPublicUrl } from "~/lib/share-urls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";

import { ConfirmDialog } from "~/components/confirm-dialog";
import { StatusChip } from "~/components/status-chip";
import {
  useArchiveForm,
  useCloseForm,
  useRestoreForm,
  useSoftDeleteForm,
  useUnpublishForm,
  useUpdateForm,
  usePublishForm,
} from "~/hooks/form";
import { useSaveDraft } from "~/hooks/form-versions";
import { FormSettingsSheet } from "./form-settings-sheet";
import { VersionDropdown } from "./version-dropdown";
import { SaveIndicator } from "./save-indicator";
import type { BuilderState } from "./store";

type Props = {
  state: BuilderState;
  onPreview: () => void;
};

export function BuilderTopbar({ state, onPreview }: Props) {
  const router = useRouter();
  const {
    formId,
    title,
    status,
    setTitle,
    setStatus,
    setPublishedVersionId,
    schema,
    isDirty,
    isSaving,
    markSaving,
    markSaved,
    markSaveError,
  } = state;

  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [localTitle, setLocalTitle] = React.useState(title);
  const { user } = useUser();

  React.useEffect(() => {
    setLocalTitle(title);
  }, [title]);

  const { updateFormAsync } = useUpdateForm();
  const saveDraft = useSaveDraft();
  const publish = usePublishForm();
  const unpublish = useUnpublishForm();
  const archive = useArchiveForm();
  const close = useCloseForm();
  const restore = useRestoreForm();
  const { softDeleteFormAsync } = useSoftDeleteForm();

  async function commitTitle() {
    if (localTitle.trim() === "") {
      setLocalTitle(title);
      return;
    }
    if (localTitle === title) return;
    try {
      await updateFormAsync({ id: formId, title: localTitle.trim() });
      setTitle(localTitle.trim());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(`Title update failed: ${message}`);
      setLocalTitle(title);
    }
  }

  async function handleSave(): Promise<boolean> {
    if (isSaving) return false;
    markSaving();
    try {
      await saveDraft.mutateAsync({
        formId,
        schema: schema as never,
      });
      markSaved(new Date());
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save";
      markSaveError(message);
      return false;
    }
  }

  async function handlePublish() {
    if (isDirty) {
      const ok = await handleSave();
      if (!ok) return;
    }
    try {
      const result = await publish.mutateAsync({ id: formId });
      setStatus(result.status);
      setPublishedVersionId(result.publishedVersionId);
      // Live-theme model: no snapshot is taken on publish; the public
      // form fetches the attached theme's current tokens at render time.
      // Nothing extra to mirror in the store.

      // First-publish welcome email — server only sets `notification`
      // when this was the user's first published form ever.
      if (result.notification?.sent) {
        toast.success("🎉 First form shipped — we just emailed you a note.", {
          description: "Your form is now live.",
        });
      } else if (result.notification && !result.notification.sent) {
        toast.success("Form published", {
          description:
            "Your form is now live. (We couldn't send the confirmation email — check your inbox spam.)",
        });
      } else {
        toast.success("Form published", {
          description: "Your form is now live.",
        });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to publish";
      toast.error(`Publish failed: ${message}`);
    }
  }

  async function handleTransition(
    label: string,
    fn: () => Promise<{ status: string; publishedVersionId: string | null }>,
  ) {
    try {
      const result = await fn();
      setStatus(result.status as never);
      setPublishedVersionId(result.publishedVersionId);
      toast.success(`Form ${label}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed";
      toast.error(`${label} failed: ${message}`);
    }
  }

  return (
    <header className="h-14 sticky top-0 z-30 bg-card border-b shadow-xs flex items-center px-4 gap-3">
      <Button variant="ghost" size="icon" asChild>
        <Link href="/dashboard/forms" aria-label="Back to forms">
          <IconArrowLeft className="size-4" />
        </Link>
      </Button>

      <Input
        value={localTitle}
        onChange={(e) => setLocalTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder="Untitled form"
        className="bg-transparent border-transparent shadow-none px-2 h-9 max-w-md text-h4 font-medium focus:bg-muted/50 hover:bg-muted/50 transition-colors"
      />

      <StatusChip status={status} />
      <VersionDropdown state={state} />

      <div className="ml-auto flex items-center gap-3">
        <SaveIndicator state={state} />

        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSettingsOpen(true)}
          aria-label="Form settings"
        >
          <IconSettings className="size-4" />
        </Button>

        <Button variant="ghost" size="sm" onClick={onPreview}>
          <IconEye className="size-4" />
          Preview
        </Button>

        {status === "published" && user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShareOpen(true)}
          >
            <IconShare className="size-4" />
            Share
          </Button>
        ) : null}

        {/*
          The "republish to apply theme change" nudge was removed when we
          switched to the live-theme model. The public form now fetches
          the attached theme's CURRENT tokens via JOIN at render time, so
          theme edits propagate to consumers immediately — no re-publish
          needed. Re-publish only matters for SCHEMA changes (fields,
          sections), which the Save button + Publish dropdown handle.
        */}

        <Button
          size="sm"
          variant={isDirty ? "default" : "outline"}
          disabled={!isDirty}
          loading={isSaving}
          loadingText="Saving…"
          onClick={handleSave}
        >
          Save
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" className="gap-1">
              Publish
              <IconChevronDown className="size-3.5 opacity-80" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handlePublish}>
              Publish form
            </DropdownMenuItem>
            {status === "published" ? (
              <>
                <DropdownMenuItem
                  onClick={() =>
                    handleTransition("unpublished", () =>
                      unpublish.mutateAsync({ id: formId }),
                    )
                  }
                >
                  Unpublish
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    handleTransition("closed", () =>
                      close.mutateAsync({ id: formId }),
                    )
                  }
                >
                  Close
                </DropdownMenuItem>
              </>
            ) : null}
            {status === "published" || status === "closed" ? (
              <DropdownMenuItem
                onClick={() =>
                  handleTransition("archived", () =>
                    archive.mutateAsync({ id: formId }),
                  )
                }
              >
                Archive
              </DropdownMenuItem>
            ) : null}
            {status === "archived" || status === "closed" ? (
              <DropdownMenuItem
                onClick={() =>
                  handleTransition("restored", () =>
                    restore.mutateAsync({ id: formId }),
                  )
                }
              >
                Restore to draft
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => setDeleteOpen(true)}
            >
              Delete form
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete form?"
        description="The form and its submissions will be hidden. You can restore it from the database."
        confirmLabel="Delete"
        destructive
        onConfirm={async () => {
          try {
            await softDeleteFormAsync({ id: formId });
            toast.success("Form deleted");
            router.push("/dashboard/forms");
          } catch (err) {
            const message = err instanceof Error ? err.message : "Failed";
            toast.error(`Delete failed: ${message}`);
          }
        }}
      />

      <FormSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        state={state}
      />

      {user && status === "published" ? (
        <ShareFormDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          title={state.title}
          publicUrl={buildFormPublicUrl({
            origin:
              typeof window !== "undefined" ? window.location.origin : "",
            userSlug: user.userGlobalFormSlug,
            formSlug: state.formSlug,
          })}
          visibility={state.visibility}
        />
      ) : null}
    </header>
  );
}
