"use client";

import { useEffect } from "react";
import { ThemeProvider } from "next-themes";
import { useAppStore } from "@/lib/store/app-store";

function StoreHydrator() {
  useEffect(() => {
    let cancelled = false;
    void useAppStore.persist.rehydrate()?.then(() => {
      if (cancelled) return;
      useAppStore.getState().seedIfEmpty();
      useAppStore.getState().setHasHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <StoreHydrator />
      {children}
    </ThemeProvider>
  );
}
