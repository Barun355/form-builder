"use client";

import * as React from "react";
import { m } from "framer-motion";

/**
 * Single fade-up primitive used everywhere on the landing page.
 *
 * - `viewport={{ once: true }}` — replay-on-rescroll is universally
 *   amateur (Linear/Vercel/Stripe never replay).
 * - `blur` adds the Vercel-signature blur-in (8px → 0px), used on the
 *   hero product visual and the closing CTA headline.
 * - Reduced-motion is handled centrally by <MotionConfig reducedMotion="user">
 *   in providers/global.tsx — no per-component guard needed.
 */
const EASE = [0.22, 1, 0.36, 1] as const;

export function FadeIn({
  children,
  delay = 0,
  y = 16,
  blur = false,
  duration,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  blur?: boolean;
  duration?: number;
  className?: string;
}) {
  return (
    <m.div
      initial={{
        opacity: 0,
        y,
        ...(blur && { filter: "blur(8px)" }),
      }}
      whileInView={{
        opacity: 1,
        y: 0,
        ...(blur && { filter: "blur(0px)" }),
      }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: duration ?? (blur ? 0.7 : 0.5),
        ease: EASE,
        delay,
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}
