"use client";

import { use, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { IconAlertTriangle, IconArrowLeft } from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import { FormRenderer } from "~/components/form-renderer";
import { Skeleton } from "~/components/ui/skeleton";
import { ThemeStyle } from "~/components/theme-style";
import { sampleFormSchema } from "~/lib/theme-sample-form";
import { useUser } from "~/hooks/auth";
import { useTheme } from "~/hooks/theme";
import { cn } from "~/lib/utils";

/**
 * Standalone preview route — renders the sample form full-bleed with
 * the theme applied and no editor chrome. Reachable from the editor's
 * "Open in new tab" link and from the share-with-stakeholders flow.
 *
 * Visibility is enforced at the service layer: `theme.getById` returns
 * NOT_FOUND for private themes the caller doesn't own, so this route
 * can't be used to peek at someone else's draft.
 */
export default function ThemePreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: userLoading } = useUser();
  const { theme, isLoading: themeLoading, isError, error } = useTheme(id);

  useEffect(() => {
    if (!userLoading && !user?.id) {
      router.push("/signin");
    }
  }, [userLoading, user, router]);

  if (userLoading || themeLoading) {
    return (
      <div className="min-h-screen p-6">
        <Skeleton className="mx-auto h-96 w-full max-w-2xl rounded-xl" />
      </div>
    );
  }

  if (isError || !theme) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <IconAlertTriangle className="size-5" />
        </div>
        <div className="max-w-md">
          <h1 className="text-h3 text-foreground">Preview not available</h1>
          <p className="mt-1 text-body-sm text-muted-foreground">
            {error?.message?.includes("not found")
              ? "This theme isn't available — it may have been deleted, or you don't have permission to view it."
              : "Failed to load the theme."}
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/dashboard/themes">
            <IconArrowLeft className="size-4" />
            Back to themes
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      {/*
        Floating return chip — sits outside the themed root so it always
        reads in the editor's color scheme, never repainted by the theme.
      */}
      <div className="fixed top-3 right-3 z-50">
        <Button
          variant="secondary"
          size="sm"
          asChild
          className="shadow-md"
        >
          <Link href={`/dashboard/themes/${id}`}>
            <IconArrowLeft className="size-4" />
            Back to editor
          </Link>
        </Button>
      </div>

      {/*
        Two-layer themed surface — outer `data-sf-root` paints the page
        background (solid / gradient / image); inner `.sf-card` is the
        constrained card with surface color, border, radius, shadow.
        Contract enforced by packages/theme/compile.ts.

        Mode class mirrors the public form renderer: explicit class for
        light/dark, none for auto (so OS preference drives the CSS
        @media block the compiler emits).
      */}
      <div
        className={cn(
          "min-h-screen sf-form",
          theme.tokens.mode === "light" && "sf-light",
          theme.tokens.mode === "dark" && "sf-dark",
        )}
        data-sf-root
      >
        <ThemeStyle tokens={theme.tokens} />
        <div className="mx-auto w-full max-w-2xl px-6 py-12">
          <div className="sf-card">
            {sampleFormSchema.pages[0]?.title ? (
              <header className="mb-8">
                <h1 data-sf-heading="1">
                  {sampleFormSchema.pages[0].title}
                </h1>
              </header>
            ) : null}
            <FormRenderer
              schema={sampleFormSchema}
              mode="preview"
              withHoneypot={false}
            />
          </div>
        </div>
      </div>
    </>
  );
}
