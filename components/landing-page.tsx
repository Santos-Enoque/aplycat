"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Award,
  CheckCircle,
  Star,
  Target,
  TrendingUp,
  Upload,
  Zap,
  X,
  Clock,
  Users,
  Sparkles,
  FileText,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignInButton } from "@clerk/nextjs";
import { useDropzone } from "react-dropzone";
import { useAnonymousStreamingAnalysis } from "@/hooks/use-anonymous-streaming-analysis";
import { StreamingAnalysisDisplay } from "@/components/streaming-analysis-display";
import {
  AiResumeGeneratorPreview,
  HonestFeedbackPreview,
  JobTailoringPreview,
  LinkedInPreview,
} from "./feature-previews";
import { useTranslations } from "next-intl";

// Trial Popup Component
const TrialPopup = ({
  isOpen,
  onClose,
  onAccept,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAccept: (paymentMethod?: "credit_card" | "mobile_money") => void;
}) => {
  const t = useTranslations("trialPopup");
  const [timeLeft, setTimeLeft] = useState("23:59:42");
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  React.useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(23 - (now.getHours() % 24)).padStart(2, "0");
      const minutes = String(59 - now.getMinutes()).padStart(2, "0");
      const seconds = String(59 - now.getSeconds()).padStart(2, "0");
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative animate-in slide-in-from-bottom-4 duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles className="h-4 w-4" />
            {t("limitedTimeOffer")}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t("title", { price: "$1" })}
          </h2>
          <p className="text-gray-600">{t("subtitle")}</p>
        </div>

        {/* Value Proposition */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-900">
              {t("creditsIncluded")}
            </span>
            <span className="text-2xl font-bold text-blue-600">
              {t("creditsValue")}
            </span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span>{t("resumeImprovements")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span>{t("jobTailoredResumes")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span>{t("linkedinAnalysis")}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-500" />
              <span>{t("customEnhancement")}</span>
            </div>
          </div>
        </div>

        {/* Urgency */}
        <div className="flex items-center justify-center gap-2 text-red-600 font-semibold mb-6">
          <Clock className="h-5 w-5" />
          <span>{t("offerExpires", { timeLeft })}</span>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          {!showPaymentMethods ? (
            <>
              <Button
                onClick={() => setShowPaymentMethods(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
              >
                {t("startTrial")}
              </Button>
              <Button
                onClick={() => {
                  onClose();
                  localStorage.setItem("aplycat_trial_intent", "true");
                  window.location.href = "/signup?trial=true&intent=payment";
                }}
                variant="outline"
                className="w-full border-blue-200 text-blue-600 hover:bg-blue-50"
              >
                {t("signUpFirst")}
              </Button>
              <Button
                onClick={onClose}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                {t("maybeLater")}
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-center text-gray-700 font-medium">
                {t("choosePaymentMethod")}
              </p>
              <div className="grid grid-cols-1 gap-3">
                <Button
                  onClick={() => onAccept("credit_card")}
                  className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {t("payWithCreditCard")}
                </Button>
                <Button
                  onClick={() => onAccept("mobile_money")}
                  variant="outline"
                  className="w-full border-blue-300 text-blue-700 hover:bg-blue-50 py-4 text-lg font-bold rounded-xl"
                >
                  {t("payWithMobileMoney")}
                </Button>
              </div>
              <Button
                onClick={() => setShowPaymentMethods(false)}
                variant="ghost"
                className="w-full text-gray-600 hover:text-gray-800"
              >
                {t("backToOptions")}
              </Button>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {t("disclaimer")}
        </p>
      </div>
    </div>
  );
};

// Free Upload Component with Streaming Analysis
const FreeStreamingAnalysis = ({
  onRateLimitExceeded,
  onShowTrialPopup,
}: {
  onRateLimitExceeded: (error: any) => void;
  onShowTrialPopup: () => void;
}) => {
  const t = useTranslations("upload");
  const { analysis, status, error, rateLimit, startAnalysis } =
    useAnonymousStreamingAnalysis();

  const [fileName, setFileName] = useState<string | null>(null);

  // Smart trial popup timing - much less intrusive
  useEffect(() => {
    if (status === "completed" && analysis) {
      // Check if user previously clicked "Maybe later"
      const hasDeclined = localStorage.getItem("aplycat_trial_declined");
      if (hasDeclined) {
        return; // Don't show popup if user previously declined
      }

      // Show after 1 minute of viewing results
      const timer = setTimeout(() => {
        onShowTrialPopup();
      }, 60000); // 60 seconds

      return () => clearTimeout(timer);
    }
  }, [status, analysis, onShowTrialPopup]);

  // Option 2: Show on user interaction with upgrade elements
  const handleUpgradeClick = () => {
    onShowTrialPopup();
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      await startAnalysis(file);
    },
    [startAnalysis]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
    },
    maxFiles: 1,
    disabled: status === "streaming" || status === "connecting",
  });

  // Handle rate limit exceeded
  useEffect(() => {
    if (status === "rate_limited" && error) {
      onRateLimitExceeded({
        message: error,
        resetTime: rateLimit?.resetTime,
      });
    }
  }, [status, error, rateLimit, onRateLimitExceeded]);

  // If we have analysis results, show them using the beautiful component
  if (
    (status === "streaming" || status === "completed") &&
    (analysis || fileName)
  ) {
    return (
      <div>
        {fileName && (
          <p className="text-center text-muted-foreground mb-6">
            Analysis for: <strong>{fileName}</strong>
          </p>
        )}
        <StreamingAnalysisDisplay
          analysis={analysis}
          status={status}
          onStartImprovement={handleUpgradeClick}
          isAnonymous={true}
        />
      </div>
    );
  }

  // Show error state
  if (status === "error") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-red-600 mb-4">
              Analysis Failed
            </h3>
            <p className="text-lg text-red-700 mb-6">
              {error || "Something went wrong during the analysis."}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show upload interface
  return (
    <div className="max-w-2xl mx-auto">
      {/* Rate Limit Info */}
      {rateLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">
              {t("rateLimit", { remaining: rateLimit.remaining })}
            </span>
          </div>
        </div>
      )}

      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${
            isDragActive
              ? "border-blue-500 bg-blue-50 scale-105"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50"
          }
          ${
            status === "streaming" || status === "connecting"
              ? "pointer-events-none opacity-75"
              : ""
          }
        `}
      >
        <input {...getInputProps()} />

        {status === "idle" ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t("dropTitle")}
            </h3>
            <p className="text-lg text-gray-600 mb-4">{t("dropSubtitle")}</p>
            <p className="text-sm text-gray-500">{t("fileInfo")}</p>
            <Button className="mt-6 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-3 rounded-xl font-semibold">
              {t("browseButton")}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {status === "connecting" ? t("connecting") : t("analyzing")}
              </h3>
              <p className="text-gray-600">{t("waitMessage")}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Analysis Results Component
const AnalysisResults = ({
  analysis,
  rateLimit,
  onUpgrade,
}: {
  analysis: any;
  rateLimit?: { remaining: number; resetTime: string };
  onUpgrade: () => void;
}) => {
  const t = useTranslations("analysisResults");
  const isLimited = analysis.is_limited;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Rate Limit Info */}
      {rateLimit && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-700">
            <Clock className="h-5 w-5" />
            <span className="font-semibold">
              {t("rateLimit", { remaining: rateLimit.remaining })}
            </span>
          </div>
          {rateLimit.remaining === 0 && (
            <p className="text-sm text-amber-600 mt-1">
              {t("resetTime", {
                time: new Date(rateLimit.resetTime).toLocaleTimeString(),
              })}
            </p>
          )}
        </div>
      )}

      {/* Score Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">
                  {t("overallScore")}
                </p>
                <p className="text-4xl font-bold text-blue-600">
                  {analysis.overall_score}
                </p>
              </div>
              <div className="text-blue-500">
                <Target className="h-12 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t("atsScore")}</p>
                <p className="text-4xl font-bold text-purple-600">
                  {analysis.ats_score}
                </p>
              </div>
              <div className="text-purple-500">
                <FileText className="h-12 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Roast */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t("brutailFeedback")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-red-700 font-medium italic">
            "{analysis.main_roast}"
          </p>
        </CardContent>
      </Card>

      {/* Resume Sections */}
      {analysis.resume_sections && analysis.resume_sections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("sectionAnalysis")}
              {isLimited && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-600"
                >
                  {t("limitedPreview")}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis.resume_sections.map((section: any, index: number) => (
              <div key={index} className="border-l-4 border-l-blue-500 pl-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    {section.section_name}
                  </h4>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{section.rating}</Badge>
                    <span className="text-sm font-bold">
                      {section.score}/100
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 italic mb-2">
                  "{section.roast}"
                </p>
                {section.issues_found && section.issues_found.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-red-600">Issues:</span>
                    <ul className="list-disc list-inside text-gray-600">
                      {section.issues_found.map((issue: string, i: number) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}

            {/* Show blur overlay for hidden sections */}
            {isLimited && analysis.hidden_sections_count > 0 && (
              <div className="relative">
                <div className="h-40 bg-gradient-to-b from-transparent to-white absolute inset-0 z-10 flex items-end justify-center pb-4">
                  <Button
                    onClick={onUpgrade}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t("seeMoreSections", {
                      count: analysis.hidden_sections_count,
                    })}
                  </Button>
                </div>
                <div className="blur-sm opacity-50 space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="border-l-4 border-l-gray-300 pl-4">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA */}
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">
            {isLimited ? t("upgradeTitle.limited") : t("upgradeTitle.full")}
          </h3>
          <p className="text-lg mb-6 opacity-90">
            {isLimited
              ? t("upgradeSubtitle.limited")
              : t("upgradeSubtitle.full")}
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold">7</p>
              <p className="text-sm opacity-80">{t("upgradeStats.credits")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">$5.81</p>
              <p className="text-sm opacity-80">{t("upgradeStats.value")}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">$1</p>
              <p className="text-sm opacity-80">
                {t("upgradeStats.limitedTime")}
              </p>
            </div>
          </div>
          <Button
            onClick={onUpgrade}
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold rounded-xl"
          >
            {t("upgradeButton")}
          </Button>
          <p className="text-sm mt-4 opacity-75">{t("upgradeDisclaimer")}</p>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Testimonials Component
const TestimonialsSection = () => {
  const t = useTranslations("testimonials");
  const testimonials = t.raw("items");

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            {t("title")}
          </h2>
          <div className="flex justify-center items-center space-x-8 text-sm text-gray-600 mb-8">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🔥</span>
              <span className="font-semibold">{t("stats.roasted")}</span>
            </div>
            <div className="flex items-center">
              <span className="text-yellow-400 mr-1">⭐⭐⭐⭐⭐</span>
              <span className="font-semibold">{t("stats.rating")}</span>
            </div>
            <div className="flex items-center">
              <span className="text-blue-500 mr-1">💼</span>
              <span className="font-semibold">{t("stats.interviews")}</span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial: any, index: number) => (
            <Card
              key={index}
              className="hover:shadow-lg transition-shadow border-gray-200"
            >
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                    {testimonial.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </div>
                  <div>
                    <div className="flex text-yellow-400 mb-1">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">
                      {testimonial.name}, {testimonial.role}
                    </p>
                  </div>
                </div>
                <p className="text-gray-900 font-semibold mb-2">
                  "{testimonial.quote}"
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  {testimonial.story}
                </p>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold inline-block">
                  {testimonial.result}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Rate Limit Error Component
const RateLimitError = ({
  error,
  onUpgrade,
}: {
  error: any;
  onUpgrade: () => void;
}) => {
  const t = useTranslations("rateLimitError");
  const resetTime = new Date(error.resetTime).toLocaleTimeString();

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <Clock className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-red-600 mb-4">{t("title")}</h3>
          <p className="text-lg text-red-700 mb-6">
            {error.message || t("message")}
          </p>
          <p className="text-sm text-red-600 mb-6">
            {t("resetTime", { time: resetTime })}
          </p>
          <div className="space-y-4">
            <Button
              onClick={onUpgrade}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-bold rounded-xl"
            >
              {t("upgradeButton")}
            </Button>
            <p className="text-sm text-gray-600">{t("signupMessage")}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Features Section with Alternating Layout
const FeaturesSection = () => {
  const t = useTranslations("features");

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Feature 1: Resume Honest Feedback */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t("honestFeedback.title")}
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              {t("honestFeedback.description")}
            </p>
            <ul className="space-y-3 mb-6">
              {t
                .raw("honestFeedback.features")
                .map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-foreground">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                    {feature}
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <HonestFeedbackPreview />
          </div>
        </div>

        {/* Feature 2: AI Resume Generator */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div className="lg:order-2">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t("aiGenerator.title")}
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              {t("aiGenerator.description")}
            </p>
            <ul className="space-y-3 mb-6">
              {t
                .raw("aiGenerator.features")
                .map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-foreground">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                    {feature}
                  </li>
                ))}
            </ul>
          </div>
          <div className="lg:order-1">
            <AiResumeGeneratorPreview />
          </div>
        </div>

        {/* Feature 3: Job-Specific Tailoring */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t("jobTailoring.title")}
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              {t("jobTailoring.description")}
            </p>
            <ul className="space-y-3 mb-6">
              {t
                .raw("jobTailoring.features")
                .map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-foreground">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                    {feature}
                  </li>
                ))}
            </ul>
          </div>
          <div>
            <JobTailoringPreview />
          </div>
        </div>

        {/* Feature 4: LinkedIn Optimization */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="lg:order-2">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <Award className="h-8 w-8 text-blue-500" />
            </div>
            <h3 className="text-3xl font-bold text-foreground mb-4">
              {t("linkedinOptimization.title")}
            </h3>
            <p className="text-lg text-muted-foreground mb-6">
              {t("linkedinOptimization.description")}
            </p>
            <ul className="space-y-3 mb-6">
              {t
                .raw("linkedinOptimization.features")
                .map((feature: string, index: number) => (
                  <li key={index} className="flex items-center text-foreground">
                    <CheckCircle className="h-5 w-5 text-blue-500 mr-3" />
                    {feature}
                  </li>
                ))}
            </ul>
          </div>
          <div className="lg:order-1">
            <LinkedInPreview />
          </div>
        </div>
      </div>
    </section>
  );
};

// Before & After Section
const BeforeAfterSection = () => {
  const t = useTranslations("beforeAfter");

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-red-600">
                  {t("before.title")}
                </CardTitle>
                <Badge variant="destructive">{t("before.atsScore")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded border-2 border-dashed border-red-300">
                <h3 className="font-semibold text-sm mb-2">
                  {t("before.filename")}
                </h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {t
                    .raw("before.issues")
                    .map((issue: string, index: number) => (
                      <p key={index}>• {issue}</p>
                    ))}
                </div>
              </div>
              <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
                <strong>Roast Result:</strong> {t("before.roast")}
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-green-600">
                  {t("after.title")}
                </CardTitle>
                <Badge className="bg-green-500">{t("after.atsScore")}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white p-4 rounded border-2 border-dashed border-green-300">
                <h3 className="font-semibold text-sm mb-2">
                  {t("after.filename")}
                </h3>
                <div className="space-y-1 text-xs text-muted-foreground">
                  {t
                    .raw("after.improvements")
                    .map((improvement: string, index: number) => (
                      <p key={index}>• {improvement}</p>
                    ))}
                </div>
              </div>
              <div className="text-sm text-green-600 bg-green-100 p-3 rounded">
                <strong>Result:</strong> {t("after.result")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

// How It Works Section
const HowItWorksSection = () => {
  const t = useTranslations("howItWorks");

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {t.raw("steps").map((step: any, index: number) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                {index + 1}
              </div>
              <h3 className="text-xl font-semibold mb-4">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Pricing Section
const PricingSection = () => {
  const t = useTranslations("pricing");

  return (
    <section className="py-20 bg-white" id="pricing">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-6 rounded-full inline-block mb-6">
            {t("launchOffer")}
          </div>
          <h2 className="text-4xl font-bold text-foreground mb-4">
            {t("title")}
          </h2>
          <p className="text-xl text-muted-foreground">{t("subtitle")}</p>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {t.raw("packages").map((pkg: any, index: number) => (
            <Card
              key={index}
              className={`hover:shadow-lg transition-shadow ${
                pkg.isPopular ? "border-blue-500 relative" : "border-blue-200"
              } flex flex-col`}
            >
              {pkg.isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-500 text-white px-4 py-1 text-sm">
                    {t("mostPopular")}
                  </Badge>
                </div>
              )}
              <CardHeader
                className={`text-center ${pkg.isPopular ? "pt-8" : ""}`}
              >
                <CardTitle className="text-2xl">{pkg.name}</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-blue-500">
                    {pkg.price}
                  </div>
                  <Badge className="bg-blue-500">{pkg.credits}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {pkg.features.map((feature: string, featureIndex: number) => (
                    <li key={featureIndex} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-blue-500 mr-2 mt-1 flex-shrink-0" />
                      <span dangerouslySetInnerHTML={{ __html: feature }} />
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <SignInButton mode="modal">
                  <Button className="w-full bg-blue-500 hover:bg-blue-600">
                    {pkg.buttonText}
                  </Button>
                </SignInButton>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

// Final CTA Section
const FinalCTASection = () => {
  const t = useTranslations("finalCTA");

  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-6">{t("title")}</h2>
        <p className="text-xl md:text-2xl mb-8 opacity-90">{t("subtitle")}</p>
        <SignInButton mode="modal">
          <Button
            size="lg"
            className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
          >
            <Upload className="mr-2 h-5 w-5" />
            {t("buttonText")}
          </Button>
        </SignInButton>
        <p className="text-sm mt-4 opacity-75">{t("offerNote")}</p>
      </div>
    </section>
  );
};

// Main Landing Page Component
export function LandingPage() {
  const t = useTranslations();
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<any>(null);
  const [currentView, setCurrentView] = useState<"upload" | "rate-limit">(
    "upload"
  );

  const handleRateLimitExceeded = (error: any) => {
    setRateLimitError(error);
    setCurrentView("rate-limit");
  };

  const handleTrialAccept = async (
    paymentMethod?: "credit_card" | "mobile_money"
  ) => {
    setShowTrialPopup(false);

    // Clear any previous trial decline flag since user is actively choosing trial
    localStorage.removeItem("aplycat_trial_declined");

    // Check if user is signed in
    // If not signed in, redirect to signup with trial
    // If signed in, process payment directly
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: "trial",
          paymentMethod: paymentMethod || "credit_card", // Default to credit card
          returnUrl: window.location.origin + "/trial-success",
        }),
      });

      if (response.status === 401) {
        // Not authenticated, store trial intent and redirect to signup
        localStorage.setItem("aplycat_trial_intent", "true");
        window.location.href = "/signup?trial=true&intent=payment";
        return;
      }

      if (!response.ok) {
        throw new Error("Failed to create checkout");
      }

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Show payment method specific message
        if (paymentMethod === "mobile_money") {
          console.log("Redirecting to mobile money payment...");
        } else {
          console.log("Redirecting to secure card payment...");
        }
        // Redirect to payment provider
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Invalid checkout response");
      }
    } catch (error) {
      console.error("Trial payment error:", error);
      // Fallback to signup with trial intent
      localStorage.setItem("aplycat_trial_intent", "true");
      window.location.href = "/signup?trial=true&intent=payment";
    }
  };

  // Handle trial popup decline with tracking
  const handleTrialDecline = () => {
    setShowTrialPopup(false);
    // Track that user declined trial to avoid showing popup again
    localStorage.setItem("aplycat_trial_declined", "true");
  };

  return (
    <>
      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold">{t("banner.trial")}</p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              {t("hero.badge")}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {t("hero.title", { recruiters: t("hero.recruiters") })}
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              {t("hero.subtitle")}
            </p>
          </div>

          {/* Upload or Results */}
          {currentView === "upload" ? (
            <FreeStreamingAnalysis
              onRateLimitExceeded={handleRateLimitExceeded}
              onShowTrialPopup={() => setShowTrialPopup(true)}
            />
          ) : (
            <RateLimitError
              error={rateLimitError}
              onUpgrade={() => setShowTrialPopup(true)}
            />
          )}

          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600 mt-12">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-semibold">
                {t("hero.socialProof.analyzed")}
              </span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400" />
              <span className="font-semibold">
                {t("hero.socialProof.rating")}
              </span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-semibold">
                {t("hero.socialProof.interviews")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Testimonials */}
      <TestimonialsSection />

      {/* Features Section */}
      <FeaturesSection />

      {/* Before & After Section */}
      <BeforeAfterSection />

      {/* How It Works Section */}
      <HowItWorksSection />

      {/* Pricing Section */}
      <PricingSection />

      {/* Final CTA Section */}
      <FinalCTASection />

      {/* Trial Popup */}
      <TrialPopup
        isOpen={showTrialPopup}
        onClose={handleTrialDecline}
        onAccept={handleTrialAccept}
      />
    </>
  );
}
