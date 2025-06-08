"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserCredits } from "@/lib/actions/dashboard-actions";

export function useUserCredits() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["userCredits"],
    queryFn: async () => {
      try {
        const credits = await getUserCredits();
        return credits;
      } catch (err) {
        // Return a specific value or throw to let the query handle the error state
        return null;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });

  return {
    credits: data,
    isLoading,
    error,
    refetch,
  };
} 