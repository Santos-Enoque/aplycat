"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
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

function AnalyzePageContent() {
  const router = useRouter();
  const t = useTranslations("analyze");
  const { analysis, status, error, startAnalysis, resetAnalysis } =
    useStreamingAnalysis();
  const { refetch: refetchCredits } = useUserCredits();
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const originalFileRef = useRef<ModelFileInput | null>(null);
  const isDesktop = useMediaQuery("(min-width: 768px)");

  useEffect(() => {
    if (status === "completed") {
      refetchCredits();
    }
  }, [status, refetchCredits]);

  useEffect(() => {
    if (hasInitiated) return;

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
    setHasInitiated(true);
  }, [startAnalysis, hasInitiated, resetAnalysis]);

  const handleStartImprovement = (
    targetRole: string,
    targetIndustry: string
  ) => {
    if (!analysis || !originalFileRef.current) {
      toast.error(t("toast.missingData"));
      setIsImproveModalOpen(false);
      return;
    }

    sessionStorage.setItem(
      "improvementJobDetails",
      JSON.stringify({
        targetRole,
        targetIndustry,
        analysis, // Pass the full analysis
        originalFile: originalFileRef.current,
      })
    );

    router.push("/improve");
  };

  const handleImprovementInitiation = () => {
    if (isDesktop) {
      setIsImproveModalOpen(true);
    } else {
      if (!analysis || !originalFileRef.current) return;
      sessionStorage.setItem(
        "improvementJobDetails",
        JSON.stringify({
          analysis,
          originalFile: originalFileRef.current,
        })
      );
      router.push("/improve-v2");
    }
  };

  const renderContent = () => {
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
              (status === "streaming" ||
                status === "completed" ||
                status === "error") && (
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
