"use client";

import * as React from "react";
import {
  IconCalendar,
  IconCalendarClock,
  IconCheckbox,
  IconCircle,
  IconFileUpload,
  IconLetterT,
  IconList,
  IconMail,
  IconNumbers,
  IconPhone,
  IconRotateClockwise,
  IconTextSize,
} from "@tabler/icons-react";
import { FIELD_TYPES, type InputColorTokens, type ThemeFieldType } from "@repo/theme";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { useThemeBuilderStore } from "../store";
import { ColorPicker } from "../color-picker";

type Override = Partial<InputColorTokens>;

// Color keys exposed in the editor. `focusRingColor` is intentionally
// omitted: the renderer auto-derives the ring from `--sf-color-primary`
// at 20% alpha (see compile.ts), so there's nothing to override here.
const COLOR_KEYS = [
  "backgroundColor",
  "textColor",
  "borderColor",
  "focusBorderColor",
  "helperColor",
  "errorColor",
] as const satisfies readonly (keyof InputColorTokens)[];

type ColorKey = (typeof COLOR_KEYS)[number];

const COLOR_LABELS: Record<ColorKey, string> = {
  backgroundColor: "Background",
  textColor: "Text",
  borderColor: "Border",
  focusBorderColor: "Focus border",
  helperColor: "Helper text",
  errorColor: "Error text",
};

const FIELD_LABELS: Record<ThemeFieldType, string> = {
  text: "Short text",
  textarea: "Long text",
  number: "Number",
  email: "Email",
  phone: "Phone",
  select: "Dropdown",
  checkbox: "Checkbox",
  radio: "Radio",
  date: "Date",
  datetime: "Date + time",
  file: "File upload",
};

const FIELD_ICONS: Record<ThemeFieldType, React.ComponentType<{ className?: string }>> = {
  text: IconLetterT,
  textarea: IconTextSize,
  number: IconNumbers,
  email: IconMail,
  phone: IconPhone,
  select: IconList,
  checkbox: IconCheckbox,
  radio: IconCircle,
  date: IconCalendar,
  datetime: IconCalendarClock,
  file: IconFileUpload,
};

/**
 * Per-field-type color overrides. Each field type can carry a partial
 * `InputColorTokens` map; whatever's set inlines into the compiled CSS
 * scoped to `[data-sf-field="<type>"]`. Unset keys fall through to the
 * base input rule.
 *
 * Mode-agnostic by design (v1) — overrides apply identically to light
 * and dark viewers. Per-mode per-field overrides are deferred to v1.x.
 *
 * The inherited values shown in unset rows come from the LIGHT palette's
 * input colors — the "starting point" the user sees when they click
 * Override.
 */
export function PerFieldSection() {
  const perField = useThemeBuilderStore((s) => s.tokens.perField);
  const inheritedSource = useThemeBuilderStore(
    // Always read light palette inputs — per-field overrides don't differ
    // per mode, so showing dark's input colors in the row swatches would
    // misrepresent what "Inherit" resolves to.
    (s) => s.tokens.palette.light.inputs,
  );
  const setTokens = useThemeBuilderStore((s) => s.setTokens);
  const isOwner = useThemeBuilderStore((s) => s.isOwner);

  function patchField(fieldType: ThemeFieldType, next: Override) {
    setTokens((prev) => {
      const nextEntry = Object.keys(next).length === 0 ? undefined : next;
      const { [fieldType]: _omit, ...rest } = prev.perField;
      return {
        ...prev,
        perField:
          nextEntry === undefined
            ? rest
            : { ...rest, [fieldType]: nextEntry },
      };
    });
  }

  function setKey(fieldType: ThemeFieldType, key: ColorKey, hex: string) {
    const current = perField[fieldType] ?? {};
    patchField(fieldType, { ...current, [key]: hex });
  }

  function clearKey(fieldType: ThemeFieldType, key: ColorKey) {
    const current = perField[fieldType] ?? {};
    const { [key]: _omit, ...rest } = current;
    patchField(fieldType, rest);
  }

  function resetField(fieldType: ThemeFieldType) {
    patchField(fieldType, {});
  }

  return (
    <Accordion type="single" collapsible className="flex flex-col gap-1">
      {FIELD_TYPES.map((fieldType) => {
        const override = perField[fieldType] ?? {};
        const setCount = COLOR_KEYS.filter(
          (k) => override[k] !== undefined,
        ).length;
        const Icon = FIELD_ICONS[fieldType];
        return (
          <AccordionItem
            key={fieldType}
            value={fieldType}
            className="rounded-md border border-border"
          >
            <AccordionTrigger className="px-3 py-2 hover:no-underline">
              <span className="flex flex-1 items-center gap-2 text-body font-medium text-foreground">
                <Icon className="size-4 text-muted-foreground" />
                {FIELD_LABELS[fieldType]}
                {setCount > 0 ? (
                  <span
                    className="ml-1 inline-flex size-1.5 shrink-0 rounded-full bg-primary"
                    aria-label={`${setCount} override${setCount === 1 ? "" : "s"} active`}
                  />
                ) : null}
              </span>
              {setCount > 0 ? (
                <span className="mr-2 text-caps uppercase text-muted-foreground">
                  {setCount}
                </span>
              ) : null}
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <div className="flex flex-col gap-1">
                {COLOR_KEYS.map((key) => (
                  <FieldRow
                    key={key}
                    label={COLOR_LABELS[key]}
                    overrideValue={override[key]}
                    inheritedValue={inheritedSource[key]}
                    onSet={(hex) => setKey(fieldType, key, hex)}
                    onClear={() => clearKey(fieldType, key)}
                    disabled={!isOwner}
                  />
                ))}
                {setCount > 0 && isOwner ? (
                  <div className="mt-2 flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => resetField(fieldType)}
                      className="text-muted-foreground"
                    >
                      <IconRotateClockwise className="size-4" />
                      Reset all
                    </Button>
                  </div>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

function FieldRow({
  label,
  overrideValue,
  inheritedValue,
  onSet,
  onClear,
  disabled,
}: {
  label: string;
  overrideValue: string | undefined;
  inheritedValue: string;
  onSet: (hex: string) => void;
  onClear: () => void;
  disabled: boolean;
}) {
  const isOverridden = overrideValue !== undefined;
  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40">
      {isOverridden ? (
        <ColorPicker
          value={overrideValue}
          onChange={onSet}
          disabled={disabled}
          ariaLabel={`Pick ${label.toLowerCase()} override`}
        />
      ) : (
        // Static swatch — visually previews the inherited value but isn't
        // an interactive picker. Clicking the Override button is what
        // opts into editing.
        <div
          className="size-7 shrink-0 rounded-md border border-border"
          style={{ background: inheritedValue }}
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-body font-medium text-foreground">{label}</p>
      </div>
      {isOverridden ? (
        <>
          <span className="shrink-0 font-mono text-body-sm text-muted-foreground">
            {overrideValue}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={disabled}
            className="text-muted-foreground"
          >
            Clear
          </Button>
        </>
      ) : (
        <>
          <span className="shrink-0 text-body-sm text-muted-foreground">
            Inherits
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onSet(inheritedValue)}
            disabled={disabled}
          >
            Override
          </Button>
        </>
      )}
    </div>
  );
}
