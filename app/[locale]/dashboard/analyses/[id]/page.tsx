import { CachedAnalysisViewPage } from "@/components/dashboard/cached-analysis-view-page";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function AnalysisViewPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  return (
    <div className="min-h-screen bg-gray-50">
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CachedAnalysisViewPage analysisId={resolvedParams.id} />
        </div>
      </main>
    </div>
  );
}