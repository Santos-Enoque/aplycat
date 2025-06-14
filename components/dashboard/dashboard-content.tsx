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
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SystemBanner } from "@/components/ui/system-banner";

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

// Trial Claim Card Component
function TrialClaimCard() {
  const t = useTranslations("dashboard.trialCard");
  const [showTrialCard, setShowTrialCard] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [trialPrice, setTrialPrice] = useState<string | null>(null);

  useEffect(() => {
    // Check if user came from trial signup
    const trialIntent = localStorage.getItem("aplycat_trial_intent");
    if (trialIntent === "true") {
      setShowTrialCard(true);
    }
  }, []);

  useEffect(() => {
    const fetchTrialPrice = async () => {
      try {
        const response = await fetch("/api/payments/packages");
        const data = await response.json();
        const trialPackage = data.packages.find((p: any) => p.id === "trial");
        if (trialPackage) {
          if (data.pricing.currency === "MZN") {
            setTrialPrice(`${trialPackage.price} MZN`);
          } else {
            setTrialPrice(`$${trialPackage.price.toFixed(2)}`);
          }
        } else {
          setTrialPrice("$1"); // Fallback
        }
      } catch (error) {
        console.error("Failed to fetch trial price:", error);
        setTrialPrice("$1"); // Fallback
      }
    };

    if (showTrialCard) {
      fetchTrialPrice();
    }
  }, [showTrialCard]);

  const handleClaimTrial = async (
    paymentMethod: "credit_card" | "mobile_money"
  ) => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: "trial",
          paymentMethod: paymentMethod,
          returnUrl: `${window.location.origin}/trial-success`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to create checkout session."
        );
      }

      const data = await response.json();

      if (data.success && data.checkoutUrl) {
        // Clear the trial intent since they're proceeding
        localStorage.removeItem("aplycat_trial_intent");
        // Show payment method specific message
        if (paymentMethod === "credit_card") {
          toast.info("Redirecting to secure card payment...");
        } else {
          toast.info("Redirecting to mobile money payment...");
        }
        // Redirect to payment provider
        window.location.href = data.checkoutUrl;
      } else {
        throw new Error("Could not retrieve checkout URL.");
      }
    } catch (error) {
      console.error("Trial payment error:", error);
      toast.error("Failed to start trial payment", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
      setIsProcessing(false);
    }
  };

  const handleDismiss = () => {
    // Clear the trial intent and hide the card
    localStorage.removeItem("aplycat_trial_intent");
    setShowTrialCard(false);
  };

  if (!showTrialCard) return null;

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100 relative overflow-hidden mb-8">
      <button
        onClick={handleDismiss}
        className="absolute top-3 right-3 sm:top-4 sm:right-4 p-1 rounded-full hover:bg-white/50 transition-colors z-10"
        disabled={isProcessing}
      >
        <X className="h-4 w-4 text-blue-600" />
      </button>

      <CardHeader className="pb-4 pr-12 sm:pr-16">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
              <CardTitle className="text-lg sm:text-xl lg:text-2xl text-blue-900 break-words">
                {t("claimTrial")}
              </CardTitle>
              <Badge className="bg-red-500 text-white animate-pulse self-start sm:self-center text-xs">
                {t("limitedTime")}
              </Badge>
            </div>
            <CardDescription className="text-blue-700 text-sm sm:text-base">
              {t("oneStepAway")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-6">
          {/* What's included - Mobile first layout */}
          <div>
            <h3 className="font-bold text-blue-900 mb-4 text-base sm:text-lg">
              {t("creditsIncluded")}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base text-blue-800">
                  {t("resumeImprovements")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base text-blue-800">
                  {t("jobTailoredResumes")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base text-blue-800">
                  {t("linkedinAnalysis")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                <span className="text-sm sm:text-base text-blue-800">
                  {t("customEnhancement")}
                </span>
              </div>
            </div>
          </div>

          {/* Call to action - Mobile optimized */}
          <div className="text-center space-y-4">
            <div>
              <div className="text-3xl sm:text-4xl font-bold text-blue-900 mb-1">
                {trialPrice || <Skeleton className="h-10 w-24 mx-auto" />}
              </div>
              <div className="text-sm sm:text-base text-blue-700">
                {t("oneTimePayment")}
              </div>
            </div>
            {!showPaymentMethods ? (
              <Button
                onClick={() => setShowPaymentMethods(true)}
                disabled={isProcessing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 sm:py-6 text-base sm:text-lg font-bold rounded-xl"
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                {t("claimTrialNow")}
              </Button>
            ) : (
              <div className="space-y-3">
                <p className="text-center text-blue-800 font-medium text-sm sm:text-base">
                  {t("choosePaymentMethod")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    onClick={() => handleClaimTrial("credit_card")}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 py-3 sm:py-4 text-sm sm:text-base font-bold"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-4 h-4 mr-2" />
                        {t("creditCard")}
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={() => handleClaimTrial("mobile_money")}
                    disabled={isProcessing}
                    variant="outline"
                    className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 py-3 sm:py-4 text-sm sm:text-base font-bold"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        {t("processing")}
                      </>
                    ) : (
                      <>
                        <Smartphone className="w-4 h-4 mr-2" />
                        {t("mobileMoney")}
                      </>
                    )}
                  </Button>
                </div>
                <Button
                  onClick={() => setShowPaymentMethods(false)}
                  variant="ghost"
                  className="w-full text-blue-600 hover:text-blue-800 text-sm"
                >
                  {t("backToOptions")}
                </Button>
              </div>
            )}
            <p className="text-xs sm:text-sm text-blue-600 text-center">
              {t("securePayment")}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

  const totalAnalyses = user.analyses.length;
  const totalImprovements = user.improvedResumes.length;
  const latestAnalysis =
    user.analyses.length > 0
      ? user.analyses.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0]
      : null;
  const currentATSScore = latestAnalysis ? latestAnalysis.atsScore : "-";

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* System Banner */}
      <SystemBanner />

      {/* Welcome Section */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          {t("welcome.title")}
        </h2>
        <p className="text-muted-foreground text-lg">{t("welcome.subtitle")}</p>
      </div>

      {/* Trial Claim Card */}
      <TrialClaimCard />

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
