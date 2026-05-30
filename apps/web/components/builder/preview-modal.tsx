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
import { ThemeStyle } from "~/components/theme-style";
import { useTheme } from "~/hooks/theme";
import { cn } from "~/lib/utils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  schema: FormSchemaI;
  /**
   * Theme attached to the form's latest draft version. `null` renders
   * the System Default look (no `<ThemeStyle>` mounted).
   */
  themeId: string | null;
};

/**
 * In-builder preview. Renders the sample form with the form's currently-
 * attached theme so authors see what end viewers will see.
 *
 * Mirrors the two-layer DOM contract that public-form-renderer.tsx uses
 * (`data-sf-root` + `.sf-card`) so the compiled CSS in `<ThemeStyle>`
 * targets the right elements. The mode class on the root mirrors the
 * theme's `mode` field — `light` / `dark` force; `auto` defers to the
 * compiler's @media (prefers-color-scheme) block.
 */
export function PreviewModal({ open, onOpenChange, title, schema, themeId }: Props) {
  // Skip the network round trip when there's no theme attached.
  // `useTheme(undefined)` disables the query internally.
  const { theme } = useTheme(themeId ?? undefined);
  const tokens = theme?.tokens ?? null;

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
          <div
            className={cn(
              "sf-form",
              tokens?.mode === "light" && "sf-light",
              tokens?.mode === "dark" && "sf-dark",
            )}
            data-sf-root
          >
            <ThemeStyle tokens={tokens} />
            <div className="sf-card">
              <FormRenderer schema={schema} mode="preview" />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
