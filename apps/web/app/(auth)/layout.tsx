'use client'

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useUser } from "~/hooks/auth";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter()
  const { user } = useUser();

  useEffect(() => {
    if (user?.id) {
      router.push("/dashboard")
    }
  }, [user])
  return <>{children}</>;
}