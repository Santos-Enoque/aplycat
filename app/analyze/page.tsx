"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { useStreamingAnalysis } from "@/hooks/use-streaming-analysis";
import { StreamingAnalysisDisplay } from "@/components/streaming-analysis-display";
import { ImproveResumeModal } from "@/components/improve-resume-modal";
import { useUserCredits } from "@/hooks/use-user-credits";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, XCircle, Zap, FileText, AlertCircle } from "lucide-react";
import type { ModelFileInput } from "@/lib/models";

function AnalyzePageContent() {
  const router = useRouter();
  const { analysis, status, error, startAnalysis } = useStreamingAnalysis();
  const { refetch: refetchCredits } = useUserCredits();
  const [fileName, setFileName] = useState<string | null>(null);
  const [hasInitiated, setHasInitiated] = useState(false);
  const [isImproveModalOpen, setIsImproveModalOpen] = useState(false);
  const originalFileRef = useRef<ModelFileInput | null>(null);

  useEffect(() => {
    if (status === "completed") {
      refetchCredits();
    }
  }, [status, refetchCredits]);

  useEffect(() => {
    if (hasInitiated) return;

    const storedFile = sessionStorage.getItem("streamingAnalysisFile");
    if (storedFile) {
      setHasInitiated(true);
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

      // Clean up sessionStorage after use
      sessionStorage.removeItem("streamingAnalysisFile");
    } else {
      setHasInitiated(true);
    }
  }, [startAnalysis, hasInitiated]);

  const handleStartImprovement = (
    targetRole: string,
    targetIndustry: string
  ) => {
    if (!analysis || !originalFileRef.current) return;

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

  const renderContent = () => {
    if (!hasInitiated || status === "connecting") {
      return (
        <div className="text-center p-8">
          <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-800">
            {status === "connecting" ? "Connecting..." : "Initializing..."}
          </h3>
          <p className="text-gray-600 mt-2">
            Please wait while we prepare the analysis engine.
          </p>
        </div>
      );
    }

    if (status === "streaming" || status === "completed") {
      return (
        <StreamingAnalysisDisplay
          analysis={analysis}
          status={status}
          onStartImprovement={() => setIsImproveModalOpen(true)}
        />
      );
    }

    if (status === "error") {
      return (
        <Card className="bg-red-50 border-red-200 text-center p-8">
          <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-red-800">
            Analysis Failed
          </h3>
          <p className="text-red-700 mt-2">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-4">
            Return to Dashboard
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
            No Resume Found for Analysis
          </h3>
          <p className="text-gray-600 mt-2">
            Please upload a resume from your dashboard to begin.
          </p>
          <Button onClick={() => router.push("/dashboard")} className="mt-6">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white rounded-full p-3 mb-4 shadow-lg">
              <Zap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Real-Time Resume Analysis
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Our AI is analyzing your resume. Watch the results appear live
              below.
            </p>
          </header>

          <main>
            {fileName &&
              (status === "streaming" ||
                status === "completed" ||
                status === "error") && (
                <p className="text-center text-muted-foreground mb-6">
                  Analysis for: <strong>{fileName}</strong>
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
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AnalyzePageContent />
    </Suspense>
  );
}
