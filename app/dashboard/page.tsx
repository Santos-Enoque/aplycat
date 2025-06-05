// app/dashboard/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { DashboardRecentActivity } from "@/components/dashboard/dashboard-recent-activity";
import {
  getUserEssentials,
  getDashboardStats,
  getRecentActivity,
  type UserEssentials,
  type DashboardStats as DashboardStatsType,
} from "@/lib/actions/dashboard-actions";

export default async function DashboardPage() {
  // Load user essentials immediately (this is super fast)
  const userEssentials = await getUserEssentials();

  if (!userEssentials) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header loads immediately with user data */}
      <DashboardHeader user={userEssentials} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats load fast in parallel */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                </div>
              ))}
            </div>
          }
        >
          <DashboardStatsLoader />
        </Suspense>

        {/* Recent activity loads last */}
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {[...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg shadow p-6 animate-pulse"
                >
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="space-y-3">
                    {[...Array(3)].map((_, j) => (
                      <div key={j} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <DashboardRecentActivityLoader />
        </Suspense>
      </div>
    </div>
  );
}

// Separate component for stats loading using server action
async function DashboardStatsLoader() {
  const stats = await getDashboardStats();

  if (!stats) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Unable to load statistics</p>
      </div>
    );
  }

  return <DashboardStats stats={stats} />;
}

// Separate component for recent activity loading using server action
async function DashboardRecentActivityLoader() {
  const activity = await getRecentActivity();

  if (!activity) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Unable to load recent activity</p>
      </div>
    );
  }

  return <DashboardRecentActivity activity={activity} />;
}
