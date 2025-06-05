"use client";

import { useImprovements } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sparkles,
  Eye,
  Download,
  Calendar,
  FileText,
  Target,
  TrendingUp,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export function CachedImprovementsPage() {
  const {
    data: improvementsData,
    isLoading,
    error,
    isError,
  } = useImprovements();

  if (isLoading) {
    return <ImprovementsLoadingSkeleton />;
  }

  if (isError || !improvementsData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to load improvements
            </h3>
            <p className="text-gray-600">
              {error?.message || "Please try refreshing the page"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { improvements, total } = improvementsData;

  const getScoreColor = (score: number | null) => {
    if (!score) return "text-gray-600";
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    if (score >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (score: number | null) => {
    if (!score) return "bg-gray-100 text-gray-800";
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 60) return "bg-yellow-100 text-yellow-800";
    if (score >= 40) return "bg-orange-100 text-orange-800";
    return "bg-red-100 text-red-800";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Improvements
          </h1>
          <p className="text-gray-600 mt-1">
            View all your improved resume versions and download them
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-green-100 text-green-800">
            {total} {total === 1 ? "improvement" : "improvements"}
          </Badge>
          <Link href="/dashboard">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Improvement
            </Button>
          </Link>
        </div>
      </div>

      {/* Improvements Grid */}
      {improvements.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {improvements.map((improvement) => (
            <Card
              key={improvement.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {improvement.versionName ||
                        `Version ${improvement.version}`}
                    </CardTitle>
                    <p className="text-sm text-gray-600 mb-2">
                      {improvement.resume.fileName}
                    </p>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline" className="text-xs">
                        <Target className="h-3 w-3 mr-1" />
                        {improvement.targetRole}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {improvement.targetIndustry}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {improvement.improvedScore && (
                      <Badge
                        className={getScoreBadgeColor(
                          improvement.improvedScore
                        )}
                      >
                        {improvement.improvedScore}/100
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs">
                      v{improvement.version}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Score Improvement */}
                  {improvement.originalScore && improvement.improvedScore && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-green-900">
                          Score Improvement
                        </span>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`text-sm ${getScoreColor(
                            improvement.originalScore
                          )}`}
                        >
                          {improvement.originalScore}
                        </span>
                        <span className="text-gray-400">→</span>
                        <span
                          className={`text-sm font-semibold ${getScoreColor(
                            improvement.improvedScore
                          )}`}
                        >
                          {improvement.improvedScore}
                        </span>
                        <Badge className="bg-green-100 text-green-800 text-xs ml-2">
                          +
                          {improvement.improvedScore -
                            improvement.originalScore}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Summary */}
                  {improvement.improvementSummary && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-900 italic">
                        "{improvement.improvementSummary}"
                      </p>
                    </div>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="h-3 w-3" />
                    <span>
                      Created{" "}
                      {formatDistanceToNow(new Date(improvement.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Link
                      href={`/improved-resume/${improvement.id}`}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // TODO: Implement download functionality
                        console.log("Download improvement:", improvement.id);
                      }}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Sparkles className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No improvements yet
            </h3>
            <p className="text-gray-600 mb-6">
              Analyze a resume first, then create improved versions tailored for
              specific roles!
            </p>
            <Link href="/dashboard">
              <Button className="bg-green-600 hover:bg-green-700">
                <FileText className="h-4 w-4 mr-2" />
                Upload & Analyze Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ImprovementsLoadingSkeleton() {
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
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4" />
                  </div>
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <Skeleton className="h-4 w-full" />
                </div>
                <Skeleton className="h-3 w-32" />
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
