"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState, Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  Sparkles,
  ArrowRight,
  Target,
  Zap,
  Star,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function TrialSuccessContent() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/signup?trial=true");
    }
  }, [isLoaded, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Success Header */}
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center animate-pulse">
            <CheckCircle className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 px-2">
            🎉 Welcome to Your Trial!
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 px-4">
            Payment successful! You now have 7 AI credits to use.
          </p>
        </div>

        {/* Payment Confirmation */}
        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white overflow-hidden">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <Badge className="bg-white/20 text-white mb-2 text-xs sm:text-sm">
                  PAYMENT CONFIRMED
                </Badge>
                <CardTitle className="text-xl sm:text-2xl break-words">
                  Trial Activated!
                </CardTitle>
              </div>
              <div className="text-center sm:text-right flex-shrink-0">
                <div className="text-2xl sm:text-3xl font-bold">$1.00</div>
                <div className="text-xs sm:text-sm opacity-90">
                  One-time payment
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">7 AI Credits Added</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">
                  All Features Unlocked
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">No Monthly Fees</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="text-sm sm:text-base">30-Day Guarantee</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Start Actions - Temporarily Hidden 
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              What Would You Like to Do First?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <Link href="/analyze" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Star className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-blue-900">
                          Analyze Resume
                        </h3>
                        <p className="text-sm text-blue-700">
                          Get detailed feedback
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/improve" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-green-50 border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                        <Sparkles className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900">
                          Improve Resume
                        </h3>
                        <p className="text-sm text-green-700">
                          AI rewrite sections
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/tailor" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-purple-50 border-purple-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
                        <ArrowRight className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-purple-900">
                          Tailor Resume
                        </h3>
                        <p className="text-sm text-purple-700">
                          Match job posting
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/dashboard" className="block">
                <Card className="cursor-pointer hover:shadow-md transition-shadow bg-gray-50 border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          View Dashboard
                        </h3>
                        <p className="text-sm text-gray-700">
                          Check your credits
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </CardContent>
        </Card>
        */}

        {/* Support & Next Steps */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Help Getting Started?
            </h3>
            <p className="text-gray-600 mb-4">
              Our AI tools are designed to be intuitive, but we're here if you
              need assistance.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                variant="outline"
                onClick={() => window.open("mailto:support@aplycat.com")}
                className="w-full sm:w-auto"
              >
                Contact Support
              </Button>
              <Button
                onClick={() => router.push("/dashboard")}
                className="w-full sm:w-auto"
              >
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Session ID for reference */}
        {sessionId && (
          <div className="text-center">
            <p className="text-xs text-gray-400">Transaction ID: {sessionId}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrialSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <TrialSuccessContent />
    </Suspense>
  );
}
