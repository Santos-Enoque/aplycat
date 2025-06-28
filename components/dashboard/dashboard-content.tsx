"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Linkedin,
  MessageSquare,
  Instagram,
  Sparkles,
  CheckCircle,
  X,
  CreditCard,
  Smartphone,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemBanner } from "@/components/ui/system-banner";
import { RecentTransactions } from "./recent-transactions";

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
  const [dragActive, setDragActive] = useState(false);
  const t = useTranslations("dashboard");
  const tErrors = useTranslations("dashboard.errors");

  // Clear previous analysis data when returning to dashboard
  useEffect(() => {
    // Clear any previous analysis data to ensure fresh start
    sessionStorage.removeItem("streamingAnalysisFile");

    // Optional: Clear any other analysis-related session storage keys
    sessionStorage.removeItem("analysisResults");
    sessionStorage.removeItem("streamResults");

    console.log("Dashboard mounted - cleared previous analysis session data");
  }, []);

  const handleFileSelected = async (file: File) => {
    toast.info("Preparing your analysis...", {
      description: "You will be redirected momentarily.",
    });

    try {
      // Convert to base64 for immediate analysis
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        
        const analysisData = {
          fileName: file.name,
          fileData: `data:${file.type};base64,${base64}`, // Store as full data URL for analyze page
          fileSize: file.size,
          mimeType: file.type,
          timestamp: new Date().toISOString(),
        };

        // Store for immediate analysis
        sessionStorage.setItem("streamingAnalysisFile", JSON.stringify(analysisData));
        
        // Start background UploadThing upload (non-blocking)
        startBackgroundUpload(file, analysisData);
        
        // Navigate to analysis immediately
        router.push("/analyze");
      };
      
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        toast.error("Could not read the selected file.", {
          description: "Please try a different file or refresh the page.",
        });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process file. Please try again.");
    }
  };

  // Background upload process that doesn't block user experience  
  const startBackgroundUpload = async (file: File, analysisData: any) => {
    // Always save fallback metadata immediately to ensure the file is captured
    try {
      console.log("[DASHBOARD] Saving immediate fallback metadata...");
      
      const fallbackResponse = await fetch("/api/save-resume-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: analysisData.fileName,
          fileSize: analysisData.fileSize,
          mimeType: analysisData.mimeType,
          fileUrl: analysisData.fileData, // Use the full data URL
        }),
      });

      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json();
        console.log("[DASHBOARD] Fallback metadata saved:", fallbackResult.resumeId);
        sessionStorage.setItem("aplycat_resume_id", fallbackResult.resumeId);
      }
    } catch (fallbackError) {
      console.error("[DASHBOARD] Fallback metadata save failed:", fallbackError);
    }

    // Try UploadThing upload in background (non-blocking, experimental)
    // Note: This is complex because UploadThing expects a specific client-side flow
    // For now, we rely on the fallback metadata save above
    console.log("[DASHBOARD] UploadThing background upload skipped - using fallback metadata save");
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files: FileList) => {
    const file = files[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      toast.error(tErrors("invalidFileType"), {
        description: tErrors("invalidFileTypeDesc"),
      });
      return;
    }

    if (file.size > maxFileSize) {
      toast.error(tErrors("fileTooLarge"), {
        description: tErrors("fileTooLargeDesc"),
      });
      return;
    }

    handleFileSelected(file);
  };

  const connectLinkedIn = () => {
    router.push("/linkedin");
  };

  const openFeedback = () => {
    window.open("https://upvoto.vercel.app/project/Aplycat", "_blank");
  };

  const openLinkedIn = () => {
    window.open(
      "https://www.linkedin.com/company/applicaai/?viewAsMember=true",
      "_blank"
    );
  };

  const openInstagram = () => {
    window.open("https://instagram.com/aplycat", "_blank");
  };

  const totalAnalyses = user.analyses?.length ?? 0;
  const totalImprovements = user.improvedResumes?.length ?? 0;
  const latestAnalysis =
    user.analyses && user.analyses.length > 0
      ? user.analyses.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;
  const currentATSScore = latestAnalysis ? latestAnalysis.atsScore : "-";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          {t("welcome.title")}
        </h2>
        <p className="text-muted-foreground text-lg">{t("welcome.subtitle")}</p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-1 gap-6 max-w-lg mx-auto">
        {/* CV Upload Card */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>{t("uploadCard.title")}</CardTitle>
                <CardDescription>{t("uploadCard.description")}</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div
              className={`
                    border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                    ${
                      dragActive
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/30"
                    }
                  `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">
                {t("uploadCard.dragAndDrop")}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("uploadCard.supportedFormats")}
              </p>
              <Button variant="outline" size="sm">
                {t("uploadCard.browseFiles")}
              </Button>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600 font-medium">
                  {t("uploadCard.free")}
                </span>
                <span className="text-primary font-medium">
                  ~2 min analysis
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid md:grid-cols-2 gap-4 max-w-lg mx-auto">
        {/* View Resumes Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">My Resumes</h3>
                <p className="text-sm text-muted-foreground">Manage uploaded resumes</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="/dashboard/resumes">
                  View My Resumes ({user.resumes?.length || 0})
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* View Analyses Card */}
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">My Analyses</h3>
                <p className="text-sm text-muted-foreground">View analysis history</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href="/dashboard/analyses">
                  View Analyses ({totalAnalyses})
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Section */}
      <RecentTransactions />

      {/* Feedback and Social Section */}
      <div className="flex items-center justify-between pt-8 border-t">
        <Button
          onClick={openFeedback}
          variant="outline"
          size="sm"
          className="text-sm"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          {t("footer.requestFeature")}
        </Button>

        <div className="flex items-center space-x-2">
          <Button
            onClick={openLinkedIn}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Linkedin className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            onClick={openInstagram}
            variant="ghost"
            size="sm"
            className="p-2"
          >
            <Instagram className="w-4 h-4 text-pink-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
