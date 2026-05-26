"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";

import { BuilderShell } from "~/components/builder/builder-shell";
import { Skeleton } from "~/components/ui/skeleton";
import { useUser } from "~/hooks/auth";

export default function FormEditPage({
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
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="h-14 border-b flex items-center px-4 gap-3">
          <Skeleton className="size-8" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <div className="flex flex-1 items-center justify-center">
          <Skeleton className="h-32 w-72 rounded-xl" />
        </div>
      </div>
    );
  }

  return <BuilderShell formId={id} />;
}
