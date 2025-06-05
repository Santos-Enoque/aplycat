"use client";

import { useEffect } from "react";
import { usePrefetchDashboardData } from "@/hooks/use-dashboard-data";
import { useUser } from "@clerk/nextjs";

interface DataPrefetcherProps {
  children: React.ReactNode;
}

export function DataPrefetcher({ children }: DataPrefetcherProps) {
  const { isSignedIn, isLoaded } = useUser();
  const { prefetchAll } = usePrefetchDashboardData();

  useEffect(() => {
    // Only prefetch when user is loaded and signed in
    if (isLoaded && isSignedIn) {
      // Small delay to not block initial render
      const prefetchTimer = setTimeout(() => {
        console.log("[DATA_PREFETCHER] Starting background data prefetch...");
        prefetchAll();
      }, 100);

      return () => clearTimeout(prefetchTimer);
    }
  }, [isLoaded, isSignedIn, prefetchAll]);

  // Also prefetch on route focus (when user comes back to tab)
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;

    const handleFocus = () => {
      console.log("[DATA_PREFETCHER] Tab focused, refreshing data...");
      prefetchAll();
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && isSignedIn) {
        console.log("[DATA_PREFETCHER] Tab became visible, refreshing data...");
        prefetchAll();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isLoaded, isSignedIn, prefetchAll]);

  return <>{children}</>;
}
