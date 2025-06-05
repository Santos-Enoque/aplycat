// app/dashboard/page.tsx
import { CachedDashboardContent } from "@/components/dashboard/cached-dashboard-content";
import { DataPrefetcher } from "@/components/dashboard/data-prefetcher";

export default function DashboardPage() {
  return (
    <DataPrefetcher>
      <CachedDashboardContent />
    </DataPrefetcher>
  );
}
