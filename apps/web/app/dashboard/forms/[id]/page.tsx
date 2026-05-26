"use client"

import { use } from "react"
import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { AppSidebar } from "~/components/app-sidebar"
import { SiteHeader } from "~/components/site-header"
import { Button } from "~/components/ui/button"
import {
  SidebarInset,
  SidebarProvider,
} from "~/components/ui/sidebar"

export default function FormDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)

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
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <Button asChild variant="ghost" size="sm" className="-ml-2">
                  <Link href="/dashboard/forms">
                    <IconArrowLeft />
                    Back to forms
                  </Link>
                </Button>
              </div>

              <div className="px-4 lg:px-6 max-w-2xl">
                <h1 className="text-3xl font-bold">Form builder — coming in Phase 2</h1>
                <p className="text-muted-foreground mt-2">
                  The drag-and-drop builder for form{" "}
                  <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono">{id}</code>{" "}
                  is being rebuilt. The new UI lands in UI Phase 2 (powered by server Phase 4).
                </p>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
