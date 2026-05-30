"use client";

import { create, type StoreApi, type UseBoundStore } from "zustand";
import { nanoid } from "nanoid";
import type {
  FieldOption,
  FieldSchemaI,
  FieldType,
  FieldValidation,
  FormSchemaI,
  PageSchemaI,
  SectionSchemaI,
} from "@repo/database/models/form-versions";

import type { FormStatus } from "~/components/status-chip";

// ─── Types ───────────────────────────────────────────────────────────────────

export type SelectedType = "page" | "section" | "field";

export type BuilderVersionItem = {
  id: string;
  version: number;
  isPublished: boolean;
  submissionCount: number;
  createdAt: Date;
};

export type FormVisibility = "PUBLIC" | "UNLISTED";

export type BuilderState = {
  formId: string;
  formSlug: string;
  title: string;
  status: FormStatus;
  visibility: FormVisibility;
  publishedVersionId: string | null;

  // Schema being viewed/edited
  schema: FormSchemaI;
  initialSchema: FormSchemaI;

  // Theme attached to the form's latest version. null = System Default
  // look on the public URL. Lives in the store so the Settings sheet's
  // Appearance section can read/write it; saved via saveDraft (themeId
  // travels alongside schema on every draft save). Live-theme model:
  // theme edits propagate to consumers immediately (the public form
  // fetches the attached theme's current tokens at render time), so
  // there's no "published theme" snapshot to track separately.
  themeId: string | null;

  // Versions
  versions: BuilderVersionItem[];
  selectedVersionId: string | null;
  latestVersionId: string | null;

  // Editor
  activePageId: string | null;
  selectedId: string | null;
  selectedType: SelectedType | null;
  // Per-field flag: true if user manually edited the name (stops auto-fill)
  fieldNameTouched: Record<string, boolean>;

  // Save state
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  saveError: string | null;

  // ─── Actions ──────────────────────────────────────────────────────────────
  init(args: {
    formId: string;
    formSlug: string;
    title: string;
    status: FormStatus;
    visibility: FormVisibility;
    publishedVersionId: string | null;
    schema: FormSchemaI;
    themeId: string | null;
    versions: BuilderVersionItem[];
    latestVersionId: string;
  }): void;
  setTitle(t: string): void;
  setStatus(s: FormStatus): void;
  setVisibility(v: FormVisibility): void;
  setPublishedVersionId(id: string | null): void;
  setVersions(v: BuilderVersionItem[], latestVersionId: string): void;
  setThemeId(id: string | null): void;

  switchVersion(versionId: string, schema: FormSchemaI): void;

  setActivePage(pageId: string): void;
  addPage(): string;
  updatePage(id: string, patch: Partial<Pick<PageSchemaI, "title" | "description">>): void;
  deletePage(id: string): void;

  addSection(pageId: string): string;
  updateSection(id: string, patch: Partial<Pick<SectionSchemaI, "title" | "description">>): void;
  deleteSection(id: string): void;

  addField(args: { sectionId: string; type: FieldType; atIndex?: number }): string;
  updateField(id: string, patch: Partial<FieldSchemaI>, opts?: { fromLabel?: boolean }): void;
  setFieldNameManual(id: string): void;
  deleteField(id: string): void;
  duplicateField(id: string): string | null;
  reorderFieldInSection(sectionId: string, fromIndex: number, toIndex: number): void;

  updateThankYou(patch: Partial<NonNullable<FormSchemaI["thankYou"]>>): void;

  select(id: string | null, type: SelectedType | null): void;

  markSaving(): void;
  markSaved(at: Date): void;
  markSaveError(err: string): void;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const EMPTY_SCHEMA: FormSchemaI = { pages: [], sections: [], fields: [] };

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function hydrate(schema: FormSchemaI): FormSchemaI {
  // Ensure at least one page + one section so the builder always has somewhere
  // to drop fields.
  if (schema.pages.length === 0) {
    const pageId = nanoid(8);
    const sectionId = nanoid(8);
    return {
      pages: [
        { id: pageId, title: "Page 1", order: 0, sectionIds: [sectionId] },
      ],
      sections: [
        {
          id: sectionId,
          title: "",
          order: 0,
          pageId,
          fieldIds: [],
        },
      ],
      fields: [],
    };
  }
  return schema;
}

function fieldDefaults(type: FieldType): Partial<FieldSchemaI> {
  switch (type) {
    case "text":
      return { label: "Short answer", placeholder: "Type here..." };
    case "textarea":
      return { label: "Long answer", placeholder: "Type here..." };
    case "number":
      return { label: "Number" };
    case "email":
      return { label: "Email", placeholder: "you@example.com" };
    case "phone":
      return { label: "Phone", placeholder: "+1 555 000 1234" };
    case "select":
      return {
        label: "Dropdown",
        options: [
          { id: nanoid(6), label: "Option 1", value: "option-1" },
          { id: nanoid(6), label: "Option 2", value: "option-2" },
        ],
      };
    case "radio":
      return {
        label: "Single choice",
        options: [
          { id: nanoid(6), label: "Option 1", value: "option-1" },
          { id: nanoid(6), label: "Option 2", value: "option-2" },
        ],
      };
    case "checkbox":
      return {
        label: "Multiple choice",
        options: [
          { id: nanoid(6), label: "Option 1", value: "option-1" },
          { id: nanoid(6), label: "Option 2", value: "option-2" },
        ],
      };
    case "date":
      return { label: "Date" };
    case "datetime":
      return { label: "Date & time" };
    case "file":
      return { label: "File upload" };
  }
}

export function slugifyForName(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s-]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

// ─── Factory ─────────────────────────────────────────────────────────────────

export type BuilderStore = UseBoundStore<StoreApi<BuilderState>>;

export function createBuilderStore(): BuilderStore {
  return create<BuilderState>((set, get) => ({
    formId: "",
    formSlug: "",
    title: "",
    status: "draft",
    visibility: "UNLISTED",
    publishedVersionId: null,

    schema: EMPTY_SCHEMA,
    initialSchema: EMPTY_SCHEMA,
    themeId: null,

    versions: [],
    selectedVersionId: null,
    latestVersionId: null,

    activePageId: null,
    selectedId: null,
    selectedType: null,
    fieldNameTouched: {},

    isDirty: false,
    isSaving: false,
    lastSavedAt: null,
    saveError: null,

    init({ formId, formSlug, title, status, visibility, publishedVersionId, schema, themeId, versions, latestVersionId }) {
      const hydrated = hydrate(schema);
      set({
        formId,
        formSlug,
        title,
        status,
        visibility,
        publishedVersionId,
        schema: hydrated,
        initialSchema: clone(hydrated),
        themeId,
        versions,
        selectedVersionId: latestVersionId,
        latestVersionId,
        activePageId: hydrated.pages[0]?.id ?? null,
        selectedId: null,
        selectedType: null,
        fieldNameTouched: {},
        isDirty: false,
        isSaving: false,
        lastSavedAt: null,
        saveError: null,
      });
    },

    setTitle(t) {
      set({ title: t });
    },

    setStatus(s) {
      set({ status: s });
    },

    setVisibility(v) {
      set({ visibility: v });
    },

    setPublishedVersionId(id) {
      set({ publishedVersionId: id });
    },

    setVersions(v, latestVersionId) {
      set({ versions: v, latestVersionId });
    },

    setThemeId(id) {
      set({ themeId: id });
    },

    switchVersion(versionId, schema) {
      const hydrated = hydrate(schema);
      set({
        schema: hydrated,
        initialSchema: clone(hydrated),
        selectedVersionId: versionId,
        activePageId: hydrated.pages[0]?.id ?? null,
        selectedId: null,
        selectedType: null,
        fieldNameTouched: {},
        isDirty: false,
        saveError: null,
      });
    },

    setActivePage(pageId) {
      set({ activePageId: pageId, selectedId: null, selectedType: null });
    },

    addPage() {
      const id = nanoid(8);
      const { schema } = get();
      const order = schema.pages.length;
      const sectionId = nanoid(8);
      const nextSchema: FormSchemaI = {
        ...schema,
        pages: [
          ...schema.pages,
          { id, title: `Page ${order + 1}`, order, sectionIds: [sectionId] },
        ],
        sections: [
          ...schema.sections,
          { id: sectionId, title: "", order: 0, pageId: id, fieldIds: [] },
        ],
      };
      set({ schema: nextSchema, activePageId: id, isDirty: true });
      return id;
    },

    updatePage(id, patch) {
      const { schema } = get();
      const nextSchema: FormSchemaI = {
        ...schema,
        pages: schema.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      };
      set({ schema: nextSchema, isDirty: true });
    },

    deletePage(id) {
      const { schema, activePageId } = get();
      if (schema.pages.length <= 1) return; // invariant: keep at least one page
      const removingPage = schema.pages.find((p) => p.id === id);
      if (!removingPage) return;
      const sectionsToRemove = new Set(removingPage.sectionIds);
      const fieldsToRemove = new Set(
        schema.sections
          .filter((s) => sectionsToRemove.has(s.id))
          .flatMap((s) => s.fieldIds),
      );
      const nextPages = schema.pages
        .filter((p) => p.id !== id)
        .map((p, i) => ({ ...p, order: i }));
      const nextSchema: FormSchemaI = {
        pages: nextPages,
        sections: schema.sections.filter((s) => !sectionsToRemove.has(s.id)),
        fields: schema.fields.filter((f) => !fieldsToRemove.has(f.id)),
      };
      set({
        schema: nextSchema,
        isDirty: true,
        activePageId:
          activePageId === id ? (nextPages[0]?.id ?? null) : activePageId,
        selectedId: null,
        selectedType: null,
      });
    },

    addSection(pageId) {
      const id = nanoid(8);
      const { schema } = get();
      const page = schema.pages.find((p) => p.id === pageId);
      if (!page) return id;
      const order = page.sectionIds.length;
      const nextSchema: FormSchemaI = {
        ...schema,
        pages: schema.pages.map((p) =>
          p.id === pageId ? { ...p, sectionIds: [...p.sectionIds, id] } : p,
        ),
        sections: [
          ...schema.sections,
          { id, title: "", order, pageId, fieldIds: [] },
        ],
      };
      set({ schema: nextSchema, isDirty: true });
      return id;
    },

    updateSection(id, patch) {
      const { schema } = get();
      const nextSchema: FormSchemaI = {
        ...schema,
        sections: schema.sections.map((s) =>
          s.id === id ? { ...s, ...patch } : s,
        ),
      };
      set({ schema: nextSchema, isDirty: true });
    },

    deleteSection(id) {
      const { schema } = get();
      const section = schema.sections.find((s) => s.id === id);
      if (!section) return;
      const fieldsToRemove = new Set(section.fieldIds);
      const nextSchema: FormSchemaI = {
        ...schema,
        pages: schema.pages.map((p) => ({
          ...p,
          sectionIds: p.sectionIds.filter((sid) => sid !== id),
        })),
        sections: schema.sections.filter((s) => s.id !== id),
        fields: schema.fields.filter((f) => !fieldsToRemove.has(f.id)),
      };
      set({
        schema: nextSchema,
        isDirty: true,
        selectedId: null,
        selectedType: null,
      });
    },

    addField({ sectionId, type, atIndex }) {
      const id = nanoid(8);
      const { schema } = get();
      const section = schema.sections.find((s) => s.id === sectionId);
      if (!section) return id;
      const defaults = fieldDefaults(type);
      const label = defaults.label ?? "Untitled";
      const insertIndex = atIndex == null ? section.fieldIds.length : atIndex;
      const newField: FieldSchemaI = {
        id,
        type,
        name: slugifyForName(label) || `field_${id}`,
        label,
        placeholder: defaults.placeholder,
        helpText: undefined,
        required: false,
        defaultValue: undefined,
        disabled: false,
        order: insertIndex,
        sectionId,
        options: defaults.options as FieldOption[] | undefined,
        validation: undefined,
      };
      const nextFieldIds = [...section.fieldIds];
      nextFieldIds.splice(insertIndex, 0, id);
      const nextSchema: FormSchemaI = {
        ...schema,
        sections: schema.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                fieldIds: nextFieldIds,
              }
            : s,
        ),
        fields: [...schema.fields, newField].map((f) => {
          if (f.sectionId !== sectionId) return f;
          const idx = nextFieldIds.indexOf(f.id);
          return idx >= 0 ? { ...f, order: idx } : f;
        }),
      };
      set({
        schema: nextSchema,
        isDirty: true,
        selectedId: id,
        selectedType: "field",
      });
      return id;
    },

    updateField(id, patch, opts) {
      const { schema, fieldNameTouched } = get();
      let nextPatch = { ...patch };
      // If user updates the label and hasn't manually edited the name,
      // auto-fill the name.
      if (
        opts?.fromLabel &&
        patch.label !== undefined &&
        !fieldNameTouched[id]
      ) {
        const next = slugifyForName(patch.label);
        if (next) nextPatch.name = next;
      }
      const nextSchema: FormSchemaI = {
        ...schema,
        fields: schema.fields.map((f) =>
          f.id === id ? { ...f, ...nextPatch } : f,
        ),
      };
      set({ schema: nextSchema, isDirty: true });
    },

    setFieldNameManual(id) {
      set((s) => ({
        fieldNameTouched: { ...s.fieldNameTouched, [id]: true },
      }));
    },

    deleteField(id) {
      const { schema } = get();
      const field = schema.fields.find((f) => f.id === id);
      if (!field) return;
      const nextSchema: FormSchemaI = {
        ...schema,
        sections: schema.sections.map((s) =>
          s.id === field.sectionId
            ? { ...s, fieldIds: s.fieldIds.filter((fid) => fid !== id) }
            : s,
        ),
        fields: schema.fields
          .filter((f) => f.id !== id)
          .map((f) =>
            f.sectionId === field.sectionId
              ? { ...f, order: f.order > field.order ? f.order - 1 : f.order }
              : f,
          ),
      };
      set({
        schema: nextSchema,
        isDirty: true,
        selectedId: null,
        selectedType: null,
      });
    },

    duplicateField(id) {
      const { schema } = get();
      const original = schema.fields.find((f) => f.id === id);
      if (!original) return null;
      const newId = nanoid(8);
      const section = schema.sections.find((s) => s.id === original.sectionId);
      if (!section) return null;
      const insertIndex =
        section.fieldIds.indexOf(id) >= 0
          ? section.fieldIds.indexOf(id) + 1
          : section.fieldIds.length;
      const newField: FieldSchemaI = {
        ...clone(original),
        id: newId,
        name: `${original.name}_copy`,
        label: `${original.label} (copy)`,
        order: insertIndex,
      };
      const nextFieldIds = [...section.fieldIds];
      nextFieldIds.splice(insertIndex, 0, newId);
      const nextSchema: FormSchemaI = {
        ...schema,
        sections: schema.sections.map((s) =>
          s.id === section.id ? { ...s, fieldIds: nextFieldIds } : s,
        ),
        fields: [...schema.fields, newField].map((f) => {
          if (f.sectionId !== section.id) return f;
          const idx = nextFieldIds.indexOf(f.id);
          return idx >= 0 ? { ...f, order: idx } : f;
        }),
      };
      set({
        schema: nextSchema,
        isDirty: true,
        selectedId: newId,
        selectedType: "field",
      });
      return newId;
    },

    reorderFieldInSection(sectionId, fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      const { schema } = get();
      const section = schema.sections.find((s) => s.id === sectionId);
      if (!section) return;
      const nextFieldIds = [...section.fieldIds];
      const [moved] = nextFieldIds.splice(fromIndex, 1);
      if (!moved) return;
      nextFieldIds.splice(toIndex, 0, moved);
      const nextSchema: FormSchemaI = {
        ...schema,
        sections: schema.sections.map((s) =>
          s.id === sectionId ? { ...s, fieldIds: nextFieldIds } : s,
        ),
        fields: schema.fields.map((f) => {
          if (f.sectionId !== sectionId) return f;
          const idx = nextFieldIds.indexOf(f.id);
          return idx >= 0 ? { ...f, order: idx } : f;
        }),
      };
      set({ schema: nextSchema, isDirty: true });
    },

    updateThankYou(patch) {
      const { schema } = get();
      const current = schema.thankYou ?? {};
      const next = { ...current, ...patch };
      // Drop undefined keys so the JSON stays clean.
      for (const key of Object.keys(next) as Array<keyof typeof next>) {
        if (next[key] === undefined) delete next[key];
      }
      const isEmpty = Object.keys(next).length === 0;
      const nextSchema: FormSchemaI = {
        ...schema,
        thankYou: isEmpty ? undefined : next,
      };
      set({ schema: nextSchema, isDirty: true });
    },

    select(id, type) {
      set({ selectedId: id, selectedType: type });
    },

    markSaving() {
      set({ isSaving: true, saveError: null });
    },

    markSaved(at) {
      set((s) => ({
        isSaving: false,
        isDirty: false,
        lastSavedAt: at,
        saveError: null,
        initialSchema: clone(s.schema),
      }));
    },

    markSaveError(err) {
      set({ isSaving: false, saveError: err });
    },
  }));
}
