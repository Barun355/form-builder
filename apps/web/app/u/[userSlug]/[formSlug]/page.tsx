"use client";

import { use } from "react";
import { IconAlertTriangle } from "@tabler/icons-react";

import { PublicFormRenderer } from "~/components/public-form-renderer";
import { Skeleton } from "~/components/ui/skeleton";
import { usePublicForm } from "~/hooks/form";
import type { FormSchemaI } from "@repo/database/models/form-versions";
import type { ThemeTokensI } from "@repo/theme";

export default function PublicFormPage({
  params,
}: {
  params: Promise<{ userSlug: string; formSlug: string }>;
}) {
  const { userSlug, formSlug } = use(params);
  const { form, isLoading } = usePublicForm({ userSlug, formSlug });

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-2xl px-6 py-16 space-y-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="size-12 rounded-xl bg-muted text-muted-foreground flex items-center justify-center mb-4">
          <IconAlertTriangle className="size-5" />
        </div>
        <h1 className="text-h3 text-foreground mb-1">Form not available</h1>
        <p className="text-body-sm text-muted-foreground max-w-md">
          This form might have been removed, archived, or never published.
        </p>
      </div>
    );
  }

  return (
    <PublicFormRenderer
      formTitle={form.title}
      formDescription={form.description ?? undefined}
      status={form.status}
      versionId={form.publishedVersion.id}
      schema={form.publishedVersion.schema as FormSchemaI}
      // `theme` is the server-owned snapshot taken at form publish time
      // (null for unthemed forms). Strict-typed at the boundary so the
      // renderer downstream gets the proper shape instead of `unknown`.
      theme={(form.theme as ThemeTokensI | null) ?? null}
    />
  );
}
