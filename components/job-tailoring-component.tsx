"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Target,
  Link,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useCreditsModal } from "@/hooks/use-credits-modal";
import * as Sentry from "@sentry/nextjs";

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
  const { openModal } = useCreditsModal();
  const { credits, isLoading: isLoadingCredits } = useUserCredits();

  const TAILORING_COST = 4; // This service costs 4 credits

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
      // Still loading credits or credits not available, do nothing
      return;
    }
    if (credits < 1) {
      // 1 credit for extraction
      openModal(1);
      return;
    }

    setIsExtractingJob(true);
    setError(null);

    try {
      const response = await fetch("/api/extract-job-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobUrl: jobUrl.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to extract job information");
      }

      const result = await response.json();

      if (result.job_title) setJobTitle(result.job_title);
      if (result.company_name) setCompanyName(result.company_name);
      if (result.job_description) setJobDescription(result.job_description);
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          jobUrl,
          context: "JobTailoringComponent extractJobInfo catch block",
        },
      });
      setError("Failed to extract job info. Please fill manually.");
      toast.error("Failed to extract job information from the URL.", {
        description:
          "Please check the URL or paste the job description manually.",
      });
      console.error("Job extraction error:", err);
    } finally {
      setIsExtractingJob(false);
    }
  };

  const handleTailoring = async () => {
    if (!jobDescription.trim()) {
      setError("Please provide a job description");
      return;
    }
    if (isLoadingCredits || credits === null || credits === undefined) {
      // Still loading credits or credits not available, do nothing
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to tailor resume");
      }

      const result = await response.json();
      setProgress(100);

      // Small delay to show completion
      setTimeout(() => {
        onTailoringComplete(result);
      }, 500);
    } catch (err: any) {
      Sentry.captureException(err, {
        extra: {
          jobTitle,
          companyName,
          context: "JobTailoringComponent handleTailoring catch block",
        },
      });
      setError(err.message || "An error occurred while tailoring your resume");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  const resetForm = () => {
    setJobUrl("");
    setJobDescription("");
    setJobTitle("");
    setCompanyName("");
    setError(null);
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Tailor for Specific Job
          <Badge variant="secondary" className="ml-2">
            Fast Mode
          </Badge>
        </CardTitle>
        <p className="text-sm text-gray-600">
          Optimize your resume for a specific job posting with keyword matching
          and cover letter generation.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Job URL Section */}
        <div className="space-y-3">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Link className="h-4 w-4" />
            Job Posting URL (Optional)
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="https://company.com/job-posting..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="flex-1 text-base"
            />
            <Button
              onClick={extractJobInfo}
              disabled={!jobUrl.trim() || isExtractingJob}
              variant="outline"
              size="sm"
            >
              {isExtractingJob ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                "Extract"
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500">
            Paste a job URL to auto-extract job title, company, and description
          </p>
        </div>

        {/* Manual Job Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Job Title</Label>
            <Input
              placeholder="e.g., Senior Software Engineer"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="text-base"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Company Name</Label>
            <Input
              placeholder="e.g., Google"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="text-base"
            />
          </div>
        </div>

        {/* Job Description */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            Job Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            placeholder="Paste the full job description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            rows={6}
            className="resize-none text-base"
          />
          <p className="text-xs text-gray-500">
            Include requirements, responsibilities, and skills for best results
          </p>
        </div>

        {/* Cover Letter Toggle */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-gray-600" />
            <div>
              <Label className="text-sm font-medium">
                Generate Cover Letter
              </Label>
              <p className="text-xs text-gray-500">
                Create a personalized cover letter for this position
              </p>
            </div>
          </div>
          <Button
            variant={includeCoverLetter ? "default" : "outline"}
            size="sm"
            onClick={() => setIncludeCoverLetter(!includeCoverLetter)}
            className="h-8"
          >
            {includeCoverLetter ? "✓ Enabled" : "Disabled"}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        )}

        {/* Progress Bar */}
        {isLoading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Tailoring resume...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleTailoring}
            disabled={!jobDescription.trim() || isLoading || isLoadingCredits}
            className="flex-1 bg-purple-600 hover:bg-purple-700"
          >
            {isLoading ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Tailoring...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Tailor Resume
                {includeCoverLetter && " + Cover Letter"}
              </>
            )}
          </Button>
          <Button
            onClick={resetForm}
            variant="outline"
            disabled={isLoading}
            size="sm"
          >
            Reset
          </Button>
        </div>

        {/* Processing Steps */}
        {isLoading && (
          <div className="space-y-2 text-left">
            <div
              className={`flex items-center gap-2 p-2 rounded ${
                progress > 20
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {progress > 20 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
              )}
              <span className="text-sm">Analyzing job requirements</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded ${
                progress > 50
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {progress > 50 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
              )}
              <span className="text-sm">Matching keywords and skills</span>
            </div>

            <div
              className={`flex items-center gap-2 p-2 rounded ${
                progress > 80
                  ? "bg-green-50 text-green-700"
                  : "bg-gray-50 text-gray-500"
              }`}
            >
              {progress > 80 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
              )}
              <span className="text-sm">Reordering content for relevance</span>
            </div>

            {includeCoverLetter && (
              <div
                className={`flex items-center gap-2 p-2 rounded ${
                  progress >= 100
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {progress >= 100 ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <div className="h-4 w-4 border-2 border-gray-300 rounded-full"></div>
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
