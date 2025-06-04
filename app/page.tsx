// app/page.tsx
'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/file-upload';
import { AnalysisCards } from '@/components/analysis-cards';
import { Button } from '@/components/ui/button';
import type { AnalysisResponse } from '@/types/analysis';

export default function Home() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (fileData: string, fileName: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);

    try {
      const response = await fetch('/api/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileData,
          fileName,
        }),
      });

      const result: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to analyze resume');
      }

      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing your resume');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            🐱 Aplycat Resume Analyzer
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Get brutally honest, Gordon Ramsay-style feedback on your resume. 
            No sugar-coating, just the truth you need to hear with section-by-section analysis.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            ✨ Now with enhanced section analysis, keyword optimization, and industry-specific advice
          </div>
        </div>

        {/* Main Content */}
        {!analysisResult && !error && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <FileUpload 
              onFileSelect={handleFileSelect} 
              isLoading={isAnalyzing}
            />
            
            {isAnalyzing && (
              <div className="mt-8 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-blue-700 font-medium">
                    Aplycat is sharpening her claws and analyzing every section of your resume...
                  </span>
                </div>
                <div className="mt-4 text-xs text-gray-500">
                  This may take 10-30 seconds for comprehensive analysis
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-6xl mb-4">😿</div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <Button onClick={resetAnalysis} variant="outline">
                Try Again
              </Button>
            </div>
          </div>
        )}

        {/* Results */}
        {analysisResult && analysisResult.success && (
          <div>
            <div className="flex justify-center mb-6">
              <Button onClick={resetAnalysis} variant="outline">
                ← Analyze Another Resume
              </Button>
            </div>
            <AnalysisCards 
              analysis={analysisResult.analysis}
              fileName={analysisResult.fileName}
            />
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            Made with 🔥 and a lot of brutal honesty. 
            Your resume data is processed securely and not stored.
          </p>
          <div className="mt-2 text-xs">
            Enhanced with section-by-section analysis, keyword optimization, and industry insights
          </div>
        </div>
      </div>
    </div>
  );
}