import Link from "next/link";
import { IconInnerShadowTop } from "@tabler/icons-react";

import { SignupForm } from "~/components/signup-form";
import { ThemeToggle } from "~/components/theme-toggle";

export default function SignUp() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="relative flex flex-col gap-4 p-6 md:p-10">
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>
        <div className="flex justify-center gap-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <IconInnerShadowTop className="size-4" />
            </div>
            Simple Form
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <SignupForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-linear-to-br from-primary/15 via-primary/5 to-background lg:block">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <h2 className="text-display-md text-foreground max-w-md leading-tight tracking-tight">
            Forms so simple, people actually{" "}
            <span className="text-primary">finish</span> them.
          </h2>
          <p className="mt-6 text-body text-muted-foreground max-w-sm">
            Free forever for indie projects. Add your team when you&apos;re ready.
          </p>
        </div>
      </div>
    </div>
  );
}
