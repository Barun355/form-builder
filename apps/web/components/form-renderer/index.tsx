"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import type {
  FieldSchemaI,
  FormSchemaI,
  PageSchemaI,
  SectionSchemaI,
} from "@repo/database/models/form-versions";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Checkbox } from "~/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { cn } from "~/lib/utils";

export type FormRendererValues = Record<string, unknown>;

type Props = {
  schema: FormSchemaI;
  mode?: "preview" | "live";
  values?: FormRendererValues;
  onChange?: (values: FormRendererValues) => void;
  onSubmit?: (
    values: FormRendererValues,
    extras: { honeypot: string },
  ) => void | Promise<void>;
  submitLabel?: string;
  /** Disable all inputs and hide the submit button (used when form is closed). */
  readOnly?: boolean;
  /** Render the honeypot field for spam protection. Defaults to mode==='live'. */
  withHoneypot?: boolean;
  /** Show spinner + disable the submit button. */
  isSubmitting?: boolean;
};

export function FormRenderer({
  schema,
  mode = "preview",
  values: controlled,
  onChange,
  onSubmit,
  submitLabel = "Submit",
  readOnly = false,
  withHoneypot,
  isSubmitting = false,
}: Props) {
  const honeypotRef = React.useRef<HTMLInputElement>(null);
  const shouldRenderHoneypot = withHoneypot ?? mode === "live";
  const [internalValues, setInternalValues] = React.useState<FormRendererValues>(
    () => controlled ?? {},
  );
  const values = controlled ?? internalValues;

  const pages = React.useMemo(
    () => [...schema.pages].sort((a, b) => a.order - b.order),
    [schema.pages],
  );

  const [pageIndex, setPageIndex] = React.useState(0);
  const activePage = pages[pageIndex];

  // Reset to page 0 when schema changes meaningfully (e.g. preview re-open)
  React.useEffect(() => {
    if (pageIndex >= pages.length) setPageIndex(0);
  }, [pages.length, pageIndex]);

  const sectionsForPage = React.useMemo(() => {
    if (!activePage) return [] as SectionSchemaI[];
    const byId = new Map(schema.sections.map((s) => [s.id, s]));
    return activePage.sectionIds
      .map((id) => byId.get(id))
      .filter((s): s is SectionSchemaI => Boolean(s))
      .sort((a, b) => a.order - b.order);
  }, [activePage, schema.sections]);

  const fieldsBySectionId = React.useMemo(() => {
    const map = new Map<string, FieldSchemaI[]>();
    const byId = new Map(schema.fields.map((f) => [f.id, f]));
    for (const section of schema.sections) {
      const list = section.fieldIds
        .map((id) => byId.get(id))
        .filter((f): f is FieldSchemaI => Boolean(f))
        .sort((a, b) => a.order - b.order);
      map.set(section.id, list);
    }
    return map;
  }, [schema.fields, schema.sections]);

  function updateValue(fieldId: string, value: unknown) {
    const next = { ...values, [fieldId]: value };
    if (controlled === undefined) setInternalValues(next);
    onChange?.(next);
  }

  const isLast = pageIndex >= pages.length - 1;
  const isFirst = pageIndex <= 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly) return;
    if (!isLast) {
      setPageIndex((i) => Math.min(pages.length - 1, i + 1));
      return;
    }
    if (mode === "preview" || !onSubmit) return;
    const honeypot = honeypotRef.current?.value ?? "";
    await onSubmit(values, { honeypot });
  }

  if (pages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-16 text-muted-foreground">
        <p className="text-body-sm">This form has no content yet.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {shouldRenderHoneypot ? (
        <input
          ref={honeypotRef}
          type="text"
          name="_website"
          tabIndex={-1}
          autoComplete="off"
          defaultValue=""
          aria-hidden="true"
          className="absolute left-[-9999px] top-0 h-px w-px opacity-0 pointer-events-none"
        />
      ) : null}

      {mode === "preview" ? (
        <div className="rounded-lg border border-info/30 bg-info/10 px-3 py-2 text-info text-body-sm">
          This is a preview — submissions are not saved.
        </div>
      ) : null}

      {pages.length > 1 ? (
        <div className="flex items-center justify-between text-caps uppercase text-muted-foreground">
          <span>
            Step {pageIndex + 1} of {pages.length}
          </span>
          {activePage?.title ? (
            <span className="text-foreground normal-case tracking-normal text-body-sm font-medium">
              {activePage.title}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-col gap-8">
        {sectionsForPage.map((section) => (
          <RendererSection
            key={section.id}
            section={section}
            fields={fieldsBySectionId.get(section.id) ?? []}
            values={values}
            onChange={updateValue}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div>
          {!isFirst ? (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setPageIndex((i) => Math.max(0, i - 1))}
            >
              Back
            </Button>
          ) : null}
        </div>
        {!readOnly ? (
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && isLast ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : null}
            {isLast ? submitLabel : "Next"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function RendererSection({
  section,
  fields,
  values,
  onChange,
}: {
  section: SectionSchemaI;
  fields: FieldSchemaI[];
  values: FormRendererValues;
  onChange: (id: string, value: unknown) => void;
}) {
  return (
    <section className="flex flex-col gap-5">
      {section.title || section.description ? (
        <header>
          {section.title ? (
            <h3 className="text-h4 text-foreground">{section.title}</h3>
          ) : null}
          {section.description ? (
            <p className="text-body-sm text-muted-foreground mt-1">
              {section.description}
            </p>
          ) : null}
        </header>
      ) : null}
      <div className="flex flex-col gap-4">
        {fields.map((field) => (
          <RendererField
            key={field.id}
            field={field}
            value={values[field.id]}
            onChange={(value) => onChange(field.id, value)}
          />
        ))}
      </div>
    </section>
  );
}

function RendererField({
  field,
  value,
  onChange,
}: {
  field: FieldSchemaI;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const baseLabel = (
    <Label htmlFor={field.id} className="text-label">
      {field.label}
      {field.required ? <span className="text-destructive">*</span> : null}
    </Label>
  );
  const helpText = field.helpText ? (
    <p className="text-body-sm text-muted-foreground mt-1">{field.helpText}</p>
  ) : null;

  switch (field.type) {
    case "text":
    case "email":
    case "phone":
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <Input
            id={field.id}
            type={field.type === "phone" ? "tel" : field.type}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
            minLength={field.validation?.minLength}
            maxLength={field.validation?.maxLength}
          />
          {helpText}
        </div>
      );

    case "number":
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <Input
            id={field.id}
            type="number"
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            value={value == null ? "" : String(value)}
            onChange={(e) =>
              onChange(e.target.value === "" ? null : Number(e.target.value))
            }
            min={field.validation?.min}
            max={field.validation?.max}
          />
          {helpText}
        </div>
      );

    case "textarea":
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <Textarea
            id={field.id}
            placeholder={field.placeholder}
            disabled={field.disabled}
            required={field.required}
            rows={4}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {helpText}
        </div>
      );

    case "date":
    case "datetime":
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <Input
            id={field.id}
            type={field.type === "datetime" ? "datetime-local" : "date"}
            disabled={field.disabled}
            required={field.required}
            value={(value as string) ?? ""}
            onChange={(e) => onChange(e.target.value)}
          />
          {helpText}
        </div>
      );

    case "select":
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <Select
            value={(value as string) ?? ""}
            onValueChange={onChange}
            disabled={field.disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder ?? "Choose..."} />
            </SelectTrigger>
            <SelectContent>
              {(field.options ?? []).map((opt) => (
                <SelectItem key={opt.id} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {helpText}
        </div>
      );

    case "radio":
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <RadioGroup
            value={(value as string) ?? ""}
            onValueChange={onChange}
            disabled={field.disabled}
          >
            {(field.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <RadioGroupItem value={opt.value} id={`${field.id}-${opt.id}`} />
                <Label htmlFor={`${field.id}-${opt.id}`} className="text-body">
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
          {helpText}
        </div>
      );

    case "checkbox": {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string, checked: boolean) => {
        const next = checked
          ? Array.from(new Set([...selected, v]))
          : selected.filter((x) => x !== v);
        onChange(next);
      };
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <div className="flex flex-col gap-2">
            {(field.options ?? []).map((opt) => (
              <div key={opt.id} className="flex items-center gap-2">
                <Checkbox
                  id={`${field.id}-${opt.id}`}
                  checked={selected.includes(opt.value)}
                  onCheckedChange={(c) => toggle(opt.value, Boolean(c))}
                  disabled={field.disabled}
                />
                <Label htmlFor={`${field.id}-${opt.id}`} className="text-body">
                  {opt.label}
                </Label>
              </div>
            ))}
          </div>
          {helpText}
        </div>
      );
    }

    case "file":
      return (
        <div className="flex flex-col gap-1.5">
          {baseLabel}
          <div
            className={cn(
              "flex items-center justify-between gap-2 rounded-md border border-dashed border-border px-3 py-2 text-body-sm text-muted-foreground",
            )}
          >
            <span>Choose file…</span>
            <span className="text-caps uppercase text-warning">
              Coming soon
            </span>
          </div>
          {helpText}
        </div>
      );

    default:
      return null;
  }
}
