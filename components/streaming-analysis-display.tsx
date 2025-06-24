"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target,
  Zap,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResumeAnalysis, ResumeSection } from "@/types/analysis";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useCreditsModal } from "@/hooks/use-credits-modal";
import { AccordionSection } from "@/components/ui/accordion-section";
import { useState, useEffect, useRef, memo } from "react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

interface StreamingAnalysisDisplayProps {
  analysis: Partial<ResumeAnalysis> | null;
  status: "idle" | "connecting" | "streaming" | "completed" | "error";
  onStartImprovement: () => void;
  isAnonymous?: boolean;
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
  isAnonymous = false,
}: StreamingAnalysisDisplayProps) {
  const { openModal } = useCreditsModal();
  const { credits, isLoading: isLoadingCredits } = useUserCredits();
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);
  const t = useTranslations("analysisDisplay");

  const [displayedAnalysis, setDisplayedAnalysis] =
    useState<Partial<ResumeAnalysis> | null>(analysis);
  const analysisRef = useRef(analysis);
  const throttleTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    analysisRef.current = analysis;

    if (status === "streaming" && !throttleTimeoutRef.current) {
      throttleTimeoutRef.current = setTimeout(() => {
        setDisplayedAnalysis(analysisRef.current);
        throttleTimeoutRef.current = null;
      }, 500); // Update display every 500ms
    } else if (status === "completed") {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
      setDisplayedAnalysis(analysis);
    }

    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, [analysis, status]);

  const handleStartImprovementClick = () => {
    if (isAnonymous) {
      onStartImprovement();
      return;
    }

    if (isLoadingCredits || credits === null || credits === undefined) {
      // Credits are still loading or not available for a logged-in user
      toast.info(t("loading.creditsMessage"));
      return;
    }
    if (credits <= 0) {
      openModal(1); // Assuming improvement costs at least 1 credit
    } else {
      onStartImprovement();
    }
  };

  if (status === "idle" || status === "connecting" || !displayedAnalysis) {
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
    overallScore: displayedAnalysis.overall_score || 0,
    atsScore: displayedAnalysis.ats_score || 0,
    category: displayedAnalysis.score_category || "Needs Improvement",
    improvementPotential: displayedAnalysis.improvement_potential,
    keyInsight:
      displayedAnalysis.main_roast ||
      "The analysis is still in progress, but key insights will appear here soon.",
    sections: (analysis?.resume_sections || []).map(
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

  const getCategoryTranslation = (category: string) => {
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, "");
    switch (normalizedCategory) {
      case "excellent":
        return t("categories.excellent");
      case "good":
        return t("categories.good");
      case "needswork":
        return t("categories.needsWork");
      case "needsimprovement":
        return t("categories.needsImprovement");
      case "critical":
        return t("categories.critical");
      case "poor":
        return t("categories.poor");
      default:
        return category; // fallback to original if no translation found
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
              {t("scores.overallScore")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-foreground">
                {analysisData.overallScore}
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
            </div>
            {displayedAnalysis.overall_score !== undefined && (
              <Badge
                className={`mt-2 ${getCategoryColor(
                  analysisData.category
                )} text-primary-foreground`}
              >
                {getCategoryTranslation(analysisData.category)}
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("scores.atsScore")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline space-x-2">
              <div className="text-3xl font-bold text-foreground">
                {analysisData.atsScore}
                <span className="text-xl text-muted-foreground">/100</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {t("scores.atsFormat")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-primary">
              {t("scores.improvementPotential")}
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
                    {t("scores.pointsPossible")}
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
            <CardTitle>{t("keyInsight")}</CardTitle>
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
                  {t("improvement.readyTitle")}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {t("improvement.readyDescription")}
                </p>
              </div>
              <Button
                onClick={handleStartImprovementClick}
                className="bg-primary hover:bg-primary/90"
                disabled={isLoadingCredits}
              >
                <Zap className="w-4 h-4 mr-2" />
                {t("improvement.improveButton")}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Analysis */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-foreground">
          {t("sectionAnalysis.title")}
        </h2>

        {status !== "completed" &&
          analysisData.sections.length === 0 &&
          [...Array(3)].map((_, i) => <SectionSkeleton key={i} />)}

        <div className="space-y-3">
          {analysisData.sections.map((section, index) => (
            <AccordionSection
              key={index}
              section={{
                section_name: section.name,
                score: section.score,
                rating: section.rating,
                roast: section.analysis,
                good_things: section.goodThings,
                issues_found: section.issues,
                quick_fixes: section.quickFixes,
              }}
              isOpen={openAccordion === section.name}
              onToggle={() =>
                setOpenAccordion(
                  openAccordion === section.name ? null : section.name
                )
              }
            />
          ))}

          {/* Show blurred sections for anonymous users with limited data */}
          {(displayedAnalysis as any)?.is_limited &&
            (displayedAnalysis as any)?.hidden_sections_count > 0 && (
              <div className="relative">
                {/* Blur overlay with upgrade prompt */}
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent z-10 flex flex-col items-center justify-end p-6 text-center">
                  <Button onClick={handleStartImprovementClick} size="lg">
                    {t("upgrade.button", {
                      count: (displayedAnalysis as any).hidden_sections_count,
                    })}
                  </Button>
                </div>
                <div className="blur-sm opacity-60 pointer-events-none select-none">
                  {[...Array((displayedAnalysis as any).hidden_sections_count || 2)].map(
                    (_, i) => (
                      <div
                        key={`blurred-${i}`}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div className="p-4 bg-gray-100 border-b flex items-center justify-between">
                          <div className="h-5 bg-gray-300 rounded w-32"></div>
                          <div className="flex items-center gap-2">
                            <div className="h-6 bg-gray-300 rounded w-16"></div>
                            <div className="h-5 bg-gray-300 rounded w-12"></div>
                          </div>
                        </div>
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                          <div className="space-y-1">
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
        </div>
      </div>

      {/* Bottom CTA */}
      {isComplete && (
        <Card className="border-primary bg-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">
              {t("improvement.fixTitle")}
            </h3>
            <p className="text-primary-foreground/80 mb-6">
              {t("improvement.fixDescription")}
            </p>
            <Button
              size="lg"
              variant="secondary"
              onClick={handleStartImprovementClick}
              disabled={isLoadingCredits}
            >
              <Zap className="w-5 h-5 mr-2" />
              {t("improvement.improveCredits")}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
