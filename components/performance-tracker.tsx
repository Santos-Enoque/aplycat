"use client";

import { useEffect } from "react";
import { trackWebVitals } from "@/lib/performance";

export function PerformanceTracker() {
  useEffect(() => {
    // Track web vitals on mount
    trackWebVitals();
  }, []);

  return null; // This component doesn't render anything
}
