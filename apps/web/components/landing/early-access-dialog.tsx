"use client";

import * as React from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Skeleton } from "~/components/ui/skeleton";
import { FEEDBACK_FORM_URL } from "~/lib/feedback-form-url";

/**
 * Dialog wrapping an iframe of the early-access feedback form (hosted on
 * the same product). Used by Pro and Business CTAs on the pricing card —
 * we collect demand signal instead of fake-billing for paid plans.
 */
export function EarlyAccessDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const [iframeLoaded, setIframeLoaded] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border">
          <DialogTitle>Pro &amp; Business are coming</DialogTitle>
          <DialogDescription>
            We&apos;re still validating pricing. Tell us what you need and we&apos;ll
            reach out the moment paid plans launch.
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          {!iframeLoaded ? (
            <div className="absolute inset-0 p-6 space-y-4 bg-background">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : null}
          {open ? (
            <iframe
              src={FEEDBACK_FORM_URL}
              loading="lazy"
              onLoad={() => setIframeLoaded(true)}
              className="w-full h-[600px] border-0"
              title="Simple Form early-access feedback"
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
