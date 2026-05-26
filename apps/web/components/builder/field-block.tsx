"use client";

import { IconCopy, IconGripVertical, IconTrash } from "@tabler/icons-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type {
  FieldSchemaI,
  FormSchemaI,
} from "@repo/database/models/form-versions";

import { cn } from "~/lib/utils";
import type { BuilderState } from "./store";
import { FieldPreview } from "./field-preview";

type Props = {
  field: FieldSchemaI;
  isSelected: boolean;
  onSelect: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
};

export function FieldBlock({
  field,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
}: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: field.id,
    data: { source: "field", fieldId: field.id, sectionId: field.sectionId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-selected={isSelected}
      data-dragging={isDragging}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      className={cn(
        "group relative bg-card rounded-lg border border-border p-4 shadow-xs",
        "transition-all duration-150 ease-out",
        "hover:shadow-sm hover:border-primary/30",
        "data-[selected=true]:shadow-md",
        "data-[selected=true]:border-primary",
        "data-[selected=true]:before:absolute",
        "data-[selected=true]:before:left-0",
        "data-[selected=true]:before:top-2",
        "data-[selected=true]:before:bottom-2",
        "data-[selected=true]:before:w-[3px]",
        "data-[selected=true]:before:bg-primary",
        "data-[selected=true]:before:rounded-r",
        "data-[dragging=true]:shadow-drag",
        "data-[dragging=true]:scale-[1.02]",
        "data-[dragging=true]:opacity-40",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="mt-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity"
          aria-label="Drag handle"
          onClick={(e) => e.stopPropagation()}
        >
          <IconGripVertical className="size-4" />
        </button>
        <div className="flex-1 min-w-0">
          <FieldPreview field={field} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 group-data-[selected=true]:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
            aria-label="Duplicate"
          >
            <IconCopy className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive inline-flex items-center justify-center"
            aria-label="Delete"
          >
            <IconTrash className="size-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
