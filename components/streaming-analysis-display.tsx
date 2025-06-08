"use client";

import { ResumeAnalysis } from "@/lib/models-streaming";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Wand2,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface StreamingAnalysisDisplayProps {
  analysis: any | null;
  status: "idle" | "connecting" | "streaming" | "completed" | "error";
}

const SectionSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-6 w-2/3" />
    </CardHeader>
    <CardContent className="space-y-4">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-2 gap-4 pt-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    </CardContent>
  </Card>
);

export function StreamingAnalysisDisplay({
  analysis,
  status,
}: StreamingAnalysisDisplayProps) {
  if (status === "idle" || status === "connecting" || !analysis) {
    // Show a set of skeletons on initial load
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Skeleton className="h-16 w-full" />
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score > 85) return "text-green-600";
    if (score > 70) return "text-blue-600";
    if (score > 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getBadgeVariant = (category: string | undefined) => {
    switch (category) {
      case "Excellent":
        return "default";
      case "Good":
        return "secondary";
      default:
        return "destructive";
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Scores Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.overall_score !== undefined ? (
              <div
                className={`text-3xl font-bold ${getScoreColor(
                  analysis.overall_score
                )}`}
              >
                {analysis.overall_score}/100
              </div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ATS Score</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.ats_score !== undefined ? (
              <div
                className={`text-3xl font-bold ${getScoreColor(
                  analysis.ats_score
                )}`}
              >
                {analysis.ats_score}/100
              </div>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analysis.score_category ? (
              <Badge
                variant={getBadgeVariant(analysis.score_category)}
                className="text-lg"
              >
                {analysis.score_category}
              </Badge>
            ) : (
              <Skeleton className="h-8 w-24" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Roast */}
      {analysis.main_roast ? (
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-orange-800">
              <Star className="w-5 h-5" />
              <span>Key Insight</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-orange-900 font-medium text-lg">
              {analysis.main_roast}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      )}

      {/* Detailed Sections */}
      <div className="space-y-6">
        {analysis.resume_sections ? (
          analysis.resume_sections.map((section, index) => (
            <Card key={index} className="overflow-hidden">
              <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4 border-b">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold">
                    {section.section_name}
                  </span>
                  <Badge
                    variant={getBadgeVariant(section.rating)}
                    className="text-sm"
                  >
                    {section.rating} ({section.score}/100)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="p-3 bg-red-50 border-red-200 rounded-lg">
                  <p className="font-semibold text-red-800">🔥 The Roast:</p>
                  <p className="text-red-700 italic">"{section.roast}"</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <ThumbsUp className="w-5 h-5 mr-2 text-green-600" />
                      What's Good
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {section.good_things.map((item, i) => (
                        <li key={`good-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center">
                      <ThumbsDown className="w-5 h-5 mr-2 text-yellow-600" />
                      Areas for Improvement
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {section.issues_found.map((item, i) => (
                        <li key={`issue-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                {section.quick_fixes.length > 0 && (
                  <div className="space-y-2 pt-2 border-t mt-4">
                    <h4 className="font-semibold flex items-center">
                      <Wand2 className="w-5 h-5 mr-2 text-blue-600" />
                      Quick Fixes
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      {section.quick_fixes.map((item, i) => (
                        <li key={`fix-${i}`}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <SectionSkeleton />
            <SectionSkeleton />
            <SectionSkeleton />
          </>
        )}
      </div>
    </div>
  );
}
