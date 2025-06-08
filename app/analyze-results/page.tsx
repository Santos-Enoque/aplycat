"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Download,
  RotateCcw,
  TrendingUp,
  Target,
  FileText,
  Star,
  ThumbsUp,
  ThumbsDown,
  Wand2,
} from "lucide-react";
import { AnalysisCard } from "@/components/analysis-card";

interface AnalysisData {
  success: boolean;
  analysis: any;
  fileName: string;
  processingTimeMs: number;
  timestamp: string;
  parseStrategy?: string;
  mode: string;
  message?: string;
}

function AnalyzeResultsContent() {
  const searchParams = useSearchParams();
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalysisData = () => {
      try {
        const directAnalysis = sessionStorage.getItem(
          "aplycat_direct_analysis"
        );

        if (directAnalysis) {
          const data = JSON.parse(directAnalysis);
          // Log the full analysis data to the console as requested
          console.log("[RESULTS] Full analysis data from API:", data);
          setAnalysisData(data);
          // Do not remove the item from sessionStorage to prevent issues with React StrictMode
        } else {
          // If no data in session storage, show an error.
          setError(
            "Analysis results were lost. This can happen if you refresh the page. Please upload your resume again for a new analysis."
          );
        }
      } catch (e) {
        console.error("[RESULTS] Error loading or parsing analysis data:", e);
        setError(
          "Failed to load analysis results. The data might be corrupted."
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalysisData();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700">
            Loading Analysis Results...
          </h2>
        </div>
      </div>
    );
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-8 text-center">
                <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-red-800 mb-2">
                  Analysis Not Found
                </h2>
                <p className="text-red-700 mb-4">
                  {error || "Analysis data is missing."}
                </p>
                <Button
                  onClick={() => (window.location.href = "/analyze-direct")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Upload New Resume
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const analysis = analysisData.analysis;
  const processingTime = (analysisData.processingTimeMs / 1000).toFixed(1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <h1 className="text-3xl font-bold text-gray-900">
                Analysis Complete!
              </h1>
            </div>
            <div className="space-y-2">
              <p className="text-gray-600">
                <FileText className="w-4 h-4 inline mr-1" />
                {analysisData.fileName}
              </p>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <span className="flex items-center">
                  <Zap className="w-4 h-4 mr-1" />
                  {analysisData.mode === "direct"
                    ? "Direct Processing"
                    : "Standard Processing"}
                </span>
                <span className="flex items-center">
                  <Clock className="w-4 h-4 mr-1" />
                  {processingTime}s
                </span>
                <span>{new Date(analysisData.timestamp).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Success Message for Direct Mode */}
          {analysisData.mode === "direct" && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-800">
                      ⚡ Lightning Fast Analysis Complete!
                    </p>
                    <p className="text-green-700 text-sm">
                      {analysisData.message ||
                        "Your resume was analyzed directly without file upload delays"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Scores Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl font-bold text-blue-600">
                    {analysis.overall_score || 0}/100
                  </div>
                  <Progress
                    value={analysis.overall_score || 0}
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  ATS Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-3">
                  <div className="text-3xl font-bold text-green-600">
                    {analysis.ats_score || 0}/100
                  </div>
                  <Progress
                    value={analysis.ats_score || 0}
                    className="flex-1"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge
                  variant={
                    analysis.score_category === "Excellent"
                      ? "default"
                      : analysis.score_category === "Good"
                      ? "secondary"
                      : "destructive"
                  }
                  className="text-lg py-2 px-4"
                >
                  {analysis.score_category || "Unknown"}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Main Roast */}
          {analysis.main_roast && (
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
          )}

          {/* Detailed Resume Sections */}
          <div className="space-y-6">
            {analysis.resume_sections?.map((section: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-800 p-4 border-b">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-semibold">
                      {section.section_name}
                    </span>
                    <Badge
                      variant={
                        section.rating === "Excellent"
                          ? "default"
                          : section.rating === "Good"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-sm"
                    >
                      {section.rating} ({section.score}/100)
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  {section.roast && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="font-semibold text-red-800">
                        🔥 The Roast:
                      </p>
                      <p className="text-red-700 italic">"{section.roast}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-semibold flex items-center">
                        <ThumbsUp className="w-5 h-5 mr-2 text-green-600" />
                        What's Good
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-gray-700">
                        {section.good_things.map((item: string, i: number) => (
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
                        {section.issues_found.map((item: string, i: number) => (
                          <li key={`issue-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {section.quick_fixes && section.quick_fixes.length > 0 && (
                    <div className="space-y-2 pt-2 border-t mt-4">
                      <h4 className="font-semibold flex items-center">
                        <Wand2 className="w-5 h-5 mr-2 text-blue-600" />
                        Quick Fixes
                      </h4>
                      <ul className="list-disc list-inside space-y-1 text-blue-700">
                        {section.quick_fixes.map((item: string, i: number) => (
                          <li key={`fix-${i}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
            <Button
              onClick={() => (window.location.href = "/improve")}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Improve My Resume
            </Button>

            <Button
              onClick={() => (window.location.href = "/")}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Analyze Another Resume
            </Button>

            <Button onClick={() => window.print()} variant="outline" size="lg">
              <Download className="w-4 h-4 mr-2" />
              Save Results
            </Button>
          </div>

          {/* Performance Info */}
          <Card className="bg-gray-50">
            <CardContent className="p-4">
              <div className="text-center text-sm text-gray-600">
                <p>
                  Analysis completed in {processingTime} seconds using{" "}
                  <span className="font-semibold">
                    {analysisData.mode === "direct"
                      ? "Direct Processing"
                      : "Standard Processing"}
                  </span>
                  {analysisData.parseStrategy && (
                    <span> • Parse strategy: {analysisData.parseStrategy}</span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function AnalyzeResultsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">
              Loading Analysis Results...
            </h2>
          </div>
        </div>
      }
    >
      <AnalyzeResultsContent />
    </Suspense>
  );
}
