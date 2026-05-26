"use client";

import {
  IconAt,
  IconCalendar,
  IconCalendarTime,
  IconCheckbox,
  IconChevronDown,
  IconCircleDot,
  IconFileUpload,
  IconHash,
  IconLetterT,
  IconPhone,
  IconTextSize,
} from "@tabler/icons-react";
import { useDraggable } from "@dnd-kit/core";
import type { FieldType } from "@repo/database/models/form-versions";

import { cn } from "~/lib/utils";

type PaletteItem = {
  type: FieldType;
  label: string;
  icon: typeof IconLetterT;
  comingSoon?: boolean;
};

const GROUPS: { title: string; items: PaletteItem[] }[] = [
  {
    title: "Basic",
    items: [
      { type: "text", label: "Text", icon: IconLetterT },
      { type: "textarea", label: "Long text", icon: IconTextSize },
      { type: "number", label: "Number", icon: IconHash },
      { type: "email", label: "Email", icon: IconAt },
      { type: "phone", label: "Phone", icon: IconPhone },
    ],
  },
  {
    title: "Choice",
    items: [
      { type: "select", label: "Dropdown", icon: IconChevronDown },
      { type: "radio", label: "Single choice", icon: IconCircleDot },
      { type: "checkbox", label: "Multiple choice", icon: IconCheckbox },
    ],
  },
  {
    title: "Advanced",
    items: [
      { type: "date", label: "Date", icon: IconCalendar },
      { type: "datetime", label: "Date & time", icon: IconCalendarTime },
      { type: "file", label: "File", icon: IconFileUpload, comingSoon: true },
    ],
  },
];

export function ElementPalette() {
  return (
    <aside className="w-60 border-r bg-sidebar flex flex-col">
      <div className="p-3 border-b border-sidebar-border">
        <h2 className="text-caps uppercase text-muted-foreground">
          Elements
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {GROUPS.map((group) => (
          <div key={group.title} className="space-y-2">
            <h3 className="text-caps uppercase text-muted-foreground px-1">
              {group.title}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {group.items.map((item) => (
                <PaletteCard key={item.type} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

function PaletteCard({ item }: { item: PaletteItem }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { source: "palette", fieldType: item.type },
    disabled: item.comingSoon,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "group flex items-center gap-2.5 p-2 rounded-md border bg-card cursor-grab",
        "transition-all duration-150 ease-out",
        "hover:shadow-sm hover:-translate-y-0.5 hover:border-primary/30",
        "active:cursor-grabbing",
        isDragging && "opacity-40",
        item.comingSoon && "opacity-60 cursor-not-allowed",
      )}
    >
      <div className="h-7 w-7 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <item.icon className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-medium text-foreground truncate">
          {item.label}
        </p>
        {item.comingSoon ? (
          <p className="text-caps uppercase text-warning">Coming soon</p>
        ) : null}
      </div>
    </div>
  );
}
