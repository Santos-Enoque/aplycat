// app/dashboard/page.tsx
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCompleteDashboardData } from "@/lib/actions/dashboard-actions";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

// Dashboard Data Loader Component
async function DashboardDataLoader() {
  const userData = await getCompleteDashboardData();

  if (!userData) {
    redirect("/sign-in");
  }

  return <DashboardContent user={userData} />;
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNav />
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardDataLoader />
      </Suspense>
    </div>
  );
}
