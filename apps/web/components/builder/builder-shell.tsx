"use client";

import * as React from "react";
import Link from "next/link";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";

import type { FieldType } from "@repo/database/models/form-versions";
import type { FormStatus } from "~/components/status-chip";
import { Button } from "~/components/ui/button";
import { Skeleton } from "~/components/ui/skeleton";
import { useForm } from "~/hooks/form";
import { useFormVersions } from "~/hooks/form-versions";
import { useTheme } from "~/hooks/theme";

import { BuilderCanvas } from "./builder-canvas";
import { BuilderTopbar } from "./builder-topbar";
import { ElementPalette } from "./element-palette";
import { PageTabs } from "./page-tabs";
import { PreviewModal } from "./preview-modal";
import { PropertyPanel } from "./property-panel";
import {
  createBuilderStore,
  type BuilderStore,
} from "./store";

type Props = {
  formId: string;
};

export function BuilderShell({ formId }: Props) {
  const storeRef = React.useRef<BuilderStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = createBuilderStore();
  }
  const store = storeRef.current;
  const state = store();

  const {
    form,
    isLoading: formLoading,
    isError: formError,
    error: formErrorObj,
  } = useForm(formId);
  const { items: versions, isLoading: versionsLoading } = useFormVersions(formId);

  // Pre-warm the React Query cache for whatever theme is attached, so
  // PreviewModal's `useTheme(state.themeId)` resolves from cache on its
  // first open instead of racing the fetch. Disabled when no theme is
  // attached. Re-fires when the user picks a new theme via the settings
  // sheet (state.themeId changes).
  useTheme(state.themeId ?? undefined);

  const [previewOpen, setPreviewOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    if (!form || versions.length === 0 || hydrated) return;
    const latest = form.latestVersion;
    state.init({
      formId: form.id,
      formSlug: form.slug,
      title: form.title,
      status: form.status as FormStatus,
      visibility: form.visibility,
      publishedVersionId: form.publishedVersionId ?? null,
      schema: latest.schema as never,
      // Theme lives on the form (not on the version row). Read it from
      // the top-level form payload.
      themeId: form.themeId ?? null,
      versions: versions.map((v) => ({
        id: v.id,
        version: v.version,
        isPublished: v.isPublished,
        submissionCount: v.submissionCount,
        createdAt: new Date(v.createdAt),
      })),
      latestVersionId: latest.id,
    });
    setHydrated(true);
  }, [form, versions, hydrated, state]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const [activeDrag, setActiveDrag] = React.useState<
    { source: "palette"; fieldType: FieldType } | { source: "field"; fieldId: string } | null
  >(null);

  function handleDragStart(e: DragStartEvent) {
    const data = e.active.data.current as
      | { source?: "palette"; fieldType?: FieldType }
      | { source?: "field"; fieldId?: string }
      | undefined;
    if (data?.source === "palette" && data.fieldType) {
      setActiveDrag({ source: "palette", fieldType: data.fieldType });
    } else if (data?.source === "field" && data.fieldId) {
      setActiveDrag({ source: "field", fieldId: data.fieldId });
    } else {
      setActiveDrag(null);
    }
  }

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    setActiveDrag(null);
    if (!over) return;

    const activeData = active.data.current as
      | { source?: "palette" | "field"; fieldType?: FieldType; fieldId?: string; sectionId?: string }
      | undefined;
    const overData = over.data.current as
      | { source?: "section" | "field"; sectionId?: string; fieldId?: string }
      | undefined;

    // Palette → drop on section (or on a field within a section)
    if (activeData?.source === "palette" && activeData.fieldType) {
      let targetSectionId: string | undefined;
      let atIndex: number | undefined;
      if (overData?.source === "section" && overData.sectionId) {
        targetSectionId = overData.sectionId;
      } else if (overData?.source === "field" && overData.fieldId) {
        // Dropped on top of a field — insert above it in its section
        const section = state.schema.sections.find((s) =>
          s.fieldIds.includes(overData.fieldId!),
        );
        if (section) {
          targetSectionId = section.id;
          atIndex = section.fieldIds.indexOf(overData.fieldId!);
        }
      }
      if (!targetSectionId) {
        // Default: drop into the first section of the active page
        const page = state.schema.pages.find((p) => p.id === state.activePageId);
        targetSectionId = page?.sectionIds[0];
      }
      if (targetSectionId) {
        state.addField({
          sectionId: targetSectionId,
          type: activeData.fieldType,
          atIndex,
        });
      }
      return;
    }

    // Field → reorder within the same section
    if (
      activeData?.source === "field" &&
      activeData.fieldId &&
      activeData.sectionId &&
      overData?.source === "field" &&
      overData.fieldId
    ) {
      const sectionId = activeData.sectionId;
      const section = state.schema.sections.find((s) => s.id === sectionId);
      if (!section) return;
      // Only same-section reorder in v1
      if (!section.fieldIds.includes(overData.fieldId)) return;
      const fromIndex = section.fieldIds.indexOf(activeData.fieldId);
      const toIndex = section.fieldIds.indexOf(overData.fieldId);
      if (fromIndex >= 0 && toIndex >= 0) {
        state.reorderFieldInSection(sectionId, fromIndex, toIndex);
      }
    }
  }

  if (formError) {
    return <BuilderError error={formErrorObj} />;
  }

  if (formLoading || versionsLoading || !hydrated) {
    return <BuilderSkeleton />;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-screen overflow-hidden">
        <BuilderTopbar state={state} onPreview={() => setPreviewOpen(true)} />
        <div className="grid flex-1 min-h-0 grid-cols-[240px_1fr_320px]">
          <ElementPalette />
          <div className="flex flex-col min-h-0">
            <PageTabs state={state} />
            <BuilderCanvas state={state} />
          </div>
          <PropertyPanel state={state} />
        </div>
      </div>
      <DragOverlay>
        {activeDrag?.source === "palette" ? (
          <div className="rounded-md border bg-card p-2 shadow-drag text-body-sm font-medium">
            New {activeDrag.fieldType}
          </div>
        ) : activeDrag?.source === "field" ? (
          <div className="rounded-md border bg-card p-2 shadow-drag text-body-sm font-medium">
            Moving field
          </div>
        ) : null}
      </DragOverlay>
      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        title={state.title}
        schema={state.schema}
        themeId={state.themeId}
      />
    </DndContext>
  );
}

function BuilderError({ error }: { error: { message?: string } | null }) {
  const message = error?.message ?? "We couldn't load this form.";
  const looksMissing =
    message.toLowerCase().includes("not found") ||
    message.toLowerCase().includes("forbidden");
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-3 px-6 text-center">
      <div className="h-12 w-12 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
        <IconAlertTriangle className="size-5" />
      </div>
      <p className="text-h3 text-foreground">Form not available</p>
      <p className="text-body-sm text-muted-foreground max-w-md">
        {looksMissing
          ? "This form may not exist or you don't have access to it."
          : message}
      </p>
      <Button asChild variant="outline" className="mt-2">
        <Link href="/dashboard/forms">
          <IconArrowLeft className="size-4" />
          Back to forms
        </Link>
      </Button>
    </div>
  );
}

function BuilderSkeleton() {
  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <div className="h-14 border-b flex items-center px-4 gap-3">
        <Skeleton className="size-8" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
      <div className="grid flex-1 grid-cols-[240px_1fr_320px]">
        <div className="border-r bg-sidebar p-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="canvas-grid flex justify-center pt-12">
          <div className="max-w-[640px] w-full px-6 space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
        <div className="border-l bg-sidebar p-4 space-y-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
