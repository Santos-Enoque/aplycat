"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Download,
  Share2,
  ThumbsUp,
  ThumbsDown,
  Target,
  Brain,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  TrendingUp,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AnalysisDetailProps {
  analysis: {
    id: string;
    fileName: string;
    overallScore: number;
    atsScore: number;
    mainRoast: string;
    scoreCategory: string;
    analysisData: any; // The full JSON analysis data
    creditsUsed: number;
    createdAt: Date;
    resume: {
      fileName: string;
      fileUrl: string;
    };
  };
  onBack: () => void;
}

export function AnalysisDetail({ analysis, onBack }: AnalysisDetailProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "sections" | "improvements" | "action-plan"
  >("overview");

  const data = analysis.analysisData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-50";
    if (score >= 60) return "bg-yellow-50";
    if (score >= 40) return "bg-orange-50";
    return "bg-red-50";
  };

  const getRoastTextColor = (score: number) => {
    if (score >= 80) return "text-green-700";
    if (score >= 60) return "text-yellow-700";
    if (score >= 40) return "text-orange-700";
    return "text-gray-700";
  };

  const shareAnalysis = () => {
    if (navigator.share) {
      navigator.share({
        title: "My Resume Analysis",
        text: `My resume scored ${analysis.overallScore}/100 on Aplycat! ${analysis.mainRoast}`,
        url: window.location.href,
      });
    } else {
      // Fallback to clipboard
      navigator.clipboard.writeText(
        `My resume scored ${analysis.overallScore}/100 on Aplycat! ${analysis.mainRoast}`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {analysis.fileName}
                </h1>
                <p className="text-gray-600">
                  Analyzed{" "}
                  {formatDistanceToNow(new Date(analysis.createdAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={shareAnalysis}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Score Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card
            className={`${getScoreBgColor(analysis.overallScore)} border-2`}
          >
            <CardContent className="p-6 text-center">
              <Brain className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Overall Score
              </h3>
              <div
                className={`text-4xl font-bold ${getScoreColor(
                  analysis.overallScore
                )} mb-2`}
              >
                {analysis.overallScore}/100
              </div>
              <Badge className="mb-4">{analysis.scoreCategory}</Badge>
              <p className="text-sm text-gray-600 italic">
                "{analysis.mainRoast}"
              </p>
            </CardContent>
          </Card>

          <Card className={`${getScoreBgColor(analysis.atsScore)} border-2`}>
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                ATS Score
              </h3>
              <div
                className={`text-4xl font-bold ${getScoreColor(
                  analysis.atsScore
                )} mb-2`}
              >
                {analysis.atsScore}/100
              </div>
              <Progress value={analysis.atsScore} className="mb-4" />
              <p className="text-sm text-gray-600">
                Applicant Tracking System compatibility
              </p>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-2">
            <CardContent className="p-6 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Potential
              </h3>
              <div className="text-4xl font-bold text-purple-600 mb-2">
                {Math.min(100, analysis.overallScore + 25)}/100
              </div>
              <Badge className="bg-purple-100 text-purple-800 mb-4">
                With improvements
              </Badge>
              <p className="text-sm text-gray-600">
                Your resume's potential score
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: "overview", label: "Overview", icon: Brain },
                { key: "sections", label: "Section Analysis", icon: FileText },
                { key: "improvements", label: "Improvements", icon: Lightbulb },
                { key: "action-plan", label: "Action Plan", icon: Target },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? "border-purple-500 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* What's Good */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  What's Working
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.good_stuff?.length > 0 ? (
                  <div className="space-y-4">
                    {data.good_stuff.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-semibold text-green-900 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-green-800 text-sm mb-2 italic">
                          "{item.roast}"
                        </p>
                        <p className="text-green-700 text-sm">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No positive feedback available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Critical Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Critical Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.critical_issues?.length > 0 ? (
                  <div className="space-y-4">
                    {data.critical_issues.map((issue: any, index: number) => (
                      <div key={index} className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-semibold text-red-900 mb-2">
                          {issue.title}
                        </h4>
                        <p className="text-red-800 text-sm mb-2 italic">
                          "{issue.roast}"
                        </p>
                        <p className="text-red-700 text-sm mb-2">
                          {issue.disaster}
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm text-gray-700">
                            <strong>Fix:</strong> {issue.fix}
                          </p>
                          {issue.example && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Example:</strong> {issue.example}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No critical issues identified.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "sections" && (
          <div className="space-y-6">
            {/* Resume Sections */}
            {data?.resume_sections?.map((section: any, index: number) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {section.section_name}
                    </CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          section.score >= 70
                            ? "bg-green-100 text-green-800"
                            : section.score >= 50
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }
                      >
                        {section.score}/100
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p
                    className={`mb-4 italic ${getRoastTextColor(
                      section.score
                    )}`}
                  >
                    "{section.roast}"
                  </p>

                  {section.issues?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-red-600 mb-2">
                        Issues:
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {section.issues.map(
                          (issue: string, issueIndex: number) => (
                            <li
                              key={issueIndex}
                              className="text-sm text-red-700"
                            >
                              {issue}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {section.strengths?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-semibold text-green-600 mb-2">
                        Strengths:
                      </h4>
                      <ul className="list-disc list-inside space-y-1">
                        {section.strengths.map(
                          (strength: string, strengthIndex: number) => (
                            <li
                              key={strengthIndex}
                              className="text-sm text-green-700"
                            >
                              {strength}
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  )}

                  {section.improvements?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">
                        Improvements:
                      </h4>
                      <div className="space-y-3">
                        {section.improvements.map(
                          (improvement: any, impIndex: number) => (
                            <div
                              key={impIndex}
                              className="p-3 bg-blue-50 rounded-lg"
                            >
                              <p className="text-sm text-blue-900 font-medium">
                                {improvement.issue}
                              </p>
                              <p className="text-sm text-blue-800 mt-1">
                                {improvement.fix}
                              </p>
                              {improvement.example && (
                                <p className="text-sm text-blue-700 mt-1 italic">
                                  Example: {improvement.example}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Missing Sections */}
            {data?.missing_sections?.length > 0 && (
              <Card className="border-yellow-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-600">
                    <AlertTriangle className="h-5 w-5" />
                    Missing Sections
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {data.missing_sections.map(
                      (section: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 bg-yellow-50 rounded-lg"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold text-yellow-900">
                              {section.section_name}
                            </h4>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              {section.importance}
                            </Badge>
                          </div>
                          <p className="text-yellow-800 text-sm mb-2 italic">
                            "{section.roast}"
                          </p>
                          <p className="text-yellow-700 text-sm">
                            {section.recommendation}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "improvements" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Needs Work */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-orange-600">
                  <Lightbulb className="h-5 w-5" />
                  Areas for Improvement
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.needs_work?.length > 0 ? (
                  <div className="space-y-4">
                    {data.needs_work.map((item: any, index: number) => (
                      <div key={index} className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-semibold text-orange-900 mb-2">
                          {item.title}
                        </h4>
                        <p className="text-orange-800 text-sm mb-2 italic">
                          "{item.roast}"
                        </p>
                        <p className="text-orange-700 text-sm mb-2">
                          {item.issue}
                        </p>
                        <div className="mt-3 p-3 bg-white rounded border">
                          <p className="text-sm text-gray-700">
                            <strong>Fix:</strong> {item.fix}
                          </p>
                          {item.example && (
                            <p className="text-sm text-gray-600 mt-1">
                              <strong>Example:</strong> {item.example}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No improvement areas identified.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Keyword Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Target className="h-5 w-5" />
                  Keyword Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data?.keyword_analysis?.missing_keywords?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 mb-2">
                      Missing Keywords:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.keyword_analysis.missing_keywords.map(
                        (keyword: string, index: number) => (
                          <Badge
                            key={index}
                            className="bg-red-100 text-red-800"
                          >
                            {keyword}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {data?.keyword_analysis?.overused_buzzwords?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-yellow-600 mb-2">
                      Overused Buzzwords:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.keyword_analysis.overused_buzzwords.map(
                        (word: string, index: number) => (
                          <Badge
                            key={index}
                            className="bg-yellow-100 text-yellow-800"
                          >
                            {word}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}

                {data?.keyword_analysis?.weak_action_verbs?.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-2">
                      Weak Action Verbs:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {data.keyword_analysis.weak_action_verbs.map(
                        (verb: string, index: number) => (
                          <Badge
                            key={index}
                            className="bg-orange-100 text-orange-800"
                          >
                            {verb}
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "action-plan" && (
          <div className="space-y-8">
            {/* Immediate Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.action_plan?.immediate?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.action_plan.immediate.map(
                      (action: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 border-2 border-red-200 rounded-lg"
                        >
                          <div className="text-2xl mb-2">{action.icon}</div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {action.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {action.description}
                          </p>
                          <Badge className="bg-red-100 text-red-800">
                            {action.time_estimate}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No immediate actions required.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Long-term Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-600">
                  <Target className="h-5 w-5" />
                  Long-term Strategy
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.action_plan?.longTerm?.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {data.action_plan.longTerm.map(
                      (action: any, index: number) => (
                        <div
                          key={index}
                          className="p-4 border-2 border-blue-200 rounded-lg"
                        >
                          <div className="text-2xl mb-2">{action.icon}</div>
                          <h4 className="font-semibold text-gray-900 mb-2">
                            {action.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-3">
                            {action.description}
                          </p>
                          <Badge className="bg-blue-100 text-blue-800">
                            {action.time_estimate}
                          </Badge>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">
                    No long-term actions required.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shareable Roasts */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.shareable_roasts?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.shareable_roasts.map((roast: any, index: number) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900 mb-2">
                      {roast.category}
                    </p>
                    <p className="text-sm text-gray-700 mb-3 italic">
                      "{roast.text}"
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        navigator.clipboard.writeText(roast.shareText)
                      }
                    >
                      Copy Share Text
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No shareable content available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
