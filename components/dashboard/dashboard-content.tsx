"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/file-uploader";
import { AnalysisDetail } from "@/components/dashboard/analysis-detail";
import {
  Brain,
  Sparkles,
  Target,
  FileText,
  TrendingUp,
  Clock,
  CreditCard,
  Plus,
  Download,
  Eye,
  Zap,
  Star,
  Calendar,
  DollarSign,
  Users,
  Award,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface DashboardUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  credits: number;
  totalCreditsUsed: number;
  isPremium: boolean;
  createdAt: Date;
  resumes: Array<{
    id: string;
    fileName: string;
    title: string | null;
    createdAt: Date;
    analyses: Array<{
      id: string;
      overallScore: number;
      atsScore: number;
      mainRoast: string;
      createdAt: Date;
    }>;
    improvedResumes: Array<{
      id: string;
      targetRole: string;
      targetIndustry: string;
      version: number;
      versionName: string | null;
      createdAt: Date;
    }>;
  }>;
  analyses: Array<{
    id: string;
    fileName: string;
    overallScore: number;
    atsScore: number;
    mainRoast: string;
    scoreCategory: string;
    analysisData: any;
    creditsUsed: number;
    createdAt: Date;
    resume: {
      fileName: string;
      fileUrl: string;
    };
  }>;
  improvedResumes: Array<{
    id: string;
    targetRole: string;
    targetIndustry: string;
    version: number;
    versionName: string | null;
    creditsUsed: number;
    createdAt: Date;
    resume: {
      fileName: string;
    };
  }>;
  creditTransactions: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: Date;
  }>;
  subscriptions: Array<{
    id: string;
    planName: string;
    status: string;
    monthlyCredits: number;
  }>;
}

interface DashboardContentProps {
  user: DashboardUser;
}

