"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useStreamingAnalysis } from "@/hooks/use-streaming-analysis";
import { StreamingAnalysisDisplay } from "@/components/streaming-analysis-display";
import { ImproveResumeModal } from "@/components/improve-resume-modal";
import { useUserCredits } from "@/hooks/use-user-credits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, XCircle, Zap, AlertCircle } from "lucide-react";
import type { ModelFileInput } from "@/lib/models-consolidated";
import { useMediaQuery } from "@/hooks/use-media-query";
import { toast } from "sonner";
import type { ResumeAnalysis } from "@/types/analysis";

function AnalyzePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("analyze");
  const { analysis, status, error, startAnalysis, resetAnalysis } =
    useStreamingAnalysis();
  const { refetch: refetchCredits } = useUserCredits();
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(false);
  const [cachedAnalysis, setCachedAnalysis] = useState<ResumeAnalysis | null>(null);
  const [cachedStatus, setCachedStatus] = useState<'idle' | 'loading' | 'completed' | 'error'>('idle');
  const originalFileRef = useRef<ModelFileInput | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Get analysisId or resumeId from URL if present
  const analysisId = searchParams.get('analysisId');
  const resumeId = searchParams.get('resumeId');

  useEffect(() => {
    if (status === "completed") {
      refetchCredits();
    }
  }, [status, refetchCredits]);

  useEffect(() => {
    if (hasInitiated) return;

    // If we have an analysisId, load from database
    if (analysisId) {
      setIsLoadingFromDb(true);
      setCachedStatus('loading');
      
      fetch(`/api/analyses/${analysisId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.analysis) {
            setCachedAnalysis(data.analysis.analysisData as ResumeAnalysis);
            setFileName(data.analysis.fileName);
            setCachedStatus('completed');
            
            // Set originalFileRef for improvement functionality
            if (data.analysis.resume?.fileUrl) {
              originalFileRef.current = {
                filename: data.analysis.fileName,
                fileData: data.analysis.resume.fileUrl
              };
            }
          } else {
            setCachedStatus('error');
            console.error('Failed to load analysis:', data.error);
          }
        })
        .catch(err => {
          setCachedStatus('error');
          console.error('Error loading analysis:', err);
        })
        .finally(() => {
          setIsLoadingFromDb(false);
        });
    } else if (resumeId) {
      // If we have a resumeId, load resume from database and start analysis
      setIsLoadingFromDb(true);
      
      fetch(`/api/resumes/${resumeId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.resume) {
            const resume = data.resume;
            setFileName(resume.fileName);
            
            // Store resume data for analysis
            const fileData = resume.fileUrl;
            originalFileRef.current = { filename: resume.fileName, fileData: fileData };
            
            // Store in session storage for compatibility
            sessionStorage.setItem('streamingAnalysisFile', JSON.stringify({
              fileName: resume.fileName,
              fileData: fileData
            }));
            
            // Store resume ID for analysis save
            sessionStorage.setItem('aplycat_uploadthing_resume_id', resume.id);
            
            // Convert to blob and start analysis
            if (fileData.startsWith('data:')) {
              // Handle base64 data URL
              fetch(fileData)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], resume.fileName, { type: blob.type });
                  resetAnalysis();
                  startAnalysis(file);
                })
                .catch(err => {
                  console.error("Error converting base64 to file:", err);
                  setCachedStatus('error');
                });
            } else {
              // Handle regular URL (UploadThing)
              fetch(fileData)
                .then(res => res.blob())
                .then(blob => {
                  const file = new File([blob], resume.fileName, { type: resume.mimeType || 'application/pdf' });
                  resetAnalysis();
                  startAnalysis(file);
                })
                .catch(err => {
                  console.error("Error fetching file:", err);
                  setCachedStatus('error');
                });
            }
          } else {
            setCachedStatus('error');
            console.error('Failed to load resume:', data.error);
          }
        })
        .catch(err => {
          setCachedStatus('error');
          console.error('Error loading resume:', err);
        })
        .finally(() => {
          setIsLoadingFromDb(false);
        });
    } else {
      // Original flow: load from session storage for new analysis
      const storedFile = sessionStorage.getItem("streamingAnalysisFile");
      if (storedFile) {
        // We have a file, so reset any previous analysis state before we begin.
        resetAnalysis();

        const { fileName, fileData } = JSON.parse(storedFile);
        setFileName(fileName);
        originalFileRef.current = { filename: fileName, fileData: fileData };

        const fetchRes = fetch(fileData);
        fetchRes
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], fileName, { type: blob.type });
            startAnalysis(file);
          })
          .catch((err) => {
            console.error("Error converting base64 to file:", err);
            // Handle error state in UI
          });
      }
    }
    setHasInitiated(true);
  }, [startAnalysis, hasInitiated, resetAnalysis, analysisId, resumeId]);

  const handleStartImprovement = (
    targetRole: string,
    targetIndustry: string
  ) => {
    // Use cached analysis if available, otherwise use streaming analysis
    const currentAnalysis = cachedAnalysis || analysis;
    
    if (!currentAnalysis || !originalFileRef.current) {
      toast.error(t("toast.missingData"));
      setIsImproveModalOpen(false);
      return;
    }

    sessionStorage.setItem(
      "improvementJobDetails",
      JSON.stringify({
        targetRole,
        targetIndustry,
        analysis: currentAnalysis, // Pass the full analysis
        originalFile: originalFileRef.current,
      })
    );

    router.push("/improve");
  };

  const handleImprovementInitiation = () => {
    if (isDesktop) {
      setIsImproveModalOpen(true);
    } else {
      const currentAnalysis = cachedAnalysis || analysis;
      if (!currentAnalysis || !originalFileRef.current) return;
      sessionStorage.setItem(
        "improvementJobDetails",
        JSON.stringify({
          analysis: currentAnalysis,
          originalFile: originalFileRef.current,
        })
      );
      router.push("/improve-v2");
    }
  };

  const renderContent = () => {
    // Loading state for database fetch
    if ((analysisId && cachedStatus === "loading") || (resumeId && isLoadingFromDb)) {
      return (
        <div className="text-center p-8">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">
            {analysisId 
              ? t("loading.loadingAnalysis", { defaultValue: "Loading analysis..." })
              : t("loading.loadingResume", { defaultValue: "Loading resume..." })}
          </h3>
          <p className="text-gray-600 mt-2">{t("loading.waitMessage")}</p>
        </div>
      );
    }

    // Show cached analysis from database
    if (analysisId && cachedStatus === "completed" && cachedAnalysis) {
      return (
        <StreamingAnalysisDisplay
          analysis={cachedAnalysis}
          status="completed"
          onStartImprovement={handleImprovementInitiation}
        />
      );
    }

    // Error loading from database
    if (analysisId && cachedStatus === "error") {
      return (
        <Card className="bg-red-50 border-red-200 text-center p-8">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-800">
            {t("error.title")}
          </h3>
          <p className="text-red-700 mt-2">{t("error.loadingAnalysis", { defaultValue: "Failed to load analysis" })}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            {t("error.returnToDashboard")}
          </Button>
        </Card>
      );
    }

    // Original streaming flow
    if (!hasInitiated || status === "connecting") {
      return (
        <div className="text-center p-8">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">
            {status === "connecting"
              ? t("loading.connecting")
              : t("loading.initializing")}
          </h3>
          <p className="text-gray-600 mt-2">{t("loading.waitMessage")}</p>
        </div>
      );
    }

    if (status === "streaming" || status === "completed") {
      return (
        <StreamingAnalysisDisplay
          analysis={analysis}
          status={status}
          onStartImprovement={handleImprovementInitiation}
        />
      );
    }

    if (status === "error") {
      return (
        <Card className="bg-red-50 border-red-200 text-center p-8">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-800">
            {t("error.title")}
          </h3>
          <p className="text-red-700 mt-2">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            {t("error.returnToDashboard")}
          </Button>
        </Card>
      );
    }

    // Default case: No file was found in session storage
    return (
      <Card>
        <CardContent className="text-center p-8">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">
            {t("noResume.title")}
          </h3>
          <p className="text-gray-600 mt-2">{t("noResume.message")}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-6">
            {t("noResume.goToDashboard")}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
      <div className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-8 md:mb-12">
            <div className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full p-3 mb-4 shadow-lg">
              <Zap className="w-6 h-6 md:w-8 md:h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-gray-900">
              {t("title")}
            </h1>
            <p className="mt-3 md:mt-4 text-base md:text-lg text-gray-600 max-w-2xl mx-auto px-4">
              {t("subtitle")}
            </p>
          </header>

          <main>
            {fileName &&
              ((status === "streaming" ||
                status === "completed" ||
                status === "error") || 
                (analysisId && cachedStatus === "completed")) && (
                <p className="text-center text-muted-foreground mb-6">
                  {t("analysisFor", { fileName })}
                </p>
              )}
            {renderContent()}
          </main>
        </div>
      </div>
      <ImproveResumeModal
        isOpen={isImproveModalOpen}
        onClose={() => setIsImproveModalOpen(false)}
        onStartImprovement={handleStartImprovement}
      />
    </div>
  );
}

export default function AnalyzePage() {
  const tLayout = useTranslations("analyzeLayout");

  return (
    <Suspense fallback={<div>{tLayout("loading")}</div>}>
      <AnalyzePageContent />
    </Suspense>
  );
}
