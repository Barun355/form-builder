"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import React, { useState } from "react";
import { Toaster } from "~/components/ui/sonner";

import { trpc } from "~/trpc/client";
import { createTRPCHttpBatchClientClient } from "~/trpc/create-client";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnMount: true,
      staleTime: Infinity,
    },
  },
});

export const GlobalProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [createTRPCHttpBatchClientClient()],
    }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey="simpleform-theme"
      >
        <trpc.Provider queryClient={queryClient} client={trpcClient}>
          {/* MotionConfig respects OS "reduce motion" preference for every
              framer-motion animation. LazyMotion + domAnimation ships the
              ~15kb subset (no drag/layout/3d). `strict` forces `m.div`
              instead of `motion.div`, enforcing the lazy bundle. */}
          <MotionConfig reducedMotion="user">
            <LazyMotion features={domAnimation} strict>
              {children}
            </LazyMotion>
          </MotionConfig>
          <Toaster />
        </trpc.Provider>
      </NextThemesProvider>
    </QueryClientProvider>
  );
};
