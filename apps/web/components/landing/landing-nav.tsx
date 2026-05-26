"use client";

import * as React from "react";
import Link from "next/link";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { ArrowRight, Menu, X } from "lucide-react";

import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme-toggle";
import { useUser } from "~/hooks/auth";
import { cn } from "~/lib/utils";

const sectionLinks = [
  { label: "Features", href: "/#features" },
  { label: "Templates", href: "/templates" },
  { label: "Explore", href: "/explore" },
  { label: "Pricing", href: "/#pricing" },
];

export function LandingNav() {
  const { user, isLoading } = useUser();
  const [scrollY, setScrollY] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fade tint in over the first 80px of scroll — matches the Linear/Vercel
  // pattern (no hard snap at a threshold). Caps at ~0.78 alpha.
  const tintOpacity = Math.min(scrollY / 80, 1) * 0.78;

  return (
    <header className="sticky top-0 z-50 w-full transform-gpu">
      {/* Glass surface — absolute child so iOS Safari rubber-band doesn't
          drop the backdrop-filter during overscroll. */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 transition-[background-color,border-color] duration-200",
          // Always-on hairline bottom edge (low alpha so it doesn't read heavy)
          "border-b border-foreground/6",
          // Frosted glass — blur+saturate combo (the Apple/Linear recipe)
          "[backdrop-filter:blur(20px)_saturate(180%)]",
          "[-webkit-backdrop-filter:blur(20px)_saturate(180%)]",
        )}
        style={{
          // Lifted surface tint — sits one elevation step ABOVE --background,
          // so the nav reads as a distinct surface even where there's
          // nothing behind it to blur. Uses --card OKLCH at variable alpha.
          backgroundColor: `color-mix(in oklch, var(--card) ${tintOpacity * 100}%, transparent)`,
        }}
      />
      {/* Subtle top "light catch" — fakes the highlight glass would have
          if real light were hitting its top edge. Premium nav signature. */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-foreground/8 to-transparent"
      />

      <div className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground"
        >
          <IconInnerShadowTop className="size-5 text-primary" />
          <span>Simple Form</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {sectionLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-body-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <ThemeToggle />
          {isLoading ? (
            <div className="h-9 w-32" />
          ) : user ? (
            <Button asChild size="sm">
              <Link href="/dashboard">
                Open dashboard
                <ArrowRight className="size-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/signin">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/signup">
                  Start building
                  <ArrowRight className="size-4 ml-1" />
                </Link>
              </Button>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen((v) => !v)}
            aria-label="Open menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="relative md:hidden border-t border-foreground/6 bg-card/95 [backdrop-filter:blur(20px)_saturate(180%)] [-webkit-backdrop-filter:blur(20px)_saturate(180%)]">
          <nav className="mx-auto max-w-7xl px-4 py-4 flex flex-col gap-1">
            {sectionLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-2 text-body text-foreground hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-2">
              {user ? (
                <Button asChild className="col-span-2" onClick={() => setOpen(false)}>
                  <Link href="/dashboard">Open dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button asChild variant="outline" onClick={() => setOpen(false)}>
                    <Link href="/signin">Sign in</Link>
                  </Button>
                  <Button asChild onClick={() => setOpen(false)}>
                    <Link href="/signup">Start building</Link>
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
