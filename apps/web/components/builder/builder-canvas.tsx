"use client";

import * as React from "react";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type {
  FieldSchemaI,
  PageSchemaI,
  SectionSchemaI,
} from "@repo/database/models/form-versions";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";
import type { BuilderState } from "./store";
import { FieldBlock } from "./field-block";

type Props = {
  state: BuilderState;
};

export function BuilderCanvas({ state }: Props) {
  const {
    schema,
    activePageId,
    selectedId,
    select,
    addSection,
    deleteSection,
    updateSection,
    duplicateField,
    deleteField,
  } = state;

  const activePage = schema.pages.find((p) => p.id === activePageId);

  const sectionsForPage = React.useMemo<SectionSchemaI[]>(() => {
    if (!activePage) return [];
    const byId = new Map(schema.sections.map((s) => [s.id, s]));
    return activePage.sectionIds
      .map((id) => byId.get(id))
      .filter((s): s is SectionSchemaI => Boolean(s))
      .sort((a, b) => a.order - b.order);
  }, [activePage, schema.sections]);

  const fieldsBySection = React.useMemo(() => {
    const byId = new Map(schema.fields.map((f) => [f.id, f]));
    const map = new Map<string, FieldSchemaI[]>();
    for (const section of schema.sections) {
      const list = section.fieldIds
        .map((id) => byId.get(id))
        .filter((f): f is FieldSchemaI => Boolean(f))
        .sort((a, b) => a.order - b.order);
      map.set(section.id, list);
    }
    return map;
  }, [schema.fields, schema.sections]);

  if (!activePage) {
    return (
      <div className="flex-1 canvas-grid flex items-center justify-center text-muted-foreground">
        No page selected.
      </div>
    );
  }

  return (
    <div
      className="flex-1 canvas-grid overflow-y-auto"
      onClick={() => select(null, null)}
    >
      <div className="max-w-[720px] mx-auto p-8 space-y-6">
        {sectionsForPage.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            fields={fieldsBySection.get(section.id) ?? []}
            isSelected={selectedId === section.id}
            onSelect={() => select(section.id, "section")}
            onChangeTitle={(t) => updateSection(section.id, { title: t })}
            onChangeDescription={(d) =>
              updateSection(section.id, { description: d })
            }
            onDelete={
              sectionsForPage.length > 1
                ? () => deleteSection(section.id)
                : undefined
            }
            selectedFieldId={selectedId}
            onSelectField={(id) => select(id, "field")}
            onDuplicateField={(id) => duplicateField(id)}
            onDeleteField={(id) => deleteField(id)}
          />
        ))}
        <div className="flex justify-center pt-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              addSection(activePage.id);
            }}
          >
            <IconPlus className="size-3.5" />
            Add section
          </Button>
        </div>
      </div>
    </div>
  );
}

function SectionBlock({
  section,
  fields,
  isSelected,
  onSelect,
  onChangeTitle,
  onChangeDescription,
  onDelete,
  selectedFieldId,
  onSelectField,
  onDuplicateField,
  onDeleteField,
}: {
  section: SectionSchemaI;
  fields: FieldSchemaI[];
  isSelected: boolean;
  onSelect: () => void;
  onChangeTitle: (t: string) => void;
  onChangeDescription: (d: string) => void;
  onDelete?: () => void;
  selectedFieldId: string | null;
  onSelectField: (id: string) => void;
  onDuplicateField: (id: string) => void;
  onDeleteField: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { source: "section", sectionId: section.id },
  });

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "group bg-card rounded-xl border border-border p-5",
        "transition-all duration-150 ease-out",
        isSelected ? "shadow-md border-primary/50" : "shadow-xs",
      )}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 space-y-1.5">
          <Input
            value={section.title}
            placeholder="Section title (optional)"
            onChange={(e) => onChangeTitle(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            className="bg-transparent border-transparent shadow-none px-1 h-8 text-h4 font-semibold focus:bg-muted/50 hover:bg-muted/30"
          />
          <Textarea
            value={section.description ?? ""}
            placeholder="Description (optional)"
            onChange={(e) => onChangeDescription(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            rows={1}
            className="bg-transparent border-transparent shadow-none px-1 text-body-sm text-muted-foreground resize-none min-h-0 py-1 focus:bg-muted/50 hover:bg-muted/30"
          />
        </div>
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive inline-flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            aria-label="Delete section"
          >
            <IconTrash className="size-3.5" />
          </button>
        ) : null}
      </div>

      <SortableContext
        items={fields.map((f) => f.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "space-y-3 min-h-[60px] rounded-md transition-colors",
            isOver && fields.length === 0
              ? "border-2 border-dashed border-drop-zone-border bg-drop-zone p-3"
              : "",
          )}
        >
          {fields.length === 0 ? (
            <div className="text-center py-6 text-body-sm text-muted-foreground">
              Drop an element from the left to add a field.
            </div>
          ) : (
            fields.map((field) => (
              <FieldBlock
                key={field.id}
                field={field}
                isSelected={selectedFieldId === field.id}
                onSelect={() => onSelectField(field.id)}
                onDuplicate={() => onDuplicateField(field.id)}
                onDelete={() => onDeleteField(field.id)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
