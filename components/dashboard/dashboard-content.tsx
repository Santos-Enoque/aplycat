"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
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
    improvements: Array<{
      id: string;
      targetRole: string;
      targetIndustry: string;
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
  improvements: Array<{
    id: string;
    targetRole: string;
    targetIndustry: string;
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
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const handleFileSelect = async (fileData: string, fileName: string) => {
    setIsAnalyzing(true);
    // TODO: Implement analysis upload logic
    console.log("Starting analysis for:", fileName);
  };

  const handleViewAnalysis = (analysisId: string) => {
    setSelectedAnalysis(analysisId);
  };

  const handleBackToDashboard = () => {
    setSelectedAnalysis(null);
  };

  // If viewing a specific analysis, show the detail view
  if (selectedAnalysis) {
    const analysis = user.analyses.find((a) => a.id === selectedAnalysis);
    if (analysis) {
      return (
        <AnalysisDetail analysis={analysis} onBack={handleBackToDashboard} />
      );
    }
  }

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
  const totalImprovements = user.improvements.length;
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user.firstName || "there"}! 🐱
              </h1>
              <p className="text-gray-600 mt-1">
                Ready to make your resume purr-fect?
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Badge className="bg-purple-100 text-purple-800 px-3 py-1">
                {user.credits} credits
              </Badge>
              {user.isPremium && (
                <Badge className="bg-yellow-100 text-yellow-800 px-3 py-1">
                  <Star className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    isLoading={isAnalyzing}
                  />
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <Button className="w-full" variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    Analyze Resume (2 credits)
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Improve Resume (3 credits)
                  </Button>
                  <Button className="w-full" variant="outline">
                    <Target className="h-4 w-4 mr-2" />
                    Tailor for Job (4 credits)
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
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {analysis.resume.fileName}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            "{analysis.mainRoast}"
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDistanceToNow(new Date(analysis.createdAt), {
                              addSuffix: true,
                            })}
                          </p>
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
                            onClick={() => handleViewAnalysis(analysis.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
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
                {user.improvements.length > 0 ? (
                  <div className="space-y-4">
                    {user.improvements.slice(0, 3).map((improvement) => (
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
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
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
