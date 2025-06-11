// components/analysis-cards.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Lock,
  ArrowRight,
  LogIn,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";

interface ResumeSection {
  section_name: string;
  found: boolean;
  score: number;
  roast: string;

  // Primary format (matching updated analysis types)
  issues: string[];
  strengths: string[];
  tips: Array<{
    issue: string;
    tip: string;
    example: string;
  }>;

  // Backward compatibility - legacy format (optional)
  rating?: string; // "Critical" | "Needs Work" | "Good" | "Excellent"
  good_things?: string[]; // Max 3 items
  issues_found?: string[]; // Max 3 items
  quick_fixes?: string[]; // Max 3 items
  improvements?: Array<{
    issue: string;
    fix: string;
    example: string;
  }>;
}

interface MissingSection {
  section_name: string;
  importance: string;
  roast: string;
}

interface AnalysisData {
  overall_score: number;
  ats_score: number;
  main_roast: string;
  score_category: string;
  resume_sections: ResumeSection[];
  missing_sections: MissingSection[];

  // Legacy format (optional)
  good_stuff?: any[];
  needs_work?: any[];
  critical_issues?: any[];
  shareable_roasts?: any[];
  ats_issues?: string[];
  formatting_issues?: any[];
  keyword_analysis?: any;
  quantification_issues?: any;
  action_plan?: any;
  industry_specific_advice?: any;
}

interface AnalysisCardsProps {
  analysis: AnalysisData;
  fileName: string;
  resumeId?: string;
  fileData?: string;
}

export function AnalysisCards({
  analysis,
  fileName,
  resumeId,
  fileData,
}: AnalysisCardsProps) {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();
  const t = useTranslations("analysisCards");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
    }));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 70) return "text-blue-600 bg-blue-100";
    if (score >= 40) return "text-yellow-600 bg-yellow-100";
    return "text-red-600 bg-red-100";
  };

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800 border-green-200";
      case "good":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "needs work":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "critical":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Get card background color based on score (0-39: red, 40-69: yellow, 70-89: blue, 90-100: green)
  const getCardBackgroundColor = (score: number) => {
    if (score >= 90) return "bg-green-50 border-green-200";
    if (score >= 70) return "bg-blue-50 border-blue-200";
    if (score >= 40) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  // Check if score deserves a special badge (90-100 is rare)
  const getSpecialBadge = (score: number) => {
    if (score >= 90) {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-300 text-xs font-bold flex items-center gap-1">
          <span>🏆</span>
          {t("exceptional")}
        </Badge>
      );
    }
    return null;
  };

  const handleImproveResume = () => {
    if (resumeId) {
      const params = new URLSearchParams({
        resumeId: resumeId,
        fileName: encodeURIComponent(fileName),
      });
      router.push(`/improve?${params.toString()}`);
    } else if (fileData) {
      const params = new URLSearchParams({
        fileData: encodeURIComponent(fileData),
        fileName: encodeURIComponent(fileName),
      });
      router.push(`/improve?${params.toString()}`);
    } else {
      console.error("No resume data available for improvement");
      toast.error("Unable to improve resume. Please upload and analyze again.");
    }
  };

  const renderLockedSection = (title: string, description: string) => (
    <Card key={title} className="border-gray-200 bg-gray-50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-gray-500">
            <Lock className="h-5 w-5" />
            {title}
          </CardTitle>
          <Badge variant="secondary" className="bg-purple-100 text-purple-800">
            {t("premium")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-500 mb-4">{description}</p>
        <SignInButton mode="modal">
          <Button variant="outline" className="w-full">
            <LogIn className="h-4 w-4 mr-2" />
            {t("signInToUnlock")}
          </Button>
        </SignInButton>
      </CardContent>
    </Card>
  );

  // Show loading state while auth is being determined
  if (!isLoaded) {
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 space-y-6">
      {/* TOP CTA - Prominent Improve Button */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-4 sm:p-6 text-white mb-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <h3 className="text-xl sm:text-2xl font-bold mb-2">
              {t("readyToFix")}
            </h3>
            <p className="text-purple-100 text-base sm:text-lg">
              {t("transformResume")}
            </p>
          </div>
          <Button
            onClick={handleImproveResume}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg transition-all duration-200 whitespace-nowrap w-full lg:w-auto"
          >
            <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
            {t("improveWithAI")}
          </Button>
        </div>
      </div>

      {/* Scores Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 text-center">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full ${getScoreColor(
              analysis.overall_score
            )} text-xl sm:text-2xl font-bold mb-3`}
          >
            {analysis.overall_score}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            {t("overallScore")}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {analysis.score_category}
          </p>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg border border-gray-200 text-center">
          <div
            className={`inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full ${getScoreColor(
              analysis.ats_score
            )} text-xl sm:text-2xl font-bold mb-3`}
          >
            {analysis.ats_score}
          </div>
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            {t("atsScore")}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            {t("robotApproval")}
          </p>
        </div>

        <div className="bg-red-50 p-4 sm:p-6 rounded-lg border border-red-200 text-center">
          <div className="text-2xl sm:text-3xl mb-3">🔥</div>
          <h3 className="font-semibold text-red-900 text-sm sm:text-base">
            {t("mainRoast")}
          </h3>
          <p className="text-xs sm:text-sm text-red-700 mt-2 font-medium break-words">
            "{analysis.main_roast}"
          </p>
        </div>

        <div className="bg-blue-50 p-4 sm:p-6 rounded-lg border border-blue-200 text-center">
          <div className="text-2xl sm:text-3xl mb-3">📋</div>
          <h3 className="font-semibold text-blue-900 text-sm sm:text-base">
            {t("sections")}
          </h3>
          <p className="text-xs sm:text-sm text-blue-700 mt-2 font-medium">
            {t("sectionsFound", {
              count: analysis.resume_sections?.length || 0,
            })}
          </p>
        </div>
      </div>

      {/* Section-by-Section Analysis - Simplified Format */}
      <div className="bg-white rounded-lg border border-gray-200 p-3 sm:p-6">
        <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center gap-2">
          <span>{t("detailedReview")}</span>
          <span className="text-xs sm:text-sm font-normal text-gray-500">
            {t("brutalTruth")}
          </span>
        </h3>

        <div className="space-y-4 sm:space-y-6">
          {/* Show first section for everyone */}
          {analysis.resume_sections?.slice(0, 1).map((section, index) => (
            <Card
              key={index}
              className={`${getCardBackgroundColor(
                section.score
              )} cursor-pointer hover:opacity-90 transition-opacity duration-200`}
              onClick={() => toggleSection(section.section_name)}
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                    <CardTitle className="text-base sm:text-lg text-gray-800 break-words">
                      {section.section_name}
                    </CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getScoreColor(
                          section.score
                        )}`}
                      >
                        {section.score}/100
                      </div>
                      <Badge
                        className={`${getRatingColor(
                          section.rating || "Unknown"
                        )} border text-xs`}
                      >
                        {section.rating || "Unknown"}
                      </Badge>
                      {getSpecialBadge(section.score)}
                    </div>
                  </div>
                  <div className="text-gray-400 self-end sm:self-auto">
                    {expandedSections[section.section_name] ? (
                      <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                {/* Roast - Always visible */}
                <div className="mb-4 p-3 bg-white/50 rounded-lg border border-gray-200">
                  <p className="font-medium italic text-gray-700 text-sm sm:text-base break-words">
                    "{section.roast}"
                  </p>
                </div>

                {/* Expandable Details */}
                {expandedSections[section.section_name] && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                    {/* Good Things */}
                    {((section.good_things?.length || 0) > 0 ||
                      (section.strengths?.length || 0) > 0) && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-green-800 flex items-center gap-2 text-sm sm:text-base">
                          <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                          {t("goodThings")}
                        </h5>
                        <ul className="space-y-1">
                          {(section.good_things || section.strengths || [])
                            .slice(0, 3)
                            .map((item, idx) => (
                              <li
                                key={idx}
                                className="text-xs sm:text-sm text-green-700 flex items-start gap-2 break-words"
                              >
                                <span className="text-green-500 mt-1 text-xs">
                                  •
                                </span>
                                {item}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Issues Found */}
                    {((section.issues_found?.length || 0) > 0 ||
                      (section.issues?.length || 0) > 0) && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-red-800 flex items-center gap-2 text-sm sm:text-base">
                          <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                          {t("issuesFound")}
                        </h5>
                        <ul className="space-y-1">
                          {(section.issues_found || section.issues || [])
                            .slice(0, 3)
                            .map((issue, idx) => (
                              <li
                                key={idx}
                                className="text-xs sm:text-sm text-red-700 flex items-start gap-2 break-words"
                              >
                                <span className="text-red-500 mt-1 text-xs">
                                  •
                                </span>
                                {issue}
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}

                    {/* Quick Fixes */}
                    {((section.quick_fixes?.length || 0) > 0 ||
                      (section.tips?.length || 0) > 0) && (
                      <div className="space-y-2">
                        <h5 className="font-medium text-blue-800 flex items-center gap-2 text-sm sm:text-base">
                          <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                          {t("quickFixes")}
                        </h5>
                        <ul className="space-y-1">
                          {section.quick_fixes
                            ? section.quick_fixes
                                .slice(0, 3)
                                .map((fix, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs sm:text-sm text-blue-700 flex items-start gap-2 break-words"
                                  >
                                    <span className="text-blue-500 mt-1 text-xs">
                                      •
                                    </span>
                                    {fix}
                                  </li>
                                ))
                            : section.tips?.slice(0, 3).map((tip, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs sm:text-sm text-blue-700 flex items-start gap-2 break-words"
                                >
                                  <span className="text-blue-500 mt-1 text-xs">
                                    •
                                  </span>
                                  {tip.tip}
                                </li>
                              ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {/* Remaining sections for signed-in users */}
          {isSignedIn &&
            analysis.resume_sections?.slice(1).map((section, index) => (
              <Card
                key={index + 1}
                className={`${getCardBackgroundColor(
                  section.score
                )} cursor-pointer hover:opacity-90 transition-opacity duration-200`}
                onClick={() => toggleSection(section.section_name)}
              >
                <CardHeader className="pb-3 sm:pb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <CardTitle className="text-base sm:text-lg text-gray-800 break-words">
                        {section.section_name}
                      </CardTitle>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${getScoreColor(
                            section.score
                          )}`}
                        >
                          {section.score}/100
                        </div>
                        <Badge
                          className={`${getRatingColor(
                            section.rating || t("unknown")
                          )} border text-xs`}
                        >
                          {section.rating || t("unknown")}
                        </Badge>
                        {getSpecialBadge(section.score)}
                      </div>
                    </div>
                    <div className="text-gray-400 self-end sm:self-auto">
                      {expandedSections[section.section_name] ? (
                        <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  {/* Roast - Always visible */}
                  <div className="mb-4 p-3 bg-white/50 rounded-lg border border-gray-200">
                    <p className="font-medium italic text-gray-700 text-sm sm:text-base break-words">
                      "{section.roast}"
                    </p>
                  </div>

                  {/* Expandable Details */}
                  {expandedSections[section.section_name] && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                      {/* Good Things */}
                      {((section.good_things?.length || 0) > 0 ||
                        (section.strengths?.length || 0) > 0) && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-green-800 flex items-center gap-2 text-sm sm:text-base">
                            <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t("goodThings")}
                          </h5>
                          <ul className="space-y-1">
                            {(section.good_things || section.strengths || [])
                              .slice(0, 3)
                              .map((item, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs sm:text-sm text-green-700 flex items-start gap-2 break-words"
                                >
                                  <span className="text-green-500 mt-1 text-xs">
                                    •
                                  </span>
                                  {item}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Issues Found */}
                      {((section.issues_found?.length || 0) > 0 ||
                        (section.issues?.length || 0) > 0) && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-red-800 flex items-center gap-2 text-sm sm:text-base">
                            <AlertTriangle className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t("issuesFound")}
                          </h5>
                          <ul className="space-y-1">
                            {(section.issues_found || section.issues || [])
                              .slice(0, 3)
                              .map((issue, idx) => (
                                <li
                                  key={idx}
                                  className="text-xs sm:text-sm text-red-700 flex items-start gap-2 break-words"
                                >
                                  <span className="text-red-500 mt-1 text-xs">
                                    •
                                  </span>
                                  {issue}
                                </li>
                              ))}
                          </ul>
                        </div>
                      )}

                      {/* Quick Fixes */}
                      {((section.quick_fixes?.length || 0) > 0 ||
                        (section.tips?.length || 0) > 0) && (
                        <div className="space-y-2">
                          <h5 className="font-medium text-blue-800 flex items-center gap-2 text-sm sm:text-base">
                            <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4" />
                            {t("quickFixes")}
                          </h5>
                          <ul className="space-y-1">
                            {section.quick_fixes
                              ? section.quick_fixes
                                  .slice(0, 3)
                                  .map((fix, idx) => (
                                    <li
                                      key={idx}
                                      className="text-xs sm:text-sm text-blue-700 flex items-start gap-2 break-words"
                                    >
                                      <span className="text-blue-500 mt-1 text-xs">
                                        •
                                      </span>
                                      {fix}
                                    </li>
                                  ))
                              : section.tips?.slice(0, 3).map((tip, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs sm:text-sm text-blue-700 flex items-start gap-2 break-words"
                                  >
                                    <span className="text-blue-500 mt-1 text-xs">
                                      •
                                    </span>
                                    {tip.tip}
                                  </li>
                                ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {/* Missing Sections */}
      {analysis.missing_sections && analysis.missing_sections.length > 0 && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl text-red-700 flex flex-col sm:flex-row sm:items-center gap-2">
              <span>{t("missingSections")}</span>
              <span className="text-xs sm:text-sm font-normal text-red-600">
                {t("criticalGaps")}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analysis.missing_sections.map((section, index) => (
                <div
                  key={index}
                  className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                    <h4 className="font-semibold text-red-800 text-sm sm:text-base break-words">
                      {section.section_name}
                    </h4>
                    <Badge
                      className={`${
                        section.importance === "Critical"
                          ? "bg-red-100 text-red-800"
                          : section.importance === "Important"
                          ? "bg-orange-100 text-orange-800"
                          : "bg-yellow-100 text-yellow-800"
                      } border text-xs self-start sm:self-auto`}
                    >
                      {section.importance === "Critical"
                        ? t("critical")
                        : section.importance === "Important"
                        ? t("important")
                        : t("recommended")}
                    </Badge>
                  </div>
                  <p className="text-red-700 italic text-sm sm:text-base break-words">
                    "{section.roast}"
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Premium sections for non-signed-in users */}
      {!isSignedIn && (
        <div className="space-y-4 sm:space-y-6">
          {renderLockedSection(
            t("advancedAnalysis"),
            t("advancedAnalysisDesc")
          )}
          {renderLockedSection(t("actionPlan"), t("actionPlanDesc"))}
          {renderLockedSection(
            t("industryInsights"),
            t("industryInsightsDesc")
          )}

          {/* Final Sign In CTA */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="pt-4 sm:pt-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl mb-4">🎯</div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                  {t("readyForFull")}
                </h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto text-sm sm:text-base">
                  {t("readyForFullDesc")}
                </p>
                <SignInButton mode="modal">
                  <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-6 sm:px-8 py-3 sm:py-4 rounded-lg transition-all duration-200 w-full sm:w-auto">
                    <span className="flex items-center gap-2 text-sm sm:text-base">
                      <LogIn className="h-4 w-4 sm:h-5 sm:w-5" />
                      {t("signInUnlock")}
                    </span>
                  </Button>
                </SignInButton>
                <p className="text-xs sm:text-sm text-gray-500 mt-3">
                  {t("freeForever")}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom CTA - Resume Improvement (always visible) */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-4 sm:p-6">
        <div className="text-center">
          <h4 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
            {t("transformYourResume")}
          </h4>
          <p className="text-gray-600 mb-4 text-sm sm:text-base">
            {t("getAIPowered")}
          </p>
          <Button
            onClick={handleImproveResume}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 sm:px-8 py-2 sm:py-3 text-sm sm:text-base w-full sm:w-auto"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            {t("startImproving")}
          </Button>
        </div>
      </div>
    </div>
  );
}
