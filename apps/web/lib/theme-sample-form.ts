import type { FormSchemaI } from "@repo/database/models/form-versions";

/**
 * Sample form fixture used by the theme editor preview pane and the
 * standalone `/preview` route. Contains one of every supported field type
 * so every theme change has somewhere to land visibly. Stable shape — keep
 * field types in sync with @repo/theme's FIELD_TYPES list as new types
 * are added.
 */
export const sampleFormSchema: FormSchemaI = {
  pages: [
    {
      id: "p1",
      title: "Tell us about you",
      order: 0,
      sectionIds: ["s1", "s2"],
    },
  ],
  sections: [
    {
      id: "s1",
      title: "Basics",
      description: "A quick first-impression pass.",
      order: 0,
      pageId: "p1",
      fieldIds: ["f-name", "f-email", "f-bio"],
    },
    {
      id: "s2",
      title: "Preferences",
      order: 1,
      pageId: "p1",
      fieldIds: ["f-favorite", "f-channels", "f-rating", "f-birthday"],
    },
  ],
  fields: [
    {
      id: "f-name",
      type: "text",
      name: "name",
      label: "Your name",
      placeholder: "Ada Lovelace",
      required: true,
      order: 0,
      sectionId: "s1",
    },
    {
      id: "f-email",
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "you@example.com",
      required: true,
      helpText: "We'll never share this — we promise.",
      order: 1,
      sectionId: "s1",
    },
    {
      id: "f-bio",
      type: "textarea",
      name: "bio",
      label: "Tell us a bit about yourself",
      placeholder: "I'm a designer who loves…",
      order: 2,
      sectionId: "s1",
    },
    {
      id: "f-favorite",
      type: "select",
      name: "favorite",
      label: "Favorite season",
      placeholder: "Pick one…",
      order: 0,
      sectionId: "s2",
      options: [
        { id: "o-spr", label: "Spring", value: "spring" },
        { id: "o-sum", label: "Summer", value: "summer" },
        { id: "o-fall", label: "Fall", value: "fall" },
        { id: "o-win", label: "Winter", value: "winter" },
      ],
    },
    {
      id: "f-channels",
      type: "checkbox",
      name: "channels",
      label: "How should we reach you?",
      helpText: "Pick all that work.",
      order: 1,
      sectionId: "s2",
      options: [
        { id: "c-email", label: "Email", value: "email" },
        { id: "c-sms", label: "SMS", value: "sms" },
        { id: "c-push", label: "Push notifications", value: "push" },
      ],
    },
    {
      id: "f-rating",
      type: "radio",
      name: "rating",
      label: "How do you feel today?",
      order: 2,
      sectionId: "s2",
      options: [
        { id: "r-1", label: "Great", value: "great" },
        { id: "r-2", label: "Okay", value: "okay" },
        { id: "r-3", label: "Not great", value: "not_great" },
      ],
    },
    {
      id: "f-birthday",
      type: "date",
      name: "birthday",
      label: "Birthday",
      order: 3,
      sectionId: "s2",
    },
  ],
  thankYou: {
    title: "Preview submitted",
    message:
      "This is a sample form — nothing was actually saved. Tweak the theme and the form will repaint live.",
  },
};
