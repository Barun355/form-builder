"use client";

import * as React from "react";
import {
  IconPointer,
  IconPlus,
  IconTrash,
} from "@tabler/icons-react";
import { nanoid } from "nanoid";

import type {
  FieldOption,
  FieldSchemaI,
} from "@repo/database/models/form-versions";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { Textarea } from "~/components/ui/textarea";
import type { BuilderState } from "./store";

type Props = {
  state: BuilderState;
};

export function PropertyPanel({ state }: Props) {
  const { schema, selectedId, selectedType } = state;

  if (!selectedId || !selectedType) {
    return (
      <aside className="w-80 border-l bg-sidebar p-6 flex flex-col items-center justify-center text-center">
        <IconPointer
          className="h-10 w-10 text-muted-foreground/40 mb-3"
          strokeWidth={1.5}
        />
        <p className="text-body-sm text-muted-foreground">
          Select a field, section, or page to edit its properties.
        </p>
      </aside>
    );
  }

  if (selectedType === "field") {
    const field = schema.fields.find((f) => f.id === selectedId);
    if (!field) return null;
    return <FieldProperties state={state} field={field} />;
  }

  if (selectedType === "section") {
    const section = schema.sections.find((s) => s.id === selectedId);
    if (!section) return null;
    return (
      <aside className="w-80 border-l bg-sidebar flex flex-col">
        <header className="p-4 border-b border-sidebar-border">
          <h2 className="text-h4 text-foreground">Section</h2>
          <p className="text-body-sm text-muted-foreground">
            Edit section title and description.
          </p>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              value={section.title}
              onChange={(e) =>
                state.updateSection(section.id, { title: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="section-description">Description</Label>
            <Textarea
              id="section-description"
              rows={3}
              value={section.description ?? ""}
              onChange={(e) =>
                state.updateSection(section.id, { description: e.target.value })
              }
            />
          </div>
        </div>
      </aside>
    );
  }

  if (selectedType === "page") {
    const page = schema.pages.find((p) => p.id === selectedId);
    if (!page) return null;
    return (
      <aside className="w-80 border-l bg-sidebar flex flex-col">
        <header className="p-4 border-b border-sidebar-border">
          <h2 className="text-h4 text-foreground">Page</h2>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="page-title">Title</Label>
            <Input
              id="page-title"
              value={page.title}
              onChange={(e) =>
                state.updatePage(page.id, { title: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="page-description">Description</Label>
            <Textarea
              id="page-description"
              rows={3}
              value={page.description ?? ""}
              onChange={(e) =>
                state.updatePage(page.id, { description: e.target.value })
              }
            />
          </div>
        </div>
      </aside>
    );
  }

  return null;
}

function FieldProperties({
  state,
  field,
}: {
  state: BuilderState;
  field: FieldSchemaI;
}) {
  const { updateField, setFieldNameManual } = state;

  return (
    <aside className="w-80 border-l bg-sidebar flex flex-col">
      <header className="p-4 border-b border-sidebar-border">
        <p className="text-caps uppercase text-muted-foreground">
          {field.type}
        </p>
        <h2 className="text-h4 text-foreground mt-0.5">
          {field.label || "Untitled field"}
        </h2>
      </header>
      <div className="flex-1 overflow-y-auto">
        <Accordion type="multiple" defaultValue={["basics"]}>
          <AccordionItem value="basics" className="px-4">
            <AccordionTrigger>Basics</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="space-y-1.5">
                <Label htmlFor="field-label">Label</Label>
                <Input
                  id="field-label"
                  value={field.label}
                  onChange={(e) =>
                    updateField(field.id, { label: e.target.value }, {
                      fromLabel: true,
                    })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="field-name">Name (internal)</Label>
                <Input
                  id="field-name"
                  value={field.name}
                  onChange={(e) => {
                    setFieldNameManual(field.id);
                    updateField(field.id, { name: e.target.value });
                  }}
                  className="font-mono text-body-sm"
                />
              </div>
              {(field.type === "text" ||
                field.type === "textarea" ||
                field.type === "number" ||
                field.type === "email" ||
                field.type === "phone") && (
                <div className="space-y-1.5">
                  <Label htmlFor="field-placeholder">Placeholder</Label>
                  <Input
                    id="field-placeholder"
                    value={field.placeholder ?? ""}
                    onChange={(e) =>
                      updateField(field.id, { placeholder: e.target.value })
                    }
                  />
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="field-helptext">Help text</Label>
                <Input
                  id="field-helptext"
                  value={field.helpText ?? ""}
                  onChange={(e) =>
                    updateField(field.id, { helpText: e.target.value })
                  }
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          {(field.type === "select" ||
            field.type === "radio" ||
            field.type === "checkbox") && (
            <AccordionItem value="options" className="px-4">
              <AccordionTrigger>Options</AccordionTrigger>
              <AccordionContent className="space-y-2 pb-4">
                <OptionsEditor
                  options={field.options ?? []}
                  onChange={(opts) => updateField(field.id, { options: opts })}
                />
              </AccordionContent>
            </AccordionItem>
          )}

          <AccordionItem value="validation" className="px-4">
            <AccordionTrigger>Validation</AccordionTrigger>
            <AccordionContent className="space-y-4 pb-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="field-required">Required</Label>
                <Switch
                  id="field-required"
                  checked={Boolean(field.required)}
                  onCheckedChange={(checked) =>
                    updateField(field.id, { required: checked })
                  }
                />
              </div>
              {(field.type === "text" ||
                field.type === "textarea" ||
                field.type === "email" ||
                field.type === "phone") && (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="field-min-len">Min length</Label>
                      <Input
                        id="field-min-len"
                        type="number"
                        value={field.validation?.minLength ?? ""}
                        onChange={(e) =>
                          updateField(field.id, {
                            validation: {
                              ...field.validation,
                              minLength:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="field-max-len">Max length</Label>
                      <Input
                        id="field-max-len"
                        type="number"
                        value={field.validation?.maxLength ?? ""}
                        onChange={(e) =>
                          updateField(field.id, {
                            validation: {
                              ...field.validation,
                              maxLength:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}
              {field.type === "number" && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="field-min">Min</Label>
                    <Input
                      id="field-min"
                      type="number"
                      value={field.validation?.min ?? ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          validation: {
                            ...field.validation,
                            min:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="field-max">Max</Label>
                    <Input
                      id="field-max"
                      type="number"
                      value={field.validation?.max ?? ""}
                      onChange={(e) =>
                        updateField(field.id, {
                          validation: {
                            ...field.validation,
                            max:
                              e.target.value === ""
                                ? undefined
                                : Number(e.target.value),
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </aside>
  );
}

function OptionsEditor({
  options,
  onChange,
}: {
  options: FieldOption[];
  onChange: (opts: FieldOption[]) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((opt, idx) => (
        <div key={opt.id} className="flex items-center gap-1.5">
          <Input
            value={opt.label}
            placeholder="Label"
            onChange={(e) => {
              const next = [...options];
              next[idx] = { ...opt, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, "-") };
              onChange(next);
            }}
          />
          <button
            type="button"
            onClick={() => {
              onChange(options.filter((_, i) => i !== idx));
            }}
            className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive inline-flex items-center justify-center shrink-0"
            aria-label="Remove option"
          >
            <IconTrash className="size-3.5" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() =>
          onChange([
            ...options,
            { id: nanoid(6), label: `Option ${options.length + 1}`, value: `option-${options.length + 1}` },
          ])
        }
      >
        <IconPlus className="size-3.5" />
        Add option
      </Button>
    </div>
  );
}
