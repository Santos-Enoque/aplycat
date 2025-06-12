"use client";

import { useAnalyses } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart3,
  Calendar,
  Eye,
  FileText,
  TrendingUp,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function CachedAnalysesPage() {
  const { data: analysesData, isLoading, error, isError } = useAnalyses();
  const t = useTranslations("cachedAnalyses");
  const tAnalysis = useTranslations("analysisDisplay");

  if (isLoading) {
    return <AnalysesLoadingSkeleton />;
  }

  if (isError || !analysesData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("error.title")}
            </h3>
            <p className="text-gray-600">
              {error?.message || t("error.fallbackMessage")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { analyses, total } = analysesData;

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    if (score >= 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  const getCategoryBadgeColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
      case "excellent":
        return "bg-green-100 text-green-800";
      case "good":
        return "bg-blue-100 text-blue-800";
      case "fair":
        return "bg-yellow-100 text-yellow-800";
      case "poor":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getCategoryTranslation = (category: string) => {
    const normalizedCategory = category.toLowerCase().replace(/\s+/g, "");
    switch (normalizedCategory) {
      case "excellent":
        return tAnalysis("categories.excellent");
      case "good":
        return tAnalysis("categories.good");
      case "needswork":
        return tAnalysis("categories.needsWork");
      case "needsimprovement":
        return tAnalysis("categories.needsImprovement");
      case "critical":
        return tAnalysis("categories.critical");
      case "poor":
        return tAnalysis("categories.poor");
      default:
        return category; // fallback to original if no translation found
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            {t("title")}
          </h1>
          <p className="text-gray-600 mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800">
            {t("analysisCount", { count: total })}
          </Badge>
          <Link href="/dashboard">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              {t("newAnalysis")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Analyses Grid */}
      {analyses.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {analyses.map((analysis: any) => (
            <Card
              key={analysis.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {analysis.fileName}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {t("analyzed")}{" "}
                        {formatDistanceToNow(new Date(analysis.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge
                      className={getScoreBadgeColor(analysis.overallScore)}
                    >
                      {analysis.overallScore}/100
                    </Badge>
                    {analysis.scoreCategory && (
                      <Badge
                        variant="outline"
                        className={`text-xs ${getCategoryBadgeColor(
                          analysis.scoreCategory
                        )}`}
                      >
                        {getCategoryTranslation(analysis.scoreCategory)}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Scores */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-blue-900">
                          {tAnalysis("scores.overallScore")}
                        </span>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div
                        className={`text-xl font-bold ${getScoreColor(
                          analysis.overallScore
                        )}`}
                      >
                        {analysis.overallScore}
                      </div>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-purple-900">
                          {tAnalysis("scores.atsScore")}
                        </span>
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                      <div
                        className={`text-xl font-bold ${getScoreColor(
                          analysis.atsScore
                        )}`}
                      >
                        {analysis.atsScore}
                      </div>
                    </div>
                  </div>

                  {/* Main Roast */}
                  {analysis.mainRoast && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-900 italic">
                        "{analysis.mainRoast}"
                      </p>
                    </div>
                  )}

                  {/* Processing Time */}
                  {analysis.processingTimeMs && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{t("processingTime")}</span>
                      <span>
                        {(analysis.processingTimeMs / 1000).toFixed(1)}s
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link
                      href={`/analyze?analysisId=${analysis.id}`}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        {t("viewDetails")}
                      </Button>
                    </Link>
                    <Link
                      href={`/improve?analysisId=${analysis.id}`}
                      className="flex-1"
                    >
                      <Button size="sm" variant="outline" className="w-full">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {t("improve")}
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("noAnalyses.title")}
            </h3>
            <p className="text-gray-600 mb-6">{t("noAnalyses.description")}</p>
            <Link href="/dashboard">
              <Button className="bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4 mr-2" />
                {t("noAnalyses.button")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AnalysesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 w-full" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
