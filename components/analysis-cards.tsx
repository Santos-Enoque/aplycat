// components/analysis-cards.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser, SignInButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Zap, Lock, Eye, ArrowRight, LogIn } from "lucide-react";

interface ResumeSection {
  section_name: string;
  found: boolean;
  score: number;
  roast: string;
  issues: string[];
  strengths: string[];
  improvements: Array<{
    issue: string;
    fix: string;
    example: string;
  }>;
}

interface MissingSection {
  section_name: string;
  importance: string;
  roast: string;
  recommendation: string;
}

interface FormattingIssue {
  issue: string;
  severity: string;
  fix: string;
}

interface KeywordAnalysis {
  missing_keywords: string[];
  overused_buzzwords: string[];
  weak_action_verbs: string[];
}

interface QuantificationIssues {
  missing_metrics: string[];
  vague_statements: string[];
}

interface IndustryAdvice {
  detected_industry: string;
  industry_standards: string[];
  industry_keywords: string[];
}

interface ActionItem {
  title: string;
  description: string;
  icon: string;
  color: string;
  time_estimate: string;
}

interface AnalysisData {
  overall_score: number;
  ats_score: number;
  main_roast: string;
  score_category: string;
  resume_sections: ResumeSection[];
  missing_sections: MissingSection[];
  good_stuff: Array<{
    title: string;
    roast: string;
    description: string;
  }>;
  needs_work: Array<{
    title: string;
    roast: string;
    issue: string;
    fix: string;
    example: string;
  }>;
  critical_issues: Array<{
    title: string;
    roast: string;
    disaster: string;
    fix: string;
    example: string;
  }>;
  shareable_roasts: Array<{
    id: string;
    text: string;
    category: string;
    shareText: string;
    platform: string;
  }>;
  ats_issues: string[];
  formatting_issues: FormattingIssue[];
  keyword_analysis: KeywordAnalysis;
  quantification_issues: QuantificationIssues;
  action_plan: {
    immediate: ActionItem[];
    longTerm: ActionItem[];
  };
  industry_specific_advice: IndustryAdvice;
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
  const [showFullAnalysis, setShowFullAnalysis] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-100";
    if (score >= 60) return "text-yellow-600 bg-yellow-100";
    if (score >= 40) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      red: "bg-red-100 text-red-800 border-red-200",
      blue: "bg-blue-100 text-blue-800 border-blue-200",
      yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
      green: "bg-green-100 text-green-800 border-green-200",
      purple: "bg-purple-100 text-purple-800 border-purple-200",
      gray: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return colors[color] || colors.gray;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-orange-600 bg-orange-100";
      case "low":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance.toLowerCase()) {
      case "critical":
        return "text-red-600 bg-red-100";
      case "important":
        return "text-orange-600 bg-orange-100";
      case "nice-to-have":
        return "text-blue-600 bg-blue-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const renderLockedSection = (sectionName: string, description: string) => (
    <div className="relative mb-6">
      <div className="filter blur-sm pointer-events-none select-none">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4">
            {sectionName}
          </h3>
          <div className="space-y-3">
            <div className="bg-gray-100 p-4 rounded-lg h-16"></div>
            <div className="bg-gray-100 p-4 rounded-lg h-12"></div>
            <div className="bg-gray-100 p-4 rounded-lg h-20"></div>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-white/90 rounded-lg">
        <div className="text-center p-6">
          <Lock className="h-12 w-12 text-purple-600 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-purple-900 mb-2">
            Sign in to unlock {sectionName.toLowerCase()}
          </h4>
          <p className="text-purple-700 mb-4 text-sm">{description}</p>
          <SignInButton mode="modal" fallbackRedirectUrl={window.location.href}>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to View
            </Button>
          </SignInButton>
        </div>
      </div>
    </div>
  );

  const handleImproveResume = () => {
    if (resumeId) {
      // New approach: use resume ID
      const params = new URLSearchParams({
        resumeId: resumeId,
        fileName: encodeURIComponent(fileName),
      });
      router.push(`/improve?${params.toString()}`);
    } else if (fileData) {
      // Backward compatibility: use file data
      const params = new URLSearchParams({
        fileData: encodeURIComponent(fileData),
        fileName: encodeURIComponent(fileName),
      });
      router.push(`/improve?${params.toString()}`);
    } else {
      // Show error - no data available
      console.error("No resume data available for improvement");
      alert("Unable to improve resume. Please upload and analyze again.");
    }
  };

  // Show loading state while auth is being determined
  if (!isLoaded) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-8"></div>
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          🐱 Aplycat's Brutal Analysis
        </h2>
        <p className="text-gray-600">Analysis for: {fileName}</p>
        {isSignedIn && user && (
          <p className="text-sm text-green-600 mt-1">
            Welcome back, {user.firstName || "there"}!
          </p>
        )}
      </div>

      {/* TOP CTA - Prominent Improve Button */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl shadow-lg p-6 text-white mb-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="text-center lg:text-left">
            <h3 className="text-2xl font-bold mb-2">
              🚀 Ready to Fix Everything?
            </h3>
            <p className="text-purple-100 text-lg">
              Let our AI transform your resume into an ATS-optimized masterpiece
            </p>
          </div>
          <Button
            onClick={handleImproveResume}
            className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 whitespace-nowrap"
          >
            <Zap className="h-5 w-5 mr-2" />
            Improve with AI
          </Button>
        </div>
      </div>

      {/* Scores Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(
              analysis.overall_score
            )} text-2xl font-bold mb-3`}
          >
            {analysis.overall_score}
          </div>
          <h3 className="font-semibold text-gray-900">Overall Score</h3>
          <p className="text-sm text-gray-600 mt-1">
            {analysis.score_category}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div
            className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(
              analysis.ats_score
            )} text-2xl font-bold mb-3`}
          >
            {analysis.ats_score}
          </div>
          <h3 className="font-semibold text-gray-900">ATS Score</h3>
          <p className="text-sm text-gray-600 mt-1">Robot Approval</p>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <div className="text-3xl mb-3">🔥</div>
          <h3 className="font-semibold text-red-900">Main Roast</h3>
          <p className="text-sm text-red-700 mt-2 font-medium">
            "{analysis.main_roast}"
          </p>
        </div>

        <div className="bg-blue-50 p-6 rounded-lg border border-blue-200 text-center">
          <div className="text-3xl mb-3">🎯</div>
          <h3 className="font-semibold text-blue-900">Industry</h3>
          <p className="text-sm text-blue-700 mt-2 font-medium">
            {analysis.industry_specific_advice?.detected_industry || "Unknown"}
          </p>
        </div>
      </div>

      {/* Section-by-Section Analysis - FREEMIUM STRATEGY */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          📋 Section-by-Section Destruction
        </h3>

        <div className="space-y-6">
          {/* Show ONLY first section for everyone */}
          {analysis.resume_sections?.slice(0, 1).map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h4 className="text-lg font-semibold text-gray-800">
                    {section.section_name}
                  </h4>
                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(
                      section.score
                    )}`}
                  >
                    {section.score}/100
                  </div>
                </div>
                <div className="text-2xl">
                  {section.score >= 80
                    ? "😺"
                    : section.score >= 60
                    ? "😼"
                    : section.score >= 40
                    ? "🙀"
                    : "😿"}
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-red-50 p-3 rounded border border-red-200">
                  <p className="text-red-700 font-medium italic">
                    "{section.roast}"
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {section.issues.length > 0 && (
                    <div>
                      <h5 className="font-medium text-red-800 mb-2">
                        🚨 Issues:
                      </h5>
                      <ul className="space-y-1">
                        {section.issues.map((issue, idx) => (
                          <li key={idx} className="text-sm text-red-700">
                            • {issue}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {section.strengths.length > 0 && (
                    <div>
                      <h5 className="font-medium text-green-800 mb-2">
                        ✅ Strengths:
                      </h5>
                      <ul className="space-y-1">
                        {section.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm text-green-700">
                            • {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {section.improvements.length > 0 && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <h5 className="font-medium text-blue-800 mb-2">
                      💡 How to Fix:
                    </h5>
                    <div className="space-y-2">
                      {section.improvements.map((improvement, idx) => (
                        <div key={idx} className="text-sm">
                          <p className="text-blue-700">
                            <strong>Issue:</strong> {improvement.issue}
                          </p>
                          <p className="text-blue-700">
                            <strong>Fix:</strong> {improvement.fix}
                          </p>
                          <p className="text-blue-600">
                            <strong>Example:</strong> {improvement.example}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Show locked sections OR full sections based on auth status */}
          {!isSignedIn &&
            analysis.resume_sections &&
            analysis.resume_sections.length > 1 && (
              <div className="space-y-6">
                {/* Preview of locked sections */}
                <div className="border-2 border-dashed border-purple-300 rounded-lg p-4 bg-purple-50/50">
                  <div className="text-center py-6">
                    <Lock className="h-12 w-12 text-purple-600 mx-auto mb-3" />
                    <h4 className="text-lg font-semibold text-purple-900 mb-2">
                      {analysis.resume_sections.length - 1} More Sections Locked
                    </h4>
                    <p className="text-purple-700 mb-4">
                      Get detailed analysis for all sections including:
                    </p>
                    <div className="flex flex-wrap justify-center gap-2 mb-4">
                      {analysis.resume_sections.slice(1).map((section, idx) => (
                        <span
                          key={idx}
                          className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                        >
                          {section.section_name}
                        </span>
                      ))}
                    </div>
                    <SignInButton
                      mode="modal"
                      fallbackRedirectUrl={window.location.href}
                    >
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                        <LogIn className="h-4 w-4 mr-2" />
                        Sign In to View All Sections Free
                      </Button>
                    </SignInButton>
                  </div>
                </div>
              </div>
            )}

          {/* Show all sections if signed in */}
          {isSignedIn &&
            analysis.resume_sections?.slice(1).map((section, index) => (
              <div
                key={index + 1}
                className="border border-gray-200 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {section.section_name}
                    </h4>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${getScoreColor(
                        section.score
                      )}`}
                    >
                      {section.score}/100
                    </div>
                  </div>
                  <div className="text-2xl">
                    {section.score >= 80
                      ? "😺"
                      : section.score >= 60
                      ? "😼"
                      : section.score >= 40
                      ? "🙀"
                      : "😿"}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-red-700 font-medium italic">
                      "{section.roast}"
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {section.issues.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-800 mb-2">
                          🚨 Issues:
                        </h5>
                        <ul className="space-y-1">
                          {section.issues.map((issue, idx) => (
                            <li key={idx} className="text-sm text-red-700">
                              • {issue}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {section.strengths.length > 0 && (
                      <div>
                        <h5 className="font-medium text-green-800 mb-2">
                          ✅ Strengths:
                        </h5>
                        <ul className="space-y-1">
                          {section.strengths.map((strength, idx) => (
                            <li key={idx} className="text-sm text-green-700">
                              • {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {section.improvements.length > 0 && (
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <h5 className="font-medium text-blue-800 mb-2">
                        💡 How to Fix:
                      </h5>
                      <div className="space-y-2">
                        {section.improvements.map((improvement, idx) => (
                          <div key={idx} className="text-sm">
                            <p className="text-blue-700">
                              <strong>Issue:</strong> {improvement.issue}
                            </p>
                            <p className="text-blue-700">
                              <strong>Fix:</strong> {improvement.fix}
                            </p>
                            <p className="text-blue-600">
                              <strong>Example:</strong> {improvement.example}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* All other sections - show locked versions for guests OR full content for signed in users */}
      {!isSignedIn ? (
        <div className="space-y-6">
          {/* Show locked versions of all sections */}
          {renderLockedSection(
            "🕳️ Missing Sections",
            "See what critical resume sections you're missing"
          )}
          {renderLockedSection(
            "🔍 Keyword Autopsy",
            "Get industry-specific keyword analysis"
          )}
          {renderLockedSection(
            "🎨 Formatting Disasters",
            "Fix formatting issues that hurt your chances"
          )}
          {renderLockedSection(
            "📊 Numbers Don't Lie",
            "Learn how to quantify your achievements"
          )}
          {renderLockedSection(
            "🏭 Industry Standards",
            "Understand what your industry expects"
          )}
          {renderLockedSection(
            "✅ What Doesn't Suck",
            "See what you're doing right"
          )}
          {renderLockedSection(
            "⚠️ Needs Work",
            "Get specific improvement suggestions"
          )}
          {renderLockedSection(
            "🚨 Critical Disasters",
            "Fix resume-killing issues"
          )}
          {renderLockedSection(
            "📱 Viral-Worthy Roasts",
            "Get shareable feedback"
          )}
          {renderLockedSection(
            "🤖 ATS Issues",
            "Make your resume robot-friendly"
          )}
          {renderLockedSection(
            "📋 Action Plan",
            "Get step-by-step improvement plan"
          )}

          {/* Final Sign In CTA */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-8 text-white text-center">
            <div className="text-5xl mb-4">🔓</div>
            <h3 className="text-2xl font-bold mb-4">
              Unlock Your Complete Analysis
            </h3>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
              Get access to detailed feedback for all sections, actionable
              improvements, ATS optimization tips, and everything else Aplycat
              found.
            </p>
            <SignInButton
              mode="modal"
              fallbackRedirectUrl={window.location.href}
            >
              <Button className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 text-lg">
                <LogIn className="h-5 w-5 mr-2" />
                Sign In to View All Results Free
              </Button>
            </SignInButton>
            <p className="text-purple-200 text-sm mt-4">
              100% Free • No credit card required • Full analysis unlocked
            </p>
          </div>
        </div>
      ) : (
        // Show full content for signed in users
        <div className="space-y-6">
          {/* Missing Sections */}
          {analysis.missing_sections &&
            analysis.missing_sections.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                  🕳️ Missing Sections (How Embarrassing)
                </h3>
                <div className="space-y-4">
                  {analysis.missing_sections.map((section, index) => (
                    <div
                      key={index}
                      className="bg-red-50 p-4 rounded-lg border border-red-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-red-800">
                          {section.section_name}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getImportanceColor(
                            section.importance
                          )}`}
                        >
                          {section.importance}
                        </span>
                      </div>
                      <p className="text-red-700 italic mb-2">
                        "{section.roast}"
                      </p>
                      <p className="text-red-600 text-sm">
                        {section.recommendation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Keyword Analysis */}
          {analysis.keyword_analysis && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                🔍 Keyword Autopsy
              </h3>
              <div className="grid md:grid-cols-3 gap-4">
                {analysis.keyword_analysis.missing_keywords.length > 0 && (
                  <div className="bg-red-50 p-4 rounded border border-red-200">
                    <h4 className="font-medium text-red-800 mb-2">
                      Missing Keywords
                    </h4>
                    <ul className="space-y-1">
                      {analysis.keyword_analysis.missing_keywords.map(
                        (keyword, idx) => (
                          <li key={idx} className="text-sm text-red-700">
                            • {keyword}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {analysis.keyword_analysis.overused_buzzwords.length > 0 && (
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <h4 className="font-medium text-yellow-800 mb-2">
                      Overused Buzzwords
                    </h4>
                    <ul className="space-y-1">
                      {analysis.keyword_analysis.overused_buzzwords.map(
                        (word, idx) => (
                          <li key={idx} className="text-sm text-yellow-700">
                            • {word}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {analysis.keyword_analysis.weak_action_verbs.length > 0 && (
                  <div className="bg-orange-50 p-4 rounded border border-orange-200">
                    <h4 className="font-medium text-orange-800 mb-2">
                      Weak Action Verbs
                    </h4>
                    <ul className="space-y-1">
                      {analysis.keyword_analysis.weak_action_verbs.map(
                        (verb, idx) => (
                          <li key={idx} className="text-sm text-orange-700">
                            • {verb}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Continue with all other sections... */}
          {/* Formatting Issues */}
          {analysis.formatting_issues &&
            analysis.formatting_issues.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
                  🎨 Formatting Disasters
                </h3>
                <div className="space-y-3">
                  {analysis.formatting_issues.map((issue, index) => (
                    <div
                      key={index}
                      className="bg-orange-50 p-4 rounded border border-orange-200"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-orange-800">
                          {issue.issue}
                        </h4>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                            issue.severity
                          )}`}
                        >
                          {issue.severity}
                        </span>
                      </div>
                      <p className="text-orange-600 text-sm">{issue.fix}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* Quantification Issues */}
          {analysis.quantification_issues && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center gap-2">
                📊 Numbers Don't Lie (But You Do)
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.quantification_issues.missing_metrics.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2">
                      Missing Metrics
                    </h4>
                    <ul className="space-y-1">
                      {analysis.quantification_issues.missing_metrics.map(
                        (metric, idx) => (
                          <li key={idx} className="text-sm text-blue-700">
                            • {metric}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {analysis.quantification_issues.vague_statements.length > 0 && (
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h4 className="font-medium text-gray-800 mb-2">
                      Vague Statements
                    </h4>
                    <ul className="space-y-1">
                      {analysis.quantification_issues.vague_statements.map(
                        (statement, idx) => (
                          <li key={idx} className="text-sm text-gray-700">
                            • {statement}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Industry-Specific Advice */}
          {analysis.industry_specific_advice && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                🏭 Industry Standards You're Ignoring
              </h3>
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <h4 className="font-medium text-green-800 mb-2">
                    Detected Industry:{" "}
                    {analysis.industry_specific_advice.detected_industry}
                  </h4>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {analysis.industry_specific_advice.industry_standards.length >
                    0 && (
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">
                        Industry Standards:
                      </h4>
                      <ul className="space-y-1">
                        {analysis.industry_specific_advice.industry_standards.map(
                          (standard, idx) => (
                            <li key={idx} className="text-sm text-green-700">
                              • {standard}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {analysis.industry_specific_advice.industry_keywords.length >
                    0 && (
                    <div>
                      <h4 className="font-medium text-green-800 mb-2">
                        Industry Keywords:
                      </h4>
                      <ul className="space-y-1">
                        {analysis.industry_specific_advice.industry_keywords.map(
                          (keyword, idx) => (
                            <li key={idx} className="text-sm text-green-700">
                              • {keyword}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Good Stuff */}
          {analysis.good_stuff && analysis.good_stuff.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
                ✅ What Doesn't Suck
              </h3>
              <div className="space-y-4">
                {analysis.good_stuff.map((item, index) => (
                  <div
                    key={index}
                    className="bg-green-50 p-4 rounded-lg border border-green-200"
                  >
                    <h4 className="font-semibold text-green-800 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-green-700 italic mb-2">"{item.roast}"</p>
                    <p className="text-green-600 text-sm">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Needs Work */}
          {analysis.needs_work && analysis.needs_work.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
                ⚠️ Needs Work (Obviously)
              </h3>
              <div className="space-y-4">
                {analysis.needs_work.map((item, index) => (
                  <div
                    key={index}
                    className="bg-orange-50 p-4 rounded-lg border border-orange-200"
                  >
                    <h4 className="font-semibold text-orange-800 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-orange-700 italic mb-2">
                      "{item.roast}"
                    </p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium text-orange-800">
                          Issue:
                        </span>{" "}
                        {item.issue}
                      </p>
                      <p>
                        <span className="font-medium text-orange-800">
                          Fix:
                        </span>{" "}
                        {item.fix}
                      </p>
                      <p>
                        <span className="font-medium text-orange-800">
                          Example:
                        </span>{" "}
                        {item.example}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Critical Issues */}
          {analysis.critical_issues && analysis.critical_issues.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
                🚨 Critical Disasters
              </h3>
              <div className="space-y-4">
                {analysis.critical_issues.map((item, index) => (
                  <div
                    key={index}
                    className="bg-red-50 p-4 rounded-lg border border-red-200"
                  >
                    <h4 className="font-semibold text-red-800 mb-2">
                      {item.title}
                    </h4>
                    <p className="text-red-700 italic mb-2">"{item.roast}"</p>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-medium text-red-800">
                          Why it's disaster:
                        </span>{" "}
                        {item.disaster}
                      </p>
                      <p>
                        <span className="font-medium text-red-800">Fix:</span>{" "}
                        {item.fix}
                      </p>
                      <p>
                        <span className="font-medium text-red-800">
                          Example:
                        </span>{" "}
                        {item.example}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shareable Roasts */}
          {analysis.shareable_roasts &&
            analysis.shareable_roasts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
                  📱 Viral-Worthy Roasts
                </h3>
                <div className="grid gap-4">
                  {analysis.shareable_roasts.map((roast, index) => (
                    <div
                      key={index}
                      className="bg-purple-50 p-4 rounded-lg border border-purple-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                          {roast.category}
                        </span>
                        <button
                          onClick={() => copyToClipboard(roast.shareText)}
                          className="text-xs bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded transition-colors"
                        >
                          Copy Share Text
                        </button>
                      </div>
                      <p className="text-purple-800 font-medium mb-2">
                        "{roast.text}"
                      </p>
                      <p className="text-purple-600 text-sm italic">
                        {roast.shareText}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          {/* ATS Issues */}
          {analysis.ats_issues && analysis.ats_issues.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
                🤖 ATS Issues
              </h3>
              <ul className="space-y-2">
                {analysis.ats_issues.map((issue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-red-500 mt-1">•</span>
                    <span className="text-gray-700">{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Plan */}
          {analysis.action_plan && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                📋 Action Plan
              </h3>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Immediate Actions */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    🚀 Do This Now
                  </h4>
                  <div className="space-y-3">
                    {analysis.action_plan.immediate?.map((action, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getColorClasses(
                          action.color
                        )}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{action.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="font-medium">{action.title}</h5>
                              <span className="text-xs opacity-75">
                                {action.time_estimate}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Long-term Actions */}
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    📈 Long-term Goals
                  </h4>
                  <div className="space-y-3">
                    {analysis.action_plan.longTerm?.map((action, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${getColorClasses(
                          action.color
                        )}`}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-lg">{action.icon}</span>
                          <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                              <h5 className="font-medium">{action.title}</h5>
                              <span className="text-xs opacity-75">
                                {action.time_estimate}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{action.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom CTA - Resume Improvement (always visible) */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 p-6">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">
            Ready for the AI Magic?
          </h3>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Let our AI transform your resume into an ATS-optimized,
            industry-tailored masterpiece. We'll fix everything we roasted and
            make it actually good.
          </p>
          <button
            onClick={handleImproveResume}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <span className="flex items-center gap-2">
              🚀 Improve My Resume with AI
            </span>
          </button>
          <p className="text-sm text-gray-500 mt-3">
            Tailored to your target role • ATS-optimized • Professional
            formatting
          </p>
        </div>
      </div>
    </div>
  );
}
