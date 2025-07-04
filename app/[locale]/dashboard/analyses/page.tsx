import { CachedAnalysesPage } from "@/components/dashboard/cached-analyses-page";

export default function AnalysesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CachedAnalysesPage />
        </div>
      </main>
    </div>
  );
}
