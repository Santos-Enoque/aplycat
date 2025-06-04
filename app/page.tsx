// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { FileUpload } from "@/components/file-upload";
import { AnalysisCards } from "@/components/analysis-cards";
import { ImprovementModal } from "@/components/improvement-modal";
import { ResumePreview } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/client-only";
import type { AnalysisResponse } from "@/types/analysis";
import type { ImprovementResponse } from "@/types/improved-resume";

type AppState = "upload" | "analysis" | "improvement" | "preview";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(
    null
  );
  const [improvementResult, setImprovementResult] =
    useState<ImprovementResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showImprovementModal, setShowImprovementModal] = useState(false);
  const [currentFileData, setCurrentFileData] = useState<string>("");
  const [currentFileName, setCurrentFileName] = useState<string>("");

  // Wrap event listener setup in ClientOnly to prevent hydration issues
  useEffect(() => {
    const handleOpenModal = () => setShowImprovementModal(true);

    // Only add event listener if we're on the client
    if (typeof window !== "undefined") {
      window.addEventListener("openImprovementModal", handleOpenModal);
      return () =>
        window.removeEventListener("openImprovementModal", handleOpenModal);
    }
  }, []);

  const handleFileSelect = async (fileData: string, fileName: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResult(null);
    setCurrentFileData(fileData);
    setCurrentFileName(fileName);

    try {
      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData,
          fileName,
        }),
      });

      const result: AnalysisResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to analyze resume");
      }

      setAnalysisResult(result);
      setAppState("analysis");
    } catch (err: any) {
      setError(err.message || "An error occurred while analyzing your resume");
      setAppState("upload");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleImproveResume = async (
    targetRole: string,
    targetIndustry: string
  ) => {
    setIsImproving(true);
    setError(null);

    try {
      const response = await fetch("/api/improve-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: currentFileData,
          fileName: currentFileName,
          targetRole,
          targetIndustry,
        }),
      });

      const result: ImprovementResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to improve resume");
      }

      setImprovementResult(result);
      setShowImprovementModal(false);
      setAppState("preview");
    } catch (err: any) {
      setError(err.message || "An error occurred while improving your resume");
    } finally {
      setIsImproving(false);
    }
  };

  const resetToUpload = () => {
    setAppState("upload");
    setAnalysisResult(null);
    setImprovementResult(null);
    setError(null);
    setCurrentFileData("");
    setCurrentFileName("");
  };

  const backToAnalysis = () => {
    setAppState("analysis");
    setImprovementResult(null);
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
            Get brutally honest, Gordon Ramsay-style feedback on your resume. No
            sugar-coating, just the truth you need to hear with
            section-by-section analysis.
          </p>
          <div className="mt-4 text-sm text-gray-500">
            ✨ Now with enhanced section analysis, keyword optimization, and
            AI-powered improvements
          </div>
        </div>

        <ClientOnly
          fallback={
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <div className="animate-pulse">
                <div className="h-40 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          }
        >
          {/* Upload State */}
          {appState === "upload" && (
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
                      Aplycat is sharpening her claws and analyzing every
                      section of your resume...
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
          {error && appState === "upload" && (
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-6xl mb-4">😿</div>
                <h3 className="text-xl font-semibold text-red-600 mb-2">
                  Oops! Something went wrong
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <Button onClick={() => setError(null)} variant="outline">
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {appState === "analysis" &&
            analysisResult &&
            analysisResult.success && (
              <div>
                <div className="flex justify-center mb-6">
                  <Button onClick={resetToUpload} variant="outline">
                    ← Analyze Another Resume
                  </Button>
                </div>
                <AnalysisCards
                  analysis={analysisResult.analysis}
                  fileName={analysisResult.fileName}
                />
              </div>
            )}

          {/* Resume Preview */}
          {appState === "preview" &&
            improvementResult &&
            improvementResult.success && (
              <ResumePreview
                improvedResume={improvementResult.improvedResume}
                targetRole={improvementResult.targetRole}
                targetIndustry={improvementResult.targetIndustry}
                fileName={improvementResult.fileName}
                onBack={backToAnalysis}
              />
            )}

          {/* Improvement Modal */}
          <ImprovementModal
            isOpen={showImprovementModal}
            onClose={() => setShowImprovementModal(false)}
            onSubmit={handleImproveResume}
            isLoading={isImproving}
            fileName={currentFileName}
          />
        </ClientOnly>

        {/* Footer - Static content, no hydration issues */}
        <div className="text-center mt-16 text-gray-500">
          <p className="text-sm">
            Made with 🔥 and a lot of brutal honesty. Your resume data is
            processed securely and not stored.
          </p>
          <div className="mt-2 text-xs">
            Enhanced with section-by-section analysis, keyword optimization, and
            industry insights
          </div>
        </div>
      </div>
    </div>
  );
}
