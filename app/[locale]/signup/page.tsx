"use client";

import { SignUp } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Sparkles, Star, Target, Zap } from "lucide-react";
import { Suspense } from "react";

function SignUpContent() {
  const searchParams = useSearchParams();
  const isTrial = searchParams.get("trial") === "true";

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
                  LIMITED TIME OFFER
                </Badge>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold mb-2">
                $1 Trial - All AI Features
              </h2>
              <p className="text-base sm:text-lg opacity-90 mb-4">
                Get 7 credits worth $5.81 for just $1
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>3× Resume Improvements</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>2× Job Tailoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>1× LinkedIn Analysis</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>1× Custom Enhancement</span>
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-6 w-6 text-blue-500" />
                What you get with Aplycat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Brutal Honest Feedback</h3>
                  <p className="text-sm text-gray-600">
                    Real feedback that recruiters actually think
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Star className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold">AI-Powered Improvements</h3>
                  <p className="text-sm text-gray-600">
                    Complete resume rewrites optimized for ATS
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="h-5 w-5 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold">Job-Specific Tailoring</h3>
                  <p className="text-sm text-gray-600">
                    Custom resumes + cover letters for every application
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {!isTrial && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800 font-semibold text-center">
                🎁 New users get 2 free credits to get started
              </p>
            </div>
          )}
        </div>

        {/* Right side - Signup form */}
        <div className="flex justify-center">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle>
                {isTrial ? "Start Your $1 Trial" : "Create Your Account"}
              </CardTitle>
              <p className="text-gray-600">
                {isTrial
                  ? "Get instant access to all AI features"
                  : "Join thousands improving their careers"}
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
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  );
}
