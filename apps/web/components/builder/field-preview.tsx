"use client";

import type { FieldSchemaI } from "@repo/database/models/form-versions";

import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";

/**
 * Visual-only preview of a field rendered inside the builder canvas. All
 * inputs are disabled to make clear this is a design-time representation.
 */
export function FieldPreview({ field }: { field: FieldSchemaI }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-label">
        {field.label || (
          <span className="text-muted-foreground italic">
            Untitled field
          </span>
        )}
        {field.required ? <span className="text-destructive">*</span> : null}
      </Label>
      <PreviewInput field={field} />
      {field.helpText ? (
        <p className="text-body-sm text-muted-foreground">{field.helpText}</p>
      ) : null}
    </div>
  );
}

function PreviewInput({ field }: { field: FieldSchemaI }) {
  switch (field.type) {
    case "text":
    case "email":
    case "phone":
      return (
        <Input
          type={field.type === "phone" ? "tel" : field.type}
          placeholder={field.placeholder ?? ""}
          disabled
          readOnly
        />
      );
    case "number":
      return (
        <Input
          type="number"
          placeholder={field.placeholder ?? ""}
          disabled
          readOnly
        />
      );
    case "textarea":
      return (
        <Textarea
          placeholder={field.placeholder ?? ""}
          rows={3}
          disabled
          readOnly
        />
      );
    case "date":
    case "datetime":
      return (
        <Input
          type={field.type === "datetime" ? "datetime-local" : "date"}
          disabled
          readOnly
        />
      );
    case "select":
      return (
        <div className="flex h-9 items-center justify-between rounded-md border border-input bg-transparent px-3 text-body-sm text-muted-foreground">
          <span>{field.placeholder ?? "Choose..."}</span>
          <span>▼</span>
        </div>
      );
    case "radio":
      return (
        <div className="flex flex-col gap-1.5">
          {(field.options ?? []).slice(0, 3).map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <span className="inline-block size-3 rounded-full border border-input" />
              {opt.label}
            </div>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <div className="flex flex-col gap-1.5">
          {(field.options ?? []).slice(0, 3).map((opt) => (
            <div key={opt.id} className="flex items-center gap-2 text-body-sm text-muted-foreground">
              <span className="inline-block size-3 rounded border border-input" />
              {opt.label}
            </div>
          ))}
        </div>
      );
    case "file":
      return (
        <div className="flex items-center justify-between gap-2 rounded-md border border-dashed border-input px-3 py-2 text-body-sm text-muted-foreground">
          <span>Choose file…</span>
          <span className="text-caps uppercase text-warning">Coming soon</span>
        </div>
      );
    default:
      return null;
  }
}
