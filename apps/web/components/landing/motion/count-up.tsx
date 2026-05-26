"use client";

import * as React from "react";
import { animate, useInView, useMotionValue } from "framer-motion";

/**
 * Number that counts from 0 → `to` when scrolled into view (once).
 * Used for KPI values and stat cards. Per research, count-up has fallen
 * out of favor as a hero stat treatment, but it works well INSIDE product
 * visuals where it suggests live data populating.
 */
export function CountUp({
  to,
  duration = 1.2,
  format = (n) => Math.round(n).toLocaleString(),
  className,
  suffix,
}: {
  to: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
  suffix?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const value = useMotionValue(0);
  const [display, setDisplay] = React.useState(format(0));

  React.useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => setDisplay(format(latest)),
    });
    return () => controls.stop();
  }, [inView, to, duration, value, format]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}
