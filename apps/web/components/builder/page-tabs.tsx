"use client";

import { IconPlus, IconTrash, IconPencil } from "@tabler/icons-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { cn } from "~/lib/utils";
import type { BuilderState } from "./store";

type Props = {
  state: BuilderState;
};

export function PageTabs({ state }: Props) {
  const { schema, activePageId, addPage, setActivePage, updatePage, deletePage } =
    state;
  const pages = [...schema.pages].sort((a, b) => a.order - b.order);

  return (
    <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b bg-card overflow-x-auto">
      {pages.map((page) => {
        const isActive = page.id === activePageId;
        return (
          <PageTab
            key={page.id}
            isActive={isActive}
            title={page.title}
            onClick={() => setActivePage(page.id)}
            onRename={(t) => updatePage(page.id, { title: t })}
            onDelete={
              pages.length > 1 ? () => deletePage(page.id) : undefined
            }
          />
        );
      })}
      <button
        type="button"
        onClick={addPage}
        className="px-3 py-2 text-body-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 rounded-t-md hover:bg-muted/50 transition-colors"
      >
        <IconPlus className="size-3.5" />
        Add page
      </button>
    </div>
  );
}

function PageTab({
  isActive,
  title,
  onClick,
  onRename,
  onDelete,
}: {
  isActive: boolean;
  title: string;
  onClick: () => void;
  onRename: (t: string) => void;
  onDelete?: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-1 px-3 py-2 rounded-t-md text-body-sm font-medium transition-colors duration-150 cursor-pointer",
        isActive
          ? "bg-canvas text-foreground border-b-2 border-primary -mb-px"
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
      )}
      onClick={onClick}
    >
      <span className="select-none">{title}</span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            className="size-5 rounded inline-flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-muted transition-opacity"
            aria-label="Page menu"
          >
            <IconPencil className="size-3" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              const next = window.prompt("Rename page", title);
              if (next !== null && next.trim() !== "") onRename(next.trim());
            }}
          >
            Rename
          </DropdownMenuItem>
          {onDelete ? (
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <IconTrash className="size-4" />
              Delete page
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
