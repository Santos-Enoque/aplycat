// app/dashboard/page.tsx
import { Suspense } from "react";
import { getCurrentUserFromDB } from "@/lib/auth/user-sync";
import { redirect } from "next/navigation";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { DashboardRecentActivity } from "@/components/dashboard/dashboard-recent-activity";
import { db } from "@/lib/db";
import { getCachedData, cacheKeys } from "@/lib/cache";

// Super fast user essentials - loads immediately with caching
async function getUserEssentials(userId: string) {
  return getCachedData(
    cacheKeys.userEssentials(userId),
    () =>
      db.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          credits: true,
          isPremium: true,
          totalCreditsUsed: true,
        },
      }),
    60 // Cache for 1 minute (short TTL for critical data)
  );
}

// Stats data - loads quickly in parallel with caching
async function getDashboardStats(userId: string) {
  return getCachedData(
    cacheKeys.dashboardStats(userId),
    async () => {
      const [analysesCount, improvementsCount, resumesCount] =
        await Promise.all([
          db.analysis.count({ where: { userId, isCompleted: true } }),
          db.improvedResume.count({ where: { userId, isCompleted: true } }),
          db.resume.count({ where: { userId, isActive: true } }),
        ]);

      return {
        totalAnalyses: analysesCount,
        totalImprovements: improvementsCount,
        totalResumes: resumesCount,
      };
    },
    300 // Cache for 5 minutes
  );
}

// Recent activity - loads separately to not block main content with caching
async function getRecentActivity(userId: string) {
  return getCachedData(
    cacheKeys.recentActivity(userId),
    async () => {
      const [recentAnalyses, recentImprovements] = await Promise.all([
        db.analysis.findMany({
          where: { userId, isCompleted: true },
          include: {
            resume: {
              select: { fileName: true, id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3, // Just show recent 3
        }),
        db.improvedResume.findMany({
          where: { userId, isCompleted: true },
          select: {
            id: true,
            versionName: true,
            targetRole: true,
            createdAt: true,
            improvedScore: true,
            originalScore: true,
            resume: {
              select: { fileName: true, id: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 3, // Just show recent 3
        }),
      ]);

      return { recentAnalyses, recentImprovements };
    },
    180 // Cache for 3 minutes (recent activity changes more frequently)
  );
}

export default async function DashboardPage() {
  const user = await getCurrentUserFromDB();

  if (!user) {
    redirect("/sign-in");
  }

  // Load user essentials immediately (this is super fast)
  const userEssentials = await getUserEssentials(user.id);

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
          <DashboardStatsLoader
            userId={user.id}
            userCredits={userEssentials.credits}
          />
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
          <DashboardRecentActivityLoader userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

// Separate component for stats loading
async function DashboardStatsLoader({
  userId,
  userCredits,
}: {
  userId: string;
  userCredits: number;
}) {
  const stats = await getDashboardStats(userId);
  return <DashboardStats stats={{ ...stats, currentCredits: userCredits }} />;
}

// Separate component for recent activity loading
async function DashboardRecentActivityLoader({ userId }: { userId: string }) {
  const activity = await getRecentActivity(userId);
  return <DashboardRecentActivity activity={activity} />;
}
