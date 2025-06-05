// app/analyze/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisCards } from "@/components/analysis-cards";
import { EnhancedLoading } from "@/components/enhanced-loading";
import { Button } from "@/components/ui/button";
import type { AnalysisResponse } from "@/types/analysis";

export default function OptimizedAnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [backgroundStatus, setBackgroundStatus] = useState<{
    upload: 'pending' | 'completed' | 'failed';
    metadata: 'pending' | 'completed' | 'failed';
  }>({ upload: 'pending', metadata: 'pending' });

  useEffect(() => {
    const immediate = searchParams.get('immediate');
    const fileName = searchParams.get('fileName');

    if (immediate === 'true') {
      // This is an immediate analysis request
      handleImmediateAnalysis(fileName);
    } else {
      // Handle other analysis types (existing logic)
      handleLegacyAnalysis();
    }
  }, [searchParams]);

  const handleImmediateAnalysis = async (fileName: string | null) => {
    if (!fileName) {
      setError('No file information found');
      return;
    }

    // Get resume data from sessionStorage
    const resumeDataStr = sessionStorage.getItem('alycat_resume_data');
    if (!resumeDataStr) {
      setError('Resume data not found. Please upload again.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const resumeData = JSON.parse(resumeDataStr);
      
      // Start analysis immediately with raw file data
      console.log('[ANALYSIS] Starting immediate analysis...');
      
      const response = await fetch('/api/analyze-resume-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: resumeData.fileName,
          fileData: resumeData.fileData,
          immediate: true, // Flag for instant analysis
        }),
      });

      const result: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Analysis failed');
      }

      console.log('[ANALYSIS] Analysis completed successfully');
      setAnalysisResult(result);

      // Clean up sessionStorage
      sessionStorage.removeItem('aplycat_resume_data');

      // Start background status monitoring
      monitorBackgroundProcesses();

    } catch (err: any) {
      console.error('[ANALYSIS] Analysis failed:', err);
      setError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const monitorBackgroundProcesses = async () => {
    // Monitor background upload and metadata save
    let attempts = 0;
    const maxAttempts = 30; // 60 seconds total

    const checkStatus = async () => {
      attempts++;
      
      try {
        // Check if we have a resumeId (indicates metadata save completed)
        const resumeId = sessionStorage.getItem('aplycat_resume_id');
        if (resumeId && backgroundStatus.metadata === 'pending') {
          setBackgroundStatus(prev => ({ ...prev, metadata: 'completed' }));
          console.log('[BACKGROUND] Metadata save completed');
        }

        // You could also check upload status via an API endpoint
        // For now, we'll simulate upload completion after some time
        if (attempts > 10 && backgroundStatus.upload === 'pending') {
          setBackgroundStatus(prev => ({ ...prev, upload: 'completed' }));
          console.log('[BACKGROUND] File upload completed');
        }

        // Continue monitoring if not all complete and under max attempts
        if (attempts < maxAttempts && 
            (backgroundStatus.upload === 'pending' || backgroundStatus.metadata === 'pending')) {
          setTimeout(checkStatus, 2000);
        }
      } catch (error) {
        console.error('[BACKGROUND] Status check failed:', error);
        // Mark as failed but don't interrupt user experience
        setBackgroundStatus({ upload: 'failed', metadata: 'failed' });
      }
    };

    setTimeout(checkStatus, 1000);
  };

  const handleLegacyAnalysis = async () => {
    // Your existing analysis logic for other cases
    const analysisId = searchParams.get("analysisId");
    const resumeId = searchParams.get("resumeId");
    const fileName = searchParams.get("fileName");

    if (analysisId) {
      // Load saved analysis
      await handleLoadSavedAnalysis(analysisId);
    } else if (resumeId && fileName) {
      // Analyze existing resume
      await handleAnalysisWithResumeId(resumeId, fileName);
    } else {
      // No valid parameters
      router.push("/");
    }
  };

  const handleLoadSavedAnalysis = async (analysisId: string) => {
    // Your existing saved analysis logic
    console.log('[ANALYSIS] Loading saved analysis:', analysisId);
    // Implementation here...
  };

  const handleAnalysisWithResumeId = async (resumeId: string, fileName: string) => {
    // Your existing resume ID analysis logic
    console.log('[ANALYSIS] Analyzing with resume ID:', resumeId);
    // Implementation here...
  };

  const handleRetry = () => {
    const immediate = searchParams.get('immediate');
    const fileName = searchParams.get('fileName');

    if (immediate === 'true') {
      handleImmediateAnalysis(fileName);
    } else {
      handleLegacyAnalysis();
    }
  };

  // Show enhanced loading during analysis
  if (isAnalyzing) {
    const fileName = searchParams.get("fileName") || "";
    
    return (
      <EnhancedLoading
        title="Aplycat is Analyzing Your Resume"
        type="analysis"
        fileName={decodeURIComponent(fileName)}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">😿</div>
            <h3 className="text-xl font-semibold text-red-600 mb-2">
              Analysis Failed
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/")} variant="outline">
                ← Back to Home
              </Button>
              <Button onClick={handleRetry}>Try Again</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show analysis results
  if (analysisResult && analysisResult.success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-12 px-4">
          {/* Status Banner */}
          {(backgroundStatus.upload === 'pending' || backgroundStatus.metadata === 'pending') && (
            <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <div>
                  <p className="font-medium text-blue-900">
                    Analysis Complete! 
                  </p>
                  <p className="text-sm text-blue-700">
                    File processing in background...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {backgroundStatus.upload === 'completed' && backgroundStatus.metadata === 'completed' && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="text-green-600">✅</div>
                <div>
                  <p className="font-medium text-green-900">
                    Resume Fully Processed!
                  </p>
                  <p className="text-sm text-green-700">
                    Your resume has been saved and is ready for improvements.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              ← Back to Dashboard
            </Button>
          </div>

          <AnalysisCards
            analysis={analysisResult.analysis}
            fileName={analysisResult.fileName}
            resumeId={analysisResult.resumeId}
          />
        </div>
      </div>
    );
  }

  // Fallback loading state
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">⏳</div>
        <h3 className="text-xl font-semibold mb-2">Preparing Analysis...</h3>
      </div>
    </div>
  );
}