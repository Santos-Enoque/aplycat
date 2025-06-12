"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Star, Target, Zap } from "lucide-react";
import { Suspense } from "react";
import { useTranslations } from "next-intl";

function SignUpContent() {
  const searchParams = useSearchParams();
  const isTrial = searchParams.get("trial") === "true";
  const t = useTranslations("signup");

  // Set up the unsafe metadata for trial signups
  const unsafeMetadata = isTrial ? { trial: "true" } : undefined;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full grid lg:grid-cols-2 gap-6 lg:gap-8 items-start lg:items-center">
        {/* Left side - Benefits */}
        <div className="space-y-6">
          {isTrial && (
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-6 w-6" />
                <Badge className="bg-white/20 text-white">
                  {t("trial.limitedTimeOffer")}
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                {t("trial.title")}
              </h2>
              <p className="text-base sm:text-lg opacity-90 mb-4">
                {t("trial.subtitle")}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t("trial.resumeImprovements")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t("trial.jobTailoring")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t("trial.linkedinAnalysis")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>{t("trial.customEnhancement")}</span>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-500" />
                {t("benefits.title")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold">
                    {t("benefits.brutalFeedback.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("benefits.brutalFeedback.description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold">
                    {t("benefits.aiImprovements.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("benefits.aiImprovements.description")}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold">
                    {t("benefits.jobTailoring.title")}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t("benefits.jobTailoring.description")}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isTrial && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-semibold text-center">
                {t("freeAnalysis")}
              </p>
            </div>
          )}
        </div>

        {/* Right side - Signup form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>
                {isTrial ? t("form.titleTrial") : t("form.titleRegular")}
              </CardTitle>
              <p className="text-gray-600">
                {isTrial ? t("form.subtitleTrial") : t("form.subtitleRegular")}
              </p>
            </CardHeader>
            <CardContent>
              <SignUp
                unsafeMetadata={unsafeMetadata}
                redirectUrl="/dashboard"
                appearance={{
                  elements: {
                    formButtonPrimary:
                      "bg-blue-600 hover:bg-blue-700 text-sm normal-case",
                    card: "shadow-none",
                    headerTitle: "hidden",
                    headerSubtitle: "hidden",
                  },
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  const t = useTranslations("signup");

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loading")}</p>
          </div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
