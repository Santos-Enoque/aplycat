'use client';

import React, { useState } from 'react';
import { StreamingAnalysisCards } from '@/components/streaming-analysis-cards';
import { OptimizedFileUpload } from '@/components/optimized-file-upload';
import { ResumeAnalysis } from '@/types/analysis';

interface AnalysisData {
  fileData: string;
  fileName: string;
}

export default function InstantAnalysisPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [completedAnalysis, setCompletedAnalysis] = useState<ResumeAnalysis | null>(null);

  const handleFileSelect = async (fileData: string, fileName: string) => {
    console.log('[INSTANT_PAGE] File selected:', fileName);
    setIsUploading(true);
    
    // Small delay to show upload feedback, then immediately start analysis
    setTimeout(() => {
      setAnalysisData({ fileData, fileName });
      setIsUploading(false);
    }, 500);
  };

  const handleAnalysisComplete = (analysis: ResumeAnalysis) => {
    console.log('[INSTANT_PAGE] Analysis completed');
    setCompletedAnalysis(analysis);
  };

  const handleAnalysisError = (error: string) => {
    console.error('[INSTANT_PAGE] Analysis error:', error);
    // Error is handled by the StreamingAnalysisCards component
  };

  const handleNewAnalysis = () => {
    setAnalysisData(null);
    setCompletedAnalysis(null);
    setIsUploading(false);
  };

  if (isUploading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <LoadingState fileName={analysisData?.fileName || ''} />
        </div>
      </div>
    );
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                🚀 Instant Resume Analysis
              </h1>
              <p className="text-xl text-gray-600 mb-2">
                Get real-time feedback as our AI analyzes your resume
              </p>
              <p className="text-gray-500">
                See results appear instantly as they're generated
              </p>
            </div>

            {/* Upload Section */}
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
                  Upload Your Resume
                </h2>
                <OptimizedFileUpload
                  onFileSelect={handleFileSelect}
                  isLoading={isUploading}
                  accept=".pdf"
                  maxSize={10 * 1024 * 1024} // 10MB
                />
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon="⚡"
                title="Real-time Analysis"
                description="See your resume analysis appear as it's being generated"
              />
              <FeatureCard
                icon="🎯"
                title="ATS Optimization"
                description="Get specific feedback on how to pass applicant tracking systems"
              />
              <FeatureCard
                icon="🔥"
                title="Brutal Honesty"
                description="No sugar-coating. Get the honest feedback you need to improve"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">
                📋 Resume Analysis
              </h1>
              <div className="text-sm text-gray-600">
                {analysisData.fileName}
              </div>
            </div>
            <button
              onClick={handleNewAnalysis}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Analyze New Resume
            </button>
          </div>
        </div>
      </div>

      {/* Analysis Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <StreamingAnalysisCards
            fileData={analysisData.fileData}
            fileName={analysisData.fileName}
            onComplete={handleAnalysisComplete}
            onError={handleAnalysisError}
          />

          {/* Additional Actions */}
          {completedAnalysis && (
            <div className="mt-12 bg-white p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                What's Next?
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                <ActionButton
                  icon="✏️"
                  title="Improve Resume"
                  description="Get AI-powered improvements"
                  href="/improve"
                  primary
                />
                <ActionButton
                  icon="🎯"
                  title="Tailor to Job"
                  description="Customize for specific roles"
                  href="/tailor"
                />
                <ActionButton
                  icon="💾"
                  title="Save Analysis"
                  description="Keep this analysis for later"
                  onClick={() => {
                    // TODO: Implement save functionality
                    console.log('Save analysis');
                  }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Supporting Components
function LoadingState({ fileName }: { fileName: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <div className="bg-white rounded-2xl shadow-xl p-12">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-6"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Processing Your Resume
        </h2>
        <p className="text-gray-600 mb-4">
          {fileName ? `Analyzing ${fileName}...` : 'Preparing analysis...'}
        </p>
        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            🚀 Our AI is reading your resume and preparing personalized feedback
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}

function ActionButton({
  icon,
  title,
  description,
  href,
  onClick,
  primary = false,
}: {
  icon: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  primary?: boolean;
}) {
  const className = `p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
    primary 
      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700' 
      : 'bg-white text-gray-900 border-gray-200 hover:border-blue-300'
  }`;

  const content = (
    <>
      <div className="text-2xl mb-2">{icon}</div>
      <h4 className={`font-semibold mb-1 ${primary ? 'text-white' : 'text-gray-900'}`}>
        {title}
      </h4>
      <p className={`text-sm ${primary ? 'text-blue-100' : 'text-gray-600'}`}>
        {description}
      </p>
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button onClick={onClick} className={className}>
      {content}
    </button>
  );
}