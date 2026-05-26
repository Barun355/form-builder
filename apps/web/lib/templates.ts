import templatesJson from "./templates.json";

export type TemplateAccent =
  | "primary"
  | "success"
  | "warning"
  | "info"
  | "destructive";

export interface Template {
  slug: string;
  title: string;
  description: string;
  fieldCount: number;
  fieldLabels: string[];
  tag: string;
  accent: TemplateAccent;
}

export const templates = templatesJson as Template[];
