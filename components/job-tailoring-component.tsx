"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Target,
  Link,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Edit3,
  Globe,
} from "lucide-react";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useCreditsModal } from "@/hooks/use-credits-modal";
// import * as Sentry from "@sentry/nextjs";

interface JobTailoringComponentProps {
  currentResume: any;
  onTailoringComplete: (result: any) => void;
  onTailoringStart?: () => void;
  isLoading?: boolean;
}

export function JobTailoringComponent({
  currentResume,
  onTailoringComplete,
  onTailoringStart,
  isLoading: externalLoading,
}: JobTailoringComponentProps) {
  const t = useTranslations("jobTailoring");
  const [jobUrl, setJobUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("tailoringJobUrl") || "";
  });
  const [jobDescription, setJobDescription] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("tailoringJobDescription") || "";
  });
  const [jobTitle, setJobTitle] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("tailoringJobTitle") || "";
  });
  const [companyName, setCompanyName] = useState(() => {
    if (typeof window === "undefined") return "";
    return sessionStorage.getItem("tailoringCompanyName") || "";
  });
  const [includeCoverLetter, setIncludeCoverLetter] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem("tailoringIncludeCoverLetter") === "true";
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingJob, setIsExtractingJob] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [extractionAttempted, setExtractionAttempted] = useState(false);
  const [extractionSuccessful, setExtractionSuccessful] = useState(false);
  const { openModal } = useCreditsModal();
  const { credits, isLoading: isLoadingCredits } = useUserCredits();

  const TAILORING_COST = 4; // This service costs 4 credits

  // AbortController ref for request cleanup
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    sessionStorage.setItem("tailoringJobUrl", jobUrl);
    sessionStorage.setItem("tailoringJobDescription", jobDescription);
    sessionStorage.setItem("tailoringJobTitle", jobTitle);
    sessionStorage.setItem("tailoringCompanyName", companyName);
    sessionStorage.setItem(
      "tailoringIncludeCoverLetter",
      String(includeCoverLetter)
    );
  }, [jobUrl, jobDescription, jobTitle, companyName, includeCoverLetter]);

  // Cleanup function to abort ongoing requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Simulate progress for better UX
  React.useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 15;
        });
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const extractJobInfo = async () => {
    if (!jobUrl.trim()) return;
    if (isLoadingCredits || credits === null || credits === undefined) {
      return;
    }
    if (credits < 1) {
      openModal(1);
      return;
    }

    setIsExtractingJob(true);
    setError(null);
    setExtractionAttempted(true);

    const extractAbortController = new AbortController();

    try {
      const response = await fetch("/api/extract-job-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl: jobUrl.trim() }),
        signal: extractAbortController.signal,
      });

      if (!response.ok) {
        throw new Error("Failed to extract job information");
      }

      const result = await response.json();

      if (result.job_title || result.company_name || result.job_description) {
        setExtractionSuccessful(true);
        if (result.job_title) setJobTitle(result.job_title);
        if (result.company_name) setCompanyName(result.company_name);
        if (result.job_description) setJobDescription(result.job_description);
        setShowManualEntry(true); // Show extracted details
        toast.success("Job information extracted successfully!");
      } else {
        throw new Error("No job information found");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[JobExtraction] Request was aborted");
        return;
      }

      setExtractionSuccessful(false);
      setShowManualEntry(true); // Show manual entry on failure
      // Sentry.captureException(err, {
      //   extra: {
      //     jobUrl,
      //     context: "JobTailoringComponent extractJobInfo catch block",
      //   },
      // });
      setError(
        "Failed to extract job info from URL. Please fill details manually."
      );
      toast.error("Couldn't extract job information", {
        description: "Please enter the details manually below.",
      });
      console.error("Job extraction error:", err);
    } finally {
      setIsExtractingJob(false);
    }
  };

  const handleTailoring = async () => {
    if (!jobDescription.trim()) {
      setError(t("provideJobDescription"));
      return;
    }
    if (isLoadingCredits || credits === null || credits === undefined) {
      return;
    }

    if (credits < TAILORING_COST) {
      openModal(TAILORING_COST);
      return;
    }

    setIsLoading(true);
    setError(null);
    setProgress(0);
    onTailoringStart?.();

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentResume,
          jobDescription: jobDescription.trim(),
          jobTitle: jobTitle.trim() || "Target Position",
          companyName: companyName.trim(),
          includeCoverLetter,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume");
      }

      const result = await response.json();
      setProgress(100);

      setTimeout(() => {
        onTailoringComplete(result);
      }, 500);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("[JobTailoring] Request was aborted");
        setError(null);
        return;
      }

      // Sentry.captureException(err, {
      //   extra: {
      //     jobTitle,
      //     companyName,
      //     context: "JobTailoringComponent handleTailoring catch block",
      //   },
      // });
      setError(err.message || "An error occurred while tailoring your resume");
    } finally {
      setIsLoading(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  };

  const resetForm = () => {
    setJobUrl("");
    setJobDescription("");
    setJobTitle("");
    setCompanyName("");
    setError(null);
    setShowManualEntry(false);
    setExtractionAttempted(false);
    setExtractionSuccessful(false);
  };

  const toggleManualEntry = () => {
    setShowManualEntry(!showManualEntry);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-50">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Target className="h-5 w-5 text-purple-600" />
          {t("title")}
          <Badge
            variant="secondary"
            className="ml-2 bg-purple-100 text-purple-700"
          >
            4 Credits
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">{t("description")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* URL Input Section - Always Shown First */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-600" />
              {t("jobUrl")}
            </Label>
            {!showManualEntry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleManualEntry}
                className="text-xs text-purple-600 hover:text-purple-700 h-auto p-1"
              >
                <Edit3 className="h-3 w-3 mr-1" />
                {t("enterManually")}
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder={t("extractPlaceholder")}
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="flex-1 text-sm"
              disabled={isLoading}
            />
            <Button
              onClick={extractJobInfo}
              disabled={!jobUrl.trim() || isExtractingJob || isLoading}
              variant="outline"
              size="sm"
              className="px-4"
            >
              {isExtractingJob ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Link className="h-4 w-4 mr-1" />
                  {t("extract")}
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">{t("extractDescription")}</p>
        </div>

        {/* Manual Entry Toggle */}
        {!showManualEntry && extractionAttempted && (
          <div className="text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleManualEntry}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {extractionSuccessful ? t("viewEdit") : t("enterDetailsManually")}
            </Button>
          </div>
        )}

        {/* Manual Job Info - Shown when toggled or after extraction */}
        {showManualEntry && (
          <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">
                {extractionSuccessful ? t("extractedDetails") : t("jobDetails")}
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleManualEntry}
                className="text-xs text-gray-500 hover:text-gray-700 h-auto p-1"
              >
                {t("hideDetails")}
              </Button>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("jobDescription")}{" "}
                <span className="text-red-500">{t("required")}</span>
              </Label>
              <Textarea
                placeholder={t("jobDescriptionPlaceholder")}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                rows={4}
                className="resize-none text-sm leading-relaxed break-words"
                disabled={isLoading}
                style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
              />
              <p className="text-xs text-gray-500 break-words">
                {t("jobDescriptionHelp")}
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("jobTitle")}{" "}
                <span className="text-gray-500">{t("optional")}</span>
              </Label>
              <Input
                placeholder={t("jobTitlePlaceholder")}
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="text-sm break-words"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {t("companyName")}{" "}
                <span className="text-gray-500">{t("optional")}</span>
              </Label>
              <Input
                placeholder={t("companyPlaceholder")}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="text-sm break-words"
                disabled={isLoading}
              />
            </div>
          </div>
        )}

        {/* Cover Letter Toggle */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <div>
              <Label className="text-sm font-medium text-gray-700">
                {t("includeCoverLetter")}
              </Label>
              <p className="text-xs text-gray-500">
                {t("coverLetterDescription")}
              </p>
            </div>
          </div>
          <Button
            variant={includeCoverLetter ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeCoverLetter(!includeCoverLetter)}
            className="h-8 px-3"
            disabled={isLoading}
          >
            {includeCoverLetter ? (
              <>
                <CheckCircle className="h-3 w-3 mr-1" />
                {t("coverLetterToggleYes")}
              </>
            ) : (
              t("coverLetterToggleNo")
            )}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Progress Bar */}
        {isLoading && (
          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tailoring your resume...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleTailoring}
            disabled={!jobDescription.trim() || isLoading || isLoadingCredits}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                {t("tailoring")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                {includeCoverLetter
                  ? t("tailorResumeAndCover")
                  : t("tailorResume")}
              </>
            )}
          </Button>
          <Button
            onClick={resetForm}
            variant="outline"
            disabled={isLoading}
            className="w-full"
          >
            {t("reset")}
          </Button>
        </div>

        {/* Processing Steps */}
        {isLoading && (
          <div className="space-y-2 text-left">
            <div
              className={`flex items-center gap-2 p-2 rounded transition-all ${
                progress > 20
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {progress > 20 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full animate-pulse"></div>
              )}
              <span className="text-sm">Analyzing job requirements</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded transition-all ${
                progress > 50
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {progress > 50 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full animate-pulse"></div>
              )}
              <span className="text-sm">Matching keywords and skills</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded transition-all ${
                progress > 80
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {progress > 80 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full animate-pulse"></div>
              )}
              <span className="text-sm">Optimizing content for relevance</span>
            </div>

            {includeCoverLetter && (
              <div
                className={`flex items-center gap-2 p-2 rounded transition-all ${
                  progress >= 100
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {progress >= 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full animate-pulse"></div>
                )}
                <span className="text-sm">
                  Generating personalized cover letter
                </span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
