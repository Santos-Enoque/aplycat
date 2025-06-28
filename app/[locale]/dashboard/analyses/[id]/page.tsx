import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function AnalysisViewPage({ params }: PageProps) {
  const resolvedParams = await params;
  
  // Redirect to the analyze page with the analysisId parameter
  redirect(`/${resolvedParams.locale}/analyze?analysisId=${resolvedParams.id}`);
}