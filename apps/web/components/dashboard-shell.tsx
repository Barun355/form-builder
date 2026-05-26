"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { AppSidebar } from "~/components/app-sidebar";
import { SiteHeader } from "~/components/site-header";
import { SidebarInset, SidebarProvider } from "~/components/ui/sidebar";
import { useUser } from "~/hooks/auth";

/**
 * Authenticated dashboard shell: sidebar + header + content.
 * Redirects to /signin when no session.
 */
export function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useUser();

  useEffect(() => {
    if (!isLoading && !user?.id) {
      router.push("/signin");
    }
  }, [isLoading, user, router]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
