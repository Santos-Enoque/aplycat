import { InstantResumeAnalyzer } from '@/components/instant-resume-analyzer';

export default function InstantAnalyzerPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Instant Resume Analyzer
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your resume and get immediate AI analysis results. 
            No waiting, no complex flows - just instant JSON data.
          </p>
        </div>
        
        <InstantResumeAnalyzer />
      </div>
    </div>
  );
}