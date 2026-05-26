"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  IconChartBar,
  IconClipboardText,
  IconCompass,
  IconDashboard,
  IconLogout,
  IconInnerShadowTop,
} from "@tabler/icons-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "~/components/ui/sidebar";
import { Skeleton } from "~/components/ui/skeleton";
import { ThemeToggle } from "~/components/theme-toggle";
import { cn } from "~/lib/utils";
import { useSignOut, useUser } from "~/hooks/auth";

const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { title: "Forms", href: "/dashboard/forms", icon: IconClipboardText },
  { title: "Analytics", href: "/dashboard/analytics", icon: IconChartBar },
  { title: "Explore", href: "/explore", icon: IconCompass },
] as const;

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? "";
  const { user } = useUser();
  const isFreePlan = user?.plan === "free";

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link href="/dashboard">
                <IconInnerShadowTop className="size-5! text-primary" />
                <span className="text-base font-semibold">Simple Form</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(`${item.href}/`);
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      className={cn(
                        isActive &&
                          "bg-sidebar-accent text-sidebar-accent-foreground",
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.title}</span>
                        {item.href === "/dashboard/analytics" && isFreePlan ? (
                          <span className="ml-auto inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0 text-[10px] font-semibold uppercase tracking-wider text-primary">
                            Pro
                          </span>
                        ) : null}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-mono">
            Theme
          </span>
          <ThemeToggle />
        </div>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavUser() {
  const router = useRouter();
  const { isMobile } = useSidebar();
  const { user, isLoading } = useUser();
  const { signOutAsync, status: signOutStatus } = useSignOut();

  const handleSignOut = async () => {
    try {
      await signOutAsync();
      toast.success("Signed out");
    } catch (err) {
      // Cookie may already be expired/invalid — surface it but still navigate
      // out, since the user clearly wants to leave the session.
      const message = err instanceof Error ? err.message : "Sign-out failed";
      toast.error(message);
    } finally {
      // Land on the marketing page; if they want to sign back in, the nav
      // there points them at /signin.
      router.replace("/");
      router.refresh();
    }
  };

  if (isLoading || !user) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        </SidebarMenuItem>
      </SidebarMenu>
    );
  }

  const initials = user.fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                {user.profileImageUrl ? (
                  <AvatarImage src={user.profileImageUrl} alt={user.fullName} />
                ) : null}
                <AvatarFallback className="rounded-lg bg-primary/15 text-primary font-medium">
                  {initials || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{user.fullName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  {user.profileImageUrl ? (
                    <AvatarImage
                      src={user.profileImageUrl}
                      alt={user.fullName}
                    />
                  ) : null}
                  <AvatarFallback className="rounded-lg bg-primary/15 text-primary font-medium">
                    {initials || "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{user.fullName}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              disabled={signOutStatus === "pending"}
            >
              <IconLogout />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
