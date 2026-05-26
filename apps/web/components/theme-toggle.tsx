"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Monitor, Moon, Sun } from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

type Variant = "icon" | "ghost";

export function ThemeToggle({
  variant = "icon",
  align = "end",
}: {
  variant?: Variant;
  align?: "start" | "center" | "end";
}) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Reserve the space to prevent layout shift; render a transparent
    // placeholder of the same dimensions.
    return (
      <Button
        variant="ghost"
        size={variant === "icon" ? "icon" : "sm"}
        aria-hidden="true"
        className="opacity-0 pointer-events-none"
      >
        <Sun className="size-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size={variant === "icon" ? "icon" : "sm"}
          aria-label="Toggle theme"
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="size-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute size-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="min-w-32">
        <ThemeItem
          label="Light"
          active={theme === "light"}
          onSelect={() => setTheme("light")}
          Icon={Sun}
        />
        <ThemeItem
          label="Dark"
          active={theme === "dark"}
          onSelect={() => setTheme("dark")}
          Icon={Moon}
        />
        <ThemeItem
          label="System"
          active={theme === "system"}
          onSelect={() => setTheme("system")}
          Icon={Monitor}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ThemeItem({
  label,
  active,
  onSelect,
  Icon,
}: {
  label: string;
  active: boolean;
  onSelect: () => void;
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <DropdownMenuItem
      onClick={onSelect}
      // Active state uses a primary-tinted surface — distinct from the
      // neutral `bg-accent` hover state, so "currently selected" reads
      // differently from "hovered." A trailing dot reinforces the choice.
      className={
        active
          ? "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary font-medium"
          : ""
      }
    >
      <Icon className="size-4 mr-2" />
      <span className="flex-1">{label}</span>
      {active && (
        <span className="size-1.5 rounded-full bg-primary ml-2" aria-hidden />
      )}
    </DropdownMenuItem>
  );
}
