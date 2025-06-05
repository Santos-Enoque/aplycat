"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnalysisCards } from "@/components/analysis-cards";
import { EnhancedLoading } from "@/components/enhanced-loading";
import { Button } from "@/components/ui/button";
import type { AnalysisResponse } from "@/types/analysis";

export default function AnalyzePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  useEffect(() => {
    // Check for saved analysis ID first
    const analysisId = searchParams.get("analysisId");
    if (analysisId) {
      handleLoadSavedAnalysis(analysisId);
      return;
    }

    // Check for new resume ID approach
    const resumeId = searchParams.get("resumeId");
    const fileName = searchParams.get("fileName");

    if (resumeId && fileName) {
      handleAnalysisWithResumeId(resumeId, fileName);
      return;
    }

    // Fallback to legacy file data approach for backward compatibility
    const fileData = searchParams.get("fileData");
    if (fileData && fileName) {
      handleAnalysisWithFileData(fileData, fileName);
      return;
    }

    // No valid parameters found
    router.push("/");
  }, [searchParams, router]);

  const handleLoadSavedAnalysis = async (analysisId: string) => {
    setIsLoadingSaved(true);
    setError(null);

    try {
      const response = await fetch(`/api/saved-analyses/${analysisId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to load saved analysis");
      }

      // Transform the saved analysis to match the expected format
      const transformedResult: AnalysisResponse = {
        success: true,
        analysis: result.analysis.analysisData,
        fileName: result.analysis.fileName,
        resumeId: result.analysis.resumeId,
        analysisId: result.analysis.id,
        processingTimeMs: result.analysis.processingTimeMs,
        timestamp: result.analysis.createdAt,
        cached: true,
        message: "Retrieved saved analysis",
      };

      setAnalysisResult(transformedResult);
    } catch (err: any) {
      setError(
        err.message || "An error occurred while loading the saved analysis"
      );
    } finally {
      setIsLoadingSaved(false);
    }
  };

  const handleAnalysisWithResumeId = async (
    resumeId: string,
    fileName: string
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeId: resumeId,
          fileName: decodeURIComponent(fileName),
        }),
      });

      const result: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze resume");
      }

      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || "An error occurred while analyzing your resume");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalysisWithFileData = async (
    fileData: string,
    fileName: string
  ) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: decodeURIComponent(fileData),
          fileName: decodeURIComponent(fileName),
        }),
      });

      const result: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze resume");
      }

      setAnalysisResult(result);
    } catch (err: any) {
      setError(err.message || "An error occurred while analyzing your resume");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRetry = () => {
    const analysisId = searchParams.get("analysisId");
    if (analysisId) {
      handleLoadSavedAnalysis(analysisId);
      return;
    }

    const resumeId = searchParams.get("resumeId");
    const fileName = searchParams.get("fileName");

    if (resumeId && fileName) {
      handleAnalysisWithResumeId(resumeId, fileName);
      return;
    }

    // Fallback to legacy approach
    const fileData = searchParams.get("fileData");
    if (fileData && fileName) {
      handleAnalysisWithFileData(fileData, fileName);
    }
  };

  const handleForceReanalysis = () => {
    const resumeId = searchParams.get("resumeId");
    const fileName = searchParams.get("fileName");

    if (resumeId && fileName) {
      // Force a new analysis by adding forceReanalysis parameter
      const newParams = new URLSearchParams({
        resumeId,
        fileName,
        forceReanalysis: "true",
      });

      router.push(`/analyze?${newParams.toString()}`);
    }
  };

  // Show loading state
  if (isAnalyzing || isLoadingSaved) {
    const fileName = searchParams.get("fileName") || "";
    const analysisId = searchParams.get("analysisId");

    if (isLoadingSaved && analysisId) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Loading Saved Analysis
              </h3>
              <p className="text-gray-600">
                Retrieving your previously analyzed resume...
              </p>
            </div>
          </div>
        </div>
      );
    }

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
              Oops! Something went wrong
            </h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => router.push("/")} variant="outline">
                ← Back to Landing
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
    const isSavedAnalysis = searchParams.get("analysisId");
    const canForceReanalysis =
      searchParams.get("resumeId") && searchParams.get("fileName");

    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto py-12 px-4">
          <div className="flex justify-between items-center mb-6">
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              ← Back to Dashboard
            </Button>

            <div className="flex gap-3">
              {isSavedAnalysis && (
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm">
                  <span>📄</span>
                  <span>Saved Analysis</span>
                  <span className="text-xs text-blue-600">
                    {new Date(analysisResult.timestamp).toLocaleDateString()}
                  </span>
                </div>
              )}

              {analysisResult.cached && !isSavedAnalysis && (
                <div className="flex items-center gap-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
                  <span>⚡</span>
                  <span>Cached Result</span>
                </div>
              )}

              {canForceReanalysis && (
                <Button
                  onClick={handleForceReanalysis}
                  variant="outline"
                  className="text-sm"
                >
                  🔄 Re-analyze
                </Button>
              )}
            </div>
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

  // Fallback - shouldn't happen with proper navigation
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl mb-4">🤔</div>
        <h3 className="text-xl font-semibold mb-2">No analysis data found</h3>
        <Button onClick={() => router.push("/")}>← Back to Dashboard</Button>
      </div>
    </div>
  );
}
