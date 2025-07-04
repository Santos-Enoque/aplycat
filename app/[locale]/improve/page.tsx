"use client";

import React, { useState, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader, AlertCircle, Zap, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";

function ImprovePageContent() {
  const router = useRouter();
  const t = useTranslations("improve");
  const [improvement, setImprovement] = useState(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "completed" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const hasInitiated = useRef(false);

  // Simulate progress for better UX
  useEffect(() => {
    if (status === "loading") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Stop at 90% until completion
          return prev + Math.random() * 15;
        });
      }, 500);

      return () => clearInterval(interval);
    }
  }, [status]);

  useEffect(() => {
    if (hasInitiated.current) return;
    hasInitiated.current = true;

    const storedData = sessionStorage.getItem("improvementJobDetails");
    if (storedData) {
      const { targetRole, targetIndustry, originalFile } =
        JSON.parse(storedData);
      improveResume(originalFile, targetRole, targetIndustry);
    }
  }, []);

  const improveResume = async (
    originalFile: any,
    targetRole: string,
    targetIndustry: string
  ) => {
    setStatus("loading");
    setError(null);
    setProgress(0);

    try {
      const response = await fetch("/api/improve-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalFile,
          targetRole,
          targetIndustry,
        }),
      });

      if (!response.ok) {
        const result = await response.json().catch(() => null);
        const errorMessage =
          result?.error || "Unable to improve resume. Please try again.";
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(
          result.error || "Unable to improve resume. Please try again."
        );
      }

      if (result.improvedResume) {
        setProgress(100);
        setImprovement(result.improvedResume);
        setStatus("completed");

        // Store the improvement data for the improved resume page
        sessionStorage.setItem(
          "streamingImprovementContext",
          JSON.stringify({
            improvement: result.improvedResume,
            targetRole,
            targetIndustry,
            timestamp: Date.now(),
          })
        );

        // Small delay to show completion, then redirect
        setTimeout(() => {
          router.push("/improved-resume/stream");
        }, 1500);
      } else {
        throw new Error(
          "Unable to process your resume improvement. Please try again."
        );
      }
    } catch (err: any) {
      // Show user-friendly error messages
      let userMessage = t("error.messages.general");

      if (err.message) {
        // If the error message is already user-friendly (from our API), use it
        if (
          err.message.includes("credits") ||
          err.message.includes("try again") ||
          err.message.includes("technical difficulties") ||
          err.message.includes("temporarily unavailable")
        ) {
          userMessage = err.message;
        } else if (err.message.includes("Failed to improve resume")) {
          userMessage = t("error.messages.credits");
        } else if (err.message.includes("Unable to process")) {
          userMessage = t("error.messages.processing");
        }
      }

      setError(userMessage);
      setStatus("error");
      setProgress(0);
    }
  };

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200 text-center p-8">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-red-800">
          {t("error.title")}
        </h3>
        <p className="text-red-700 mt-2">{error}</p>
        <Button onClick={() => router.push("/dashboard")} className="mt-4">
          {t("error.button")}
        </Button>
      </Card>
    );
  }

  if (status === "completed") {
    return (
      <Card className="bg-green-50 border-green-200 text-center p-8">
        <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-green-800">
          {t("success.title")}
        </h3>
        <p className="text-green-700 mt-2">{t("success.subtitle")}</p>
        <div className="w-full bg-green-200 rounded-full h-2 mt-4">
          <div className="bg-green-600 h-2 rounded-full transition-all duration-300 w-full"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="text-center p-8">
      <Loader className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-gray-800">
        {t("loading.title")}
      </h3>
      <p className="text-gray-600 mt-2">{t("loading.subtitle")}</p>

      {/* Progress bar */}
      <div className="w-full max-w-md mx-auto mt-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>{t("loading.processing")}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-purple-600 h-2 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      {/* Processing steps */}
      <div className="mt-8 space-y-3 text-left max-w-md mx-auto">
        <div
          className={`flex items-center gap-3 p-3 rounded-lg ${
            progress > 10
              ? "bg-green-50 text-green-700"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          {progress > 10 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          )}
          <span className="text-sm font-medium">
            {t("loading.steps.analyzing")}
          </span>
        </div>

        <div
          className={`flex items-center gap-3 p-3 rounded-lg ${
            progress > 40
              ? "bg-green-50 text-green-700"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          {progress > 40 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          )}
          <span className="text-sm font-medium">
            {t("loading.steps.optimizing")}
          </span>
        </div>

        <div
          className={`flex items-center gap-3 p-3 rounded-lg ${
            progress > 70
              ? "bg-green-50 text-green-700"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          {progress > 70 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          )}
          <span className="text-sm font-medium">
            {t("loading.steps.enhancing")}
          </span>
        </div>

        <div
          className={`flex items-center gap-3 p-3 rounded-lg ${
            progress >= 100
              ? "bg-green-50 text-green-700"
              : "bg-gray-50 text-gray-500"
          }`}
        >
          {progress >= 100 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
          )}
          <span className="text-sm font-medium">
            {t("loading.steps.finalizing")}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ImprovePage() {
  const t = useTranslations("improve");

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white rounded-full p-3 mb-4 shadow-lg">
              <Zap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              {t("title")}
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              {t("subtitle")}
            </p>
          </header>
          <main>
            <Suspense fallback={<div>Loading...</div>}>
              <ImprovePageContent />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
