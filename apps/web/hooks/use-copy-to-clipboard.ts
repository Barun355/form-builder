"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Tracks which keyed value was most recently copied so multiple "Copy"
 * buttons in the same surface can independently show a "Copied!" affordance.
 * Uses a single timer keyed by `copiedKey` — copying a new key resets the
 * timer rather than fanning out parallel timeouts.
 */
export function useCopyToClipboard(resetDelay = 2000) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const copy = useCallback(
    async (text: string, key: string) => {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return false;
      }
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setCopiedKey(key);
      timeoutRef.current = setTimeout(() => setCopiedKey(null), resetDelay);
      return true;
    },
    [resetDelay],
  );

  const isCopied = useCallback(
    (key: string) => copiedKey === key,
    [copiedKey],
  );

  return { copy, isCopied };
}
