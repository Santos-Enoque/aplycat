"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  HelpCircle,
  Wand2,
} from "lucide-react";
import { LinkedInAnalysis } from "@/lib/schemas/linkedin-analysis-schema";
import { Button } from "@/components/ui/button";

interface StreamingLinkedInAnalysisDisplayProps {
  analysis: LinkedInAnalysis | null;
  status: "idle" | "connecting" | "streaming" | "completed" | "error";
  profileUrl: string;
}

const SectionSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-24" />
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <Skeleton className="h-4 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export function StreamingLinkedInAnalysisDisplay({
  analysis,
  status,
  profileUrl,
}: StreamingLinkedInAnalysisDisplayProps) {
  const router = useRouter();

  const handleImprove = () => {
    if (analysis) {
      const improvementContext = {
        analysis,
        profileUrl,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(
        "linkedinImprovementContext",
        JSON.stringify(improvementContext)
      );
      router.push("/linkedin/improve");
    }
  };

  if (status !== "streaming" && status !== "completed") {
    // This part shows a loading state before the stream begins.
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-2/3" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-3">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  const getStrengthColor = (strength?: string) => {
    switch (strength?.toLowerCase()) {
      case "all-star":
        return "bg-green-600";
      case "solid":
        return "bg-blue-600";
      case "needs major help":
        return "bg-orange-500";
      case "invisible":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  const getRatingColor = (rating?: string) => {
    switch (rating?.toLowerCase()) {
      case "all-star":
        return "bg-green-100 text-green-800";
      case "solid":
        return "bg-blue-100 text-blue-800";
      case "needs major help":
        return "bg-orange-100 text-orange-800";
      case "invisible":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPotentialColor = (potential?: string) => {
    switch (potential?.toLowerCase()) {
      case "very high":
        return "text-green-600";
      case "high":
        return "text-emerald-600";
      case "medium":
        return "text-amber-600";
      case "low":
        return "text-red-600";
      default:
        return "text-gray-500";
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Action Button */}
      {/* {status === "completed" && (
        <div className="text-center">
          <Button size="lg" onClick={handleImprove}>
            <Wand2 className="mr-2 h-5 w-5" />
            Improve with AI
          </Button>
        </div>
      )} */}

      {/* Basic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Profile Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis?.overall_score === undefined ? (
              <Skeleton className="h-10 w-3/4" />
            ) : (
              <div className="flex items-baseline space-x-2">
                <div className="text-3xl font-bold text-foreground">
                  {analysis.overall_score}
                  <span className="text-xl text-muted-foreground">/100</span>
                </div>
              </div>
            )}
            <Progress
              value={analysis?.overall_score || 0}
              className={`h-2 mt-2 ${getStrengthColor(
                analysis?.profile_strength
              )}`}
            />
            {analysis?.profile_strength && (
              <Badge
                className={`mt-2 ${getStrengthColor(
                  analysis.profile_strength
                )} text-white`}
              >
                {analysis.profile_strength}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-primary">
              The Main Roast
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start space-x-3">
              <Target className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              {analysis?.main_roast ? (
                <p className="text-sm font-semibold text-black">
                  &ldquo;{analysis.main_roast}&rdquo;
                </p>
              ) : (
                <Skeleton className="h-5 w-full" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Potential & Missing Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3 flex-row items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Improvement Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis?.improvement_potential ? (
              <p
                className={`text-2xl font-bold ${getPotentialColor(
                  analysis.improvement_potential
                )}`}
              >
                {analysis.improvement_potential}
              </p>
            ) : (
              <Skeleton className="h-8 w-1/2" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3 flex-row items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-muted-foreground" />
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Missing Sections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysis?.missing_sections === undefined ? (
              <Skeleton className="h-5 w-full" />
            ) : analysis.missing_sections.length > 0 ? (
              <ul className="space-y-2">
                {analysis.missing_sections.map((section, i) => (
                  <li key={i} className="text-sm font-medium">
                    <span className="font-bold">{section.section_name}</span>:{" "}
                    <span className="text-muted-foreground italic">
                      &ldquo;{section.roast}&rdquo;
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Great! No critical sections are missing.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Section Analysis */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Section-by-Section Breakdown
        </h2>

        {analysis?.profile_sections === undefined &&
          status !== "completed" &&
          [...Array(3)].map((_, i) => <SectionSkeleton key={i} />)}

        {analysis?.profile_sections?.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">
                  {section.section_name}
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <Badge className={getRatingColor(section.rating)}>
                    {section.rating}
                  </Badge>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground">
                      {section.score}
                    </div>
                    <Progress value={section.score} className="w-20 h-2" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-foreground italic">
                &ldquo;{section.roast}&rdquo;
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t">
                {section.good_things.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      What Works
                    </h4>
                    <ul className="space-y-2">
                      {section.good_things.map((good: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-foreground flex items-start"
                        >
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 shrink-0"></span>
                          {good}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.issues_found.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-orange-600 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Issues Found
                    </h4>
                    <ul className="space-y-2">
                      {section.issues_found.map((issue: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-foreground flex items-start"
                        >
                          <span className="w-2 h-2 bg-orange-500 rounded-full mt-1.5 mr-2 shrink-0"></span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {section.quick_fixes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Fixes
                    </h4>
                    <ul className="space-y-2">
                      {section.quick_fixes.map((fix: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-foreground flex items-start"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 shrink-0"></span>
                          {fix}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
