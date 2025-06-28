import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/nextjs";
import type { ResumeLibraryView, ResumeWithRelations, LibraryStatistics } from "@/types/resume-library";

interface UseResumeLibraryResult {
  resumes: ResumeWithRelations[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  statistics?: LibraryStatistics;
}

export function useResumeLibrary(view: ResumeLibraryView): UseResumeLibraryResult {
  const { userId } = useAuth();

  const queryKey = ["resume-library", userId, view];

  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) throw new Error("Not authenticated");

      const params = new URLSearchParams({
        viewMode: view.viewMode,
        sortBy: view.sortBy,
        sortOrder: view.sortOrder,
        searchQuery: view.searchQuery,
      });

      // Add filter parameters
      if (view.filters.status.length > 0) {
        params.append("status", view.filters.status.join(","));
      }
      if (view.filters.dateRange) {
        params.append("dateFrom", view.filters.dateRange[0].toISOString());
        params.append("dateTo", view.filters.dateRange[1].toISOString());
      }
      if (view.filters.hasAnalysis !== null) {
        params.append("hasAnalysis", String(view.filters.hasAnalysis));
      }
      if (view.filters.hasImprovements !== null) {
        params.append("hasImprovements", String(view.filters.hasImprovements));
      }
      if (view.filters.tags.length > 0) {
        params.append("tags", view.filters.tags.join(","));
      }
      if (view.filters.scoreRange) {
        params.append("scoreMin", String(view.filters.scoreRange[0]));
        params.append("scoreMax", String(view.filters.scoreRange[1]));
      }

      const response = await fetch(`/api/dashboard/resume-library?${params}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch resumes");
      }

      return response.json();
    },
    enabled: !!userId,
    staleTime: 30000, // Consider data stale after 30 seconds
    cacheTime: 300000, // Keep in cache for 5 minutes
  });

  return {
    resumes: data?.resumes || [],
    statistics: data?.statistics,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}