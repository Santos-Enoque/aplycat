// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { LandingPage } from "@/components/landing-page";
import { AnalysisCards } from "@/components/analysis-cards";
import { ImprovementModal } from "@/components/improvement-modal";
import { ResumePreview } from "@/components/resume-preview";
import { EnhancedLoading } from "@/components/enhanced-loading";
import { Button } from "@/components/ui/button";
import { ClientOnly } from "@/components/client-only";
import type { AnalysisResponse } from "@/types/analysis";
import type { ImprovementResponse } from "@/types/improved-resume";

type AppState =
  | "landing"
  | "analyzing"
  | "analysis"
  | "improvement"
  | "preview";

export default function Home() {
  const [appState, setAppState] = useState<AppState>("landing");
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
    setAppState("analyzing");
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
      setAppState("landing");
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

  const resetToLanding = () => {
    setAppState("landing");
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

  // Show landing page
  if (appState === "landing") {
    return (
      <ClientOnly
        fallback={
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="animate-pulse text-center">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-64 mx-auto"></div>
            </div>
          </div>
        }
      >
        <LandingPage onStartAnalysis={handleFileSelect} />
      </ClientOnly>
    );
  }

  // Show enhanced loading for analysis
  if (appState === "analyzing") {
    return (
      <EnhancedLoading
        title="Aplycat is Analyzing Your Resume"
        type="analysis"
        fileName={currentFileName}
      />
    );
  }

  // Show analysis flow
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4">
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
          {/* Error State */}
          {error && (
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-6xl mb-4">😿</div>
                <h3 className="text-xl font-semibold text-red-600 mb-2">
                  Oops! Something went wrong
                </h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={resetToLanding} variant="outline">
                    ← Back to Landing
                  </Button>
                  <Button onClick={() => setError(null)}>Try Again</Button>
                </div>
              </div>
            </div>
          )}

          {/* Analysis Results */}
          {appState === "analysis" &&
            analysisResult &&
            analysisResult.success && (
              <div>
                <div className="flex justify-center mb-6">
                  <Button onClick={resetToLanding} variant="outline">
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

          {/* Improvement Modal with Enhanced Loading */}
          <ImprovementModal
            isOpen={showImprovementModal}
            onClose={() => setShowImprovementModal(false)}
            onSubmit={handleImproveResume}
            isLoading={isImproving}
            fileName={currentFileName}
          />
        </ClientOnly>
      </div>
    </div>
  );
}