export function DashboardContent({ user }: DashboardContentProps) {
  const router = useRouter();

  const handleFileSelected = async (file: File) => {
    toast.info("Preparing your analysis...", {
      description: "You will be redirected momentarily.",
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      sessionStorage.setItem(
        "streamingAnalysisFile",
        JSON.stringify({
          fileName: file.name,
          fileData: base64,
        })
      );
      router.push("/analyze");
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Could not read the selected file.", {
        description: "Please try a different file or refresh the page.",
      });
    };
  };

  const handleStartAnalysis = () => {
    // This could trigger the file upload dialog or navigate to a dedicated upload page
    const fileInput = document.querySelector(
      'input[type="file"]'
    ) as HTMLInputElement;
    fileInput?.click();
  };

  const handleStartImprovement = () => {
    // Check if user has existing resumes
    if (user.resumes.length === 0) {
      toast.error(
        "You need to analyze a resume first before you can improve it. Please upload and analyze a resume!"
      );
      handleStartAnalysis();
      return;
    }
    // Navigate to improve page or show modal to select existing resume
    router.push("/improve");
  };

  const handleStartTailoring = () => {
    // Check if user has existing resumes
    if (user.resumes.length === 0) {
      toast.error(
        "You need to analyze a resume first before you can tailor it. Please upload and analyze a resume!"
      );
      handleStartAnalysis();
      return;
    }
    // Navigate to tailor page or show modal
    router.push("/improve"); // Could be a separate tailor page
  };

  const handleViewAnalysis = (analysisId: string) => {
    // Navigate to analyze page with saved analysis ID
    const params = new URLSearchParams({
      analysisId: analysisId,
    });
    router.push(`/analyze?${params.toString()}`);
  };

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

  const memberSince = formatDistanceToNow(new Date(user.createdAt), {
    addSuffix: true,
  });
  const totalAnalyses = user.analyses.length;
  const totalImprovements = user.improvedResumes.length;
  const averageScore =
    totalAnalyses > 0
      ? Math.round(
          user.analyses.reduce(
            (sum, analysis) => sum + analysis.overallScore,
            0
          ) / totalAnalyses
        )
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Available Credits</p>
                  <p className="text-3xl font-bold text-purple-600">
                    {user.credits}
                  </p>
                </div>
                <CreditCard className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Analyses</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {totalAnalyses}
                  </p>
                </div>
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Improvements Made</p>
                  <p className="text-3xl font-bold text-green-600">
                    {totalImprovements}
                  </p>
                </div>
                <Sparkles className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p
                    className={`text-3xl font-bold ${getScoreColor(
                      averageScore
                    )}`}
                  >
                    {averageScore || "--"}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Upload */}
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="text-purple-500" />
                  Start a New Task
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ready to improve your career prospects? Upload a new resume to
                  get started, or work with your existing documents.
                </p>
                <div className="p-4 border-2 border-dashed border-gray-200 rounded-lg">
                  <FileUploader
                    onFileSelect={handleFileSelected}
                    buttonText="Upload New Resume for Analysis"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleStartImprovement}
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Improve an Existing Resume
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleStartTailoring}
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Tailor Resume to a Job
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Account Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Account Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Member since</span>
                    <span className="text-sm font-medium">{memberSince}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">
                      Total credits used
                    </span>
                    <span className="text-sm font-medium">
                      {user.totalCreditsUsed}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Plan</span>
                    <Badge
                      className={
                        user.isPremium
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {user.subscriptions[0]?.planName || "Free"}
                    </Badge>
                  </div>
                </div>
                <Button className="w-full" variant="outline">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Upgrade Plan
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Resumes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  My Resumes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.resumes.length > 0 ? (
                  <div className="space-y-4">
                    {user.resumes.slice(0, 5).map((resume) => (
                      <div
                        key={resume.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-purple-300 transition-colors"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {resume.title || resume.fileName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {resume.fileName}
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-gray-500">
                              Uploaded{" "}
                              {formatDistanceToNow(new Date(resume.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                            {resume.analyses.length > 0 && (
                              <p className="text-xs text-blue-600">
                                {resume.analyses.length} analysis
                                {resume.analyses.length > 1 ? "es" : ""}
                              </p>
                            )}
                            {resume.improvedResumes.length > 0 && (
                              <p className="text-xs text-green-600">
                                {resume.improvedResumes.length} improvement
                                {resume.improvedResumes.length > 1 ? "s" : ""}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const params = new URLSearchParams({
                                resumeId: resume.id,
                                fileName: encodeURIComponent(resume.fileName),
                              });
                              router.push(`/analyze?${params.toString()}`);
                            }}
                            disabled={user.credits < 2}
                          >
                            <Brain className="h-4 w-4 mr-1" />
                            Re-analyze
                          </Button>
                          {resume.analyses.length > 0 && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                // Navigate to the most recent analysis
                                const latestAnalysis = resume.analyses[0];
                                handleViewAnalysis(latestAnalysis.id);
                              }}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {user.resumes.length > 5 && (
                      <div className="text-center pt-4">
                        <Button variant="outline" size="sm">
                          View All Resumes ({user.resumes.length})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No resumes uploaded yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload your first resume to start building your
                      collection!
                    </p>
                    <Button
                      onClick={handleStartAnalysis}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Upload Your First Resume
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Analyses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Analyses
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.analyses.length > 0 ? (
                  <div className="space-y-4">
                    {user.analyses.slice(0, 5).map((analysis) => (
                      <div
                        key={analysis.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:border-purple-300 hover:bg-purple-50/50 transition-all cursor-pointer"
                        onClick={() => handleViewAnalysis(analysis.id)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {analysis.resume.fileName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            "{analysis.mainRoast}"
                          </p>
                          <div className="flex items-center gap-4 mt-2">
                            <p className="text-xs text-gray-500">
                              {formatDistanceToNow(
                                new Date(analysis.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </p>
                            <p className="text-xs text-purple-600">
                              {analysis.creditsUsed} credits used
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-center">
                            <Badge
                              className={getScoreBadgeColor(
                                analysis.overallScore
                              )}
                            >
                              {analysis.overallScore}/100
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">
                              Overall
                            </p>
                          </div>
                          <div className="text-center">
                            <Badge
                              className={getScoreBadgeColor(analysis.atsScore)}
                            >
                              {analysis.atsScore}/100
                            </Badge>
                            <p className="text-xs text-gray-500 mt-1">ATS</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent card click
                              handleViewAnalysis(analysis.id);
                            }}
                            className="opacity-60 hover:opacity-100"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    {user.analyses.length > 5 && (
                      <div className="text-center pt-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            // TODO: Navigate to full analyses list page
                            console.log("Navigate to all analyses page");
                          }}
                        >
                          View All Analyses ({user.analyses.length})
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No analyses yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Upload your resume to get started with AI-powered
                      feedback!
                    </p>
                    <Button
                      onClick={handleStartAnalysis}
                      className="bg-purple-600 hover:bg-purple-700"
                      disabled={user.credits < 2}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Your First Resume
                    </Button>
                    {user.credits < 2 && (
                      <p className="text-red-600 text-xs mt-2">
                        Need 2 credits to analyze
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Improvements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Recent Improvements
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.improvedResumes.length > 0 ? (
                  <div className="space-y-4">
                    {user.improvedResumes.slice(0, 3).map((improvement) => (
                      <div
                        key={improvement.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {improvement.resume.fileName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Tailored for: {improvement.targetRole} in{" "}
                            {improvement.targetIndustry}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(
                              new Date(improvement.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              router.push(`/improved-resume/${improvement.id}`);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // TODO: Implement download functionality
                              console.log(
                                "Download improvement:",
                                improvement.id
                              );
                            }}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No improvements yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Analyze a resume first, then create improved versions!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Recent Credit Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user.creditTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {user.creditTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between py-3 border-b last:border-b-0"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDistanceToNow(
                              new Date(transaction.createdAt),
                              { addSuffix: true }
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-sm font-medium ${
                              transaction.amount > 0
                                ? "text-green-600"
                                : "text-red-600"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}
                            {transaction.amount}
                          </span>
                          <p className="text-xs text-gray-500">
                            {transaction.type.replace("_", " ").toLowerCase()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No transactions yet
                    </h3>
                    <p className="text-gray-600">
                      Your credit activity will appear here.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
