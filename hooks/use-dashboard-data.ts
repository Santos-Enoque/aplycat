"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/nextjs";

// Query keys for consistent caching
export const queryKeys = {
  dashboard: ["dashboard"] as const,
  resumes: ["resumes"] as const,
  analyses: ["analyses"] as const,
  improvements: ["improvements"] as const,
};

// Fetch functions
async function fetchDashboardData() {
  const response = await fetch("/api/dashboard");
  if (!response.ok) {
    throw new Error("Failed to fetch dashboard data");
  }
  return response.json();
}

async function fetchResumes() {
  const response = await fetch("/api/resumes");
  if (!response.ok) {
    throw new Error("Failed to fetch resumes");
  }
  return response.json();
}

async function fetchAnalyses() {
  const response = await fetch("/api/analyses");
  if (!response.ok) {
    throw new Error("Failed to fetch analyses");
  }
  return response.json();
}

async function fetchImprovements() {
  const response = await fetch("/api/improvements");
  if (!response.ok) {
    throw new Error("Failed to fetch improvements");
  }
  return response.json();
}

// Custom hooks
export function useDashboardData() {
  const { isSignedIn } = useUser();
  
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: fetchDashboardData,
    enabled: isSignedIn,
    staleTime: 3 * 60 * 1000, // 3 minutes for main dashboard
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useResumes() {
  const { isSignedIn } = useUser();
  
  return useQuery({
    queryKey: queryKeys.resumes,
    queryFn: fetchResumes,
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useAnalyses() {
  const { isSignedIn } = useUser();
  
  return useQuery({
    queryKey: queryKeys.analyses,
    queryFn: fetchAnalyses,
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

export function useImprovements() {
  const { isSignedIn } = useUser();
  
  return useQuery({
    queryKey: queryKeys.improvements,
    queryFn: fetchImprovements,
    enabled: isSignedIn,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// Prefetch hooks for background loading
export function usePrefetchDashboardData() {
  const queryClient = useQueryClient();
  const { isSignedIn } = useUser();

  const prefetchAll = () => {
    if (!isSignedIn) return;

    // Prefetch all dashboard-related data
    queryClient.prefetchQuery({
      queryKey: queryKeys.dashboard,
      queryFn: fetchDashboardData,
      staleTime: 3 * 60 * 1000,
    });
  };

  return { prefetchAll };
}

// Invalidation helper for when data changes
export function useInvalidateData() {
  const queryClient = useQueryClient();

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
    queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
    queryClient.invalidateQueries({ queryKey: queryKeys.analyses });
    queryClient.invalidateQueries({ queryKey: queryKeys.improvements });
  };

  const invalidateDashboard = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard });
  };

  const invalidateResumes = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.resumes });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); // Dashboard shows resume data too
  };

  const invalidateAnalyses = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.analyses });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); // Dashboard shows analysis data too
  };

  const invalidateImprovements = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.improvements });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }); // Dashboard shows improvement data too
  };

  return {
    invalidateAll,
    invalidateDashboard,
    invalidateResumes,
    invalidateAnalyses,
    invalidateImprovements,
  };
} 