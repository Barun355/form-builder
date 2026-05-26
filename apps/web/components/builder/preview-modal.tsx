"use client";

import type { FormSchemaI } from "@repo/database/models/form-versions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "~/components/ui/sheet";
import { FormRenderer } from "~/components/form-renderer";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  schema: FormSchemaI;
};

export function PreviewModal({ open, onOpenChange, title, schema }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl flex flex-col">
        <SheetHeader>
          <SheetTitle>{title || "Untitled form"}</SheetTitle>
          <SheetDescription>
            Preview as a respondent — submissions are not saved.
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <FormRenderer schema={schema} mode="preview" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
