import type {
  FieldSchemaI,
  FormSchemaI,
} from "@repo/database/models/form-versions";

/**
 * Shape-only validation per locked v1 decision. Verifies that each key in
 * `data` references a field that exists in the schema, and that the value's
 * JS type matches the field's declared type. Does NOT enforce required,
 * regex, min/max, or option-membership — those are client-side in v1.
 */
export function validateDataShape(
  data: Record<string, unknown>,
  schema: FormSchemaI,
): void {
  const fieldsById = new Map<string, FieldSchemaI>(
    schema.fields.map((f) => [f.id, f]),
  );

  for (const [fieldId, value] of Object.entries(data)) {
    const field = fieldsById.get(fieldId);
    if (!field) {
      throw new Error(`Unknown field id in submission data: '${fieldId}'`);
    }
    if (value === null || value === undefined) continue;

    switch (field.type) {
      case "text":
      case "textarea":
      case "email":
      case "phone":
      case "select":
      case "radio":
      case "date":
      case "datetime":
        if (typeof value !== "string") {
          throw new Error(
            `Field '${fieldId}' expects a string, got ${typeof value}`,
          );
        }
        break;
      case "number":
        if (typeof value !== "number" || Number.isNaN(value)) {
          throw new Error(`Field '${fieldId}' expects a number`);
        }
        break;
      case "checkbox":
        if (
          !Array.isArray(value) ||
          !value.every((v) => typeof v === "string")
        ) {
          throw new Error(`Field '${fieldId}' expects an array of strings`);
        }
        break;
      case "file":
        // v1: file upload backend not implemented; accept whatever.
        break;
    }
  }
}
