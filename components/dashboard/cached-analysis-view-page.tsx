"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  BarChart3,
  TrendingUp,
  Calendar,
  ArrowLeft,
  Download,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface Analysis {
  id: string;
  fileName: string;
  overallScore: number;
  atsScore: number;
  scoreCategory: string;
  mainRoast: string;
  creditsUsed: number;
  createdAt: string;
  updatedAt: string;
  analysisData: any;
  resume: {
    id: string;
    fileName: string;
    title: string;
    fileUrl: string;
    storageType: string;
  } | null;
  improvementsCount: number;
  scoreGrade: string;
  hasImprovements: boolean;
}

interface AnalysisViewPageProps {
  analysisId: string;
}

export function CachedAnalysisViewPage({ analysisId }: AnalysisViewPageProps) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/analyses/${analysisId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Analysis not found");
          }
          throw new Error("Failed to load analysis");
        }

        const data = await response.json();
        if (data.success) {
          setAnalysis(data.analysis);
        } else {
          throw new Error(data.error || "Failed to load analysis");
        }
      } catch (err) {
        console.error("Error fetching analysis:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    if (analysisId) {
      fetchAnalysis();
    }
  }, [analysisId]);

  if (isLoading) {
    return <AnalysisLoadingSkeleton />;
  }

  if (error || !analysis) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to load analysis
            </h3>
            <p className="text-gray-600 mb-4">
              {error || "Analysis not found"}
            </p>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
              <Link href="/dashboard/resumes">
                <Button>
                  <FileText className="h-4 w-4 mr-2" />
                  View Resumes
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadgeColor = (grade: string) => {
    switch (grade) {
      case "excellent": return "bg-green-100 text-green-800";
      case "good": return "bg-blue-100 text-blue-800";
      case "fair": return "bg-yellow-100 text-yellow-800";
      default: return "bg-red-100 text-red-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Resume Analysis
            </h1>
            <p className="text-gray-600 mt-1">
              {analysis.fileName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800">
            <Calendar className="h-3 w-3 mr-1" />
            {formatDistanceToNow(new Date(analysis.createdAt), { addSuffix: true })}
          </Badge>
          {analysis.resume && (
            <Button variant="outline" size="sm" asChild>
              <a
                href={`/api/resumes/${analysis.resume.id}/download`}
                download={analysis.resume.fileName}
              >
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overall Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.overallScore)}`}>
                {analysis.overallScore}
              </div>
              <div>
                <Badge className={getScoreBadgeColor(analysis.scoreGrade)}>
                  {analysis.scoreGrade}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              ATS Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${getScoreColor(analysis.atsScore)}`}>
                {analysis.atsScore}
              </div>
              <div className="text-sm text-gray-500">
                / 100
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">
              Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold text-gray-900">
              {analysis.scoreCategory}
            </div>
            {analysis.hasImprovements && (
              <div className="flex items-center gap-1 text-sm text-green-600 mt-1">
                <Sparkles className="h-3 w-3" />
                {analysis.improvementsCount} improvements available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Feedback */}
      {analysis.mainRoast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-500" />
              Main Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700 leading-relaxed">
              {analysis.mainRoast}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Detailed Analysis */}
      {analysis.analysisData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Detailed Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnalysisDataRenderer data={analysis.analysisData} />
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Link href={`/analyze?resumeId=${analysis.resume?.id}&fileName=${encodeURIComponent(analysis.fileName)}`}>
          <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Re-analyze Resume
          </Button>
        </Link>
        
        {analysis.resume && (
          <Link href={`/improve?resumeId=${analysis.resume.id}&analysisId=${analysis.id}`}>
            <Button variant="outline" className="w-full sm:w-auto">
              <Sparkles className="h-4 w-4 mr-2" />
              Improve Resume
            </Button>
          </Link>
        )}

        <Link href="/dashboard/resumes">
          <Button variant="outline" className="w-full sm:w-auto">
            <FileText className="h-4 w-4 mr-2" />
            Back to Resumes
          </Button>
        </Link>
      </div>
    </div>
  );
}

function AnalysisDataRenderer({ data }: { data: any }) {
  if (!data) {
    return (
      <p className="text-gray-600">
        No detailed analysis data available.
      </p>
    );
  }

  // Handle different analysis data structures
  if (typeof data === 'string') {
    return (
      <div className="prose max-w-none">
        <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded-lg">
          {data}
        </pre>
      </div>
    );
  }

  if (typeof data === 'object') {
    return (
      <div className="space-y-4">
        {/* Render structured analysis data */}
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="border-l-4 border-blue-200 pl-4">
            <h4 className="font-semibold text-gray-900 capitalize mb-2">
              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
            </h4>
            <div className="text-gray-700">
              {typeof value === 'string' ? (
                <p className="leading-relaxed">{value}</p>
              ) : Array.isArray(value) ? (
                <ul className="list-disc list-inside space-y-1">
                  {value.map((item, index) => (
                    <li key={index} className="text-sm">
                      {typeof item === 'string' ? item : JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              ) : (
                <pre className="text-xs bg-gray-50 p-2 rounded">
                  {JSON.stringify(value, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

function AnalysisLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-20" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Score Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-3">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions Skeleton */}
      <div className="flex gap-4">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-36" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}