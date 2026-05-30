"use client";

import * as React from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Badge } from "~/components/ui/badge";
import { BackgroundSection } from "./sections/background-section";
import { BrandSection } from "./sections/brand-section";
import { ButtonsSection } from "./sections/buttons-section";
import { ColorsSection } from "./sections/colors-section";
import { InputsSection } from "./sections/inputs-section";
import { MetadataSection } from "./sections/metadata-section";
import { PerFieldSection } from "./sections/per-field-section";
import { SurfacesSection } from "./sections/surfaces-section";
import { TypographySection } from "./sections/typography-section";
import { useThemeBuilderStore } from "./store";

/**
 * Left pane of the editor — vertical accordion of section editors.
 *
 * Controlled accordion: the open item lives in the store as
 * `selectedSection`. Both manual user clicks on accordion headers AND
 * the click-to-edit hook in the preview pane write to that field, so
 * the panel always reflects which section is being edited.
 *
 * When `selectedSection` changes, the matching item is scrolled into
 * view with `block: 'nearest'` — a no-op when the item is already
 * visible (e.g., the user just clicked its header), but the right
 * behavior when click-to-edit jumps to an off-screen section.
 *
 * `type="single" collapsible` matches the analysis doc — only one
 * section expands at a time, keeping the panel from sprawling.
 */
export function ThemeControlsPanel() {
  const selectedSection = useThemeBuilderStore((s) => s.selectedSection);
  const setSelectedSection = useThemeBuilderStore(
    (s) => s.setSelectedSection,
  );

  // Per-section refs so we can scrollIntoView when click-to-edit fires.
  // Mutated via callback refs on each SectionItem.
  const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

  React.useEffect(() => {
    if (!selectedSection) return;
    const el = itemRefs.current[selectedSection];
    if (!el) return;
    // `block: 'nearest'` keeps the panel quiet when the item is already
    // in view (manual user click), and only scrolls when the click-to-
    // edit hook jumps somewhere off-screen.
    el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [selectedSection]);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Accordion
        type="single"
        collapsible
        value={selectedSection ?? undefined}
        onValueChange={(v) => setSelectedSection(v ? v : null)}
        className="flex flex-col gap-2"
      >
        <SectionItem
          value="brand"
          title="Brand"
          itemRef={(el) => {
            itemRefs.current.brand = el;
          }}
        >
          <BrandSection />
        </SectionItem>

        <SectionItem
          value="colors"
          title="Colors"
          itemRef={(el) => {
            itemRefs.current.colors = el;
          }}
        >
          <ColorsSection />
        </SectionItem>

        <SectionItem
          value="typography"
          title="Typography"
          itemRef={(el) => {
            itemRefs.current.typography = el;
          }}
        >
          <TypographySection />
        </SectionItem>

        <SectionItem
          value="buttons"
          title="Buttons"
          itemRef={(el) => {
            itemRefs.current.buttons = el;
          }}
        >
          <ButtonsSection />
        </SectionItem>

        <SectionItem
          value="inputs"
          title="Inputs"
          itemRef={(el) => {
            itemRefs.current.inputs = el;
          }}
        >
          <InputsSection />
        </SectionItem>

        <SectionItem
          value="background"
          title="Background"
          itemRef={(el) => {
            itemRefs.current.background = el;
          }}
        >
          <BackgroundSection />
        </SectionItem>

        <SectionItem
          value="surfaces"
          title="Surfaces & spacing"
          itemRef={(el) => {
            itemRefs.current.surfaces = el;
          }}
        >
          <SurfacesSection />
        </SectionItem>

        <SectionItem
          value="per-field"
          title="Per field type"
          itemRef={(el) => {
            itemRefs.current["per-field"] = el;
          }}
        >
          <PerFieldSection />
        </SectionItem>

        <SectionItem
          value="metadata"
          title="Metadata"
          itemRef={(el) => {
            itemRefs.current.metadata = el;
          }}
        >
          <MetadataSection />
        </SectionItem>
      </Accordion>
    </div>
  );
}

function SectionItem({
  value,
  title,
  badge,
  comingSoon,
  children,
  itemRef,
}: {
  value: string;
  title: string;
  badge?: string;
  comingSoon?: boolean;
  children?: React.ReactNode;
  itemRef?: (el: HTMLDivElement | null) => void;
}) {
  return (
    <AccordionItem
      ref={itemRef}
      value={value}
      className="rounded-md border border-border bg-card"
    >
      <AccordionTrigger className="px-3 py-2.5 hover:no-underline">
        <span className="flex items-center gap-2 text-body font-medium text-foreground">
          {title}
          {badge ? (
            <Badge variant="outline" className="text-[10px] uppercase">
              {badge}
            </Badge>
          ) : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="px-3 pb-3">
        {comingSoon ? (
          <p className="text-body-sm text-muted-foreground">
            Coming in a future PR. The section will live here.
          </p>
        ) : (
          children
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
