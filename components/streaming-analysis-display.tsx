"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Zap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  FileText,
  Linkedin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeAnalysis, ResumeSection } from "@/types/analysis";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useCreditsModal } from "@/hooks/use-credits-modal";

interface StreamingAnalysisDisplayProps {
  analysis: Partial<ResumeAnalysis> | null;
  status: "idle" | "connecting" | "streaming" | "completed" | "error";
  onStartImprovement: () => void;
}

const SectionSkeleton = () => (
  <Card>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    </CardHeader>
    <CardContent className="space-y-6">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

export function StreamingAnalysisDisplay({
  analysis,
  status,
  onStartImprovement,
}: StreamingAnalysisDisplayProps) {
  const { openModal } = useCreditsModal();
  const { credits, isLoading: isLoadingCredits } = useUserCredits();

  const handleStartImprovementClick = () => {
    if (isLoadingCredits || credits === null || credits === undefined) {
      // Credits are still loading or not available
      return;
    }
    if (credits <= 0) {
      openModal(1); // Assuming improvement costs at least 1 credit
    } else {
      onStartImprovement();
    }
  };

  if (status === "idle" || status === "connecting" || !analysis) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-12" />
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-6 w-1/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>
        <SectionSkeleton />
        <SectionSkeleton />
      </div>
    );
  }

  const analysisData = {
    overallScore: analysis.overall_score || 0,
    atsScore: analysis.ats_score || 0,
    category: analysis.score_category || "Needs Improvement",
    improvementPotential: analysis.improvement_potential,
    keyInsight:
      analysis.main_roast ||
      "The analysis is still in progress, but key insights will appear here soon.",
    sections: (analysis.resume_sections || []).map(
      (section: ResumeSection) => ({
        name: section.section_name,
        rating: section.rating || "Fair",
        score: section.score || 0,
        analysis: section.roast || "...",
        issues:
          (section as any).areas_for_improvement || section.issues_found || [],
        goodThings: section.good_things || [],
        quickFixes: section.quick_fixes || [],
      })
    ),
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "excellent":
        return "bg-green-600";
      case "good":
        return "bg-blue-600";
      default:
        return "bg-red-600";
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating.toLowerCase()) {
      case "strong":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-red-100 text-red-800";
    }
  };

  const isComplete = status === "completed";

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Basic Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-foreground">
                {analysisData.overallScore}
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
              <div
                className={`flex-1 ${
                  analysis.overall_score === undefined && "animate-pulse"
                }`}
              >
                <Progress
                  value={analysisData.overallScore}
                  className={`h-2 ${getCategoryColor(analysisData.category)}`}
                />
              </div>
            </div>
            {analysis.overall_score !== undefined && (
              <Badge
                className={`mt-2 ${getCategoryColor(
                  analysisData.category
                )} text-primary-foreground`}
              >
                {analysisData.category}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              ATS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-foreground">
                {analysisData.atsScore}
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
              <div
                className={`flex-1 ${
                  analysis.ats_score === undefined && "animate-pulse"
                }`}
              >
                <Progress value={analysisData.atsScore} className="h-2" />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              ATS-friendly format
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-primary">
              Improvement Potential
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-primary" />
              {analysisData.improvementPotential ? (
                <div>
                  <div className="text-2xl font-bold text-primary">
                    +{analysisData.improvementPotential.points_possible}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    points possible
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-12" />
                  <Skeleton className="h-4 w-24" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Insight */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-primary" />
            <CardTitle>Key Insight</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-foreground">{analysisData.keyInsight}</p>
        </CardContent>
      </Card>

      {/* Upsell Card */}
      {isComplete && (
        <Card className="border-primary bg-gradient-to-r from-primary/10 to-purple-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-1">
                  Ready to improve your resume?
                </h3>
                <p className="text-muted-foreground text-sm">
                  Get AI-powered improvements, rewritten sections, and a
                  professionally optimized resume.
                </p>
              </div>
              <Button
                onClick={handleStartImprovementClick}
                className="bg-primary hover:bg-primary/90"
                disabled={isLoadingCredits}
              >
                <Zap className="w-4 h-4 mr-2" />
                Improve with AI
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Analysis */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          Section-by-Section Analysis
        </h2>

        {status !== "completed" &&
          analysisData.sections.length === 0 &&
          [...Array(3)].map((_, i) => <SectionSkeleton key={i} />)}

        {analysisData.sections.map((section, index) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{section.name}</CardTitle>
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
              <p className="text-foreground">{section.analysis}</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Issues */}
                {section.issues.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-red-600 mb-3 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Issues Found
                    </h4>
                    <ul className="space-y-2">
                      {section.issues.map((issue: string, i: number) => (
                        <li
                          key={i}
                          className="text-sm text-foreground flex items-start"
                        >
                          <span className="w-2 h-2 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Good Things */}
                {section.goodThings.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-green-600 mb-3 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      What We Liked
                    </h4>
                    <ul className="space-y-2">
                      {section.goodThings.map((good, i) => (
                        <li
                          key={i}
                          className="text-sm text-foreground flex items-start"
                        >
                          <span className="w-2 h-2 bg-green-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                          {good}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Quick Fixes */}
                {section.quickFixes.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-blue-600 mb-3 flex items-center">
                      <Zap className="w-4 h-4 mr-2" />
                      Quick Fixes
                    </h4>
                    <ul className="space-y-2">
                      {section.quickFixes.map((fix, i) => (
                        <li
                          key={i}
                          className="text-sm text-foreground flex items-start"
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
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

      {/* Bottom CTA */}
      {isComplete && (
        <Card className="border-primary bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              Ready to fix your resume?
            </h3>
            <p className="text-primary-foreground/80 mb-6">
              Let our AI rewrite your resume sections, optimize for ATS, and
              create multiple versions for different roles.
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStartImprovementClick}
              disabled={isLoadingCredits}
            >
              <Zap className="w-5 h-5 mr-2" />
              Improve with AI - 2 Credits
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
