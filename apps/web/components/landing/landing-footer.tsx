import Link from "next/link";
import { IconBrandGithub, IconBrandX, IconBrandLinkedin, IconInnerShadowTop } from "@tabler/icons-react";

// Only links that actually go somewhere — dead "#" placeholders removed.
// Each working destination corresponds to an in-app route or a real mailto.
const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/#features" },
      { label: "Templates", href: "/templates" },
      { label: "Explore", href: "/explore" },
      { label: "Pricing", href: "/#pricing" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", href: "/signin" },
      { label: "Start free", href: "/signup" },
      { label: "Dashboard", href: "/dashboard" },
    ],
  },
  {
    title: "Contact",
    links: [
      { label: "Email us", href: "mailto:hello@simpleform.app" },
      { label: "Sales", href: "mailto:hello@simpleform.app?subject=Sales%20inquiry" },
    ],
  },
];

export function LandingFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.6fr_repeat(3,1fr)]">
          <div>
            <Link
              href="/"
              className="flex items-center gap-2 font-semibold text-foreground"
            >
              <IconInnerShadowTop className="size-5 text-primary" />
              <span>Simple Form</span>
            </Link>
            <p className="mt-3 text-body-sm text-muted-foreground max-w-sm">
              Forms so simple, people actually finish them. Build, ship,
              analyze — all from one place.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <a
                href="#"
                aria-label="GitHub"
                className="size-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <IconBrandGithub className="size-4" />
              </a>
              <a
                href="#"
                aria-label="X"
                className="size-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <IconBrandX className="size-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="size-9 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <IconBrandLinkedin className="size-4" />
              </a>
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-caps uppercase text-foreground font-semibold text-xs tracking-wider">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-body-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-body-sm text-muted-foreground">
            © {year} Simple Form. All rights reserved.
          </p>
          <span className="inline-flex items-center gap-2 text-body-sm text-muted-foreground">
            <span className="size-1.5 rounded-full bg-success" />
            All systems normal
          </span>
        </div>
      </div>
    </footer>
  );
}
