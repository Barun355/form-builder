"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Skeleton } from "~/components/ui/skeleton";
import { useUser } from "~/hooks/auth";
import { ThemeEditorShell } from "~/components/theme-builder/theme-editor-shell";

export default function ThemeEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user?.id) {
      router.push("/signin");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user) {
    return (
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="h-14 border-b flex items-center px-4 gap-3">
          <Skeleton className="size-8" />
          <Skeleton className="h-7 w-40" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-32 w-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return <ThemeEditorShell themeId={id} />;
}
