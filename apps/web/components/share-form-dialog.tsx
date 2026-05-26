"use client";

import * as React from "react";
import {
  IconAtOff,
  IconBrandLinkedin,
  IconBrandWhatsapp,
  IconBrandX,
  IconCheck,
  IconCopy,
  IconLink,
  IconLock,
  IconMail,
} from "@tabler/icons-react";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Separator } from "~/components/ui/separator";
import { useCopyToClipboard } from "~/hooks/use-copy-to-clipboard";
import {
  SHARE_PLATFORMS,
  buildShareUrl,
  type SharePlatform,
  type SharePlatformKey,
} from "~/lib/share-urls";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  publicUrl: string;
  visibility: "PUBLIC" | "UNLISTED";
};

const PLATFORM_ICON: Record<SharePlatformKey, React.ComponentType<{ className?: string }>> = {
  twitter: IconBrandX,
  linkedin: IconBrandLinkedin,
  whatsapp: IconBrandWhatsapp,
  email: IconMail,
};

export function ShareFormDialog({
  open,
  onOpenChange,
  title,
  publicUrl,
  visibility,
}: Props) {
  const { copy, isCopied } = useCopyToClipboard();

  const truncatedUrl =
    publicUrl.length > 38 ? `${publicUrl.slice(0, 38)}…` : publicUrl;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share form</DialogTitle>
          <DialogDescription>
            Anyone with the link can view and submit &ldquo;{title}&rdquo;.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Public link */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-body-sm font-medium text-foreground">
              <IconLink className="size-4 text-muted-foreground" />
              Form link
            </div>
            <div className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2">
              <span className="flex-1 truncate text-body-sm text-muted-foreground">
                {truncatedUrl}
              </span>
              <CopyButton
                onClick={() => copy(publicUrl, "base")}
                copied={isCopied("base")}
              />
            </div>
          </div>

          <Separator />

          {/* UTM-tagged platform links */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-body-sm font-medium text-foreground">
                UTM-tagged links
              </div>
              {visibility === "UNLISTED" ? (
                <div className="flex items-center gap-1 text-caption text-muted-foreground">
                  <IconLock className="size-3" />
                  Unlisted
                </div>
              ) : null}
            </div>
            <ul className="space-y-2">
              {SHARE_PLATFORMS.map((p) => {
                const Icon = PLATFORM_ICON[p.key] ?? IconAtOff;
                const utmUrl = buildShareUrl(publicUrl, p);
                return (
                  <li
                    key={p.key}
                    className="flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-2"
                  >
                    <Icon className="size-4 text-muted-foreground" />
                    <span className="flex-1 text-body-sm text-foreground">
                      {p.name}
                    </span>
                    <CopyButton
                      onClick={() => copy(utmUrl, p.key)}
                      copied={isCopied(p.key)}
                    />
                  </li>
                );
              })}
            </ul>
            <p className="text-caption text-muted-foreground">
              Each variant tags traffic with{" "}
              <code className="font-mono">utm_source</code> and{" "}
              <code className="font-mono">utm_medium</code> so you can attribute
              submissions back to where you shared the link.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({
  onClick,
  copied,
}: {
  onClick: () => void;
  copied: boolean;
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      className="h-7 px-2 gap-1"
      onClick={onClick}
    >
      {copied ? (
        <>
          <IconCheck className="size-3.5" />
          Copied
        </>
      ) : (
        <>
          <IconCopy className="size-3.5" />
          Copy
        </>
      )}
    </Button>
  );
}
