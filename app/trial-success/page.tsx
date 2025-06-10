// app/trial-success/page.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, SignIn } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Zap, Upload, ArrowRight, Loader } from "lucide-react";

export default function TrialSuccessPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    if (sessionIdParam) {
      setSessionId(sessionIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    if (isLoaded && isSignedIn && sessionId) {
      // User is signed in and we have session ID - redirect to dashboard
      setIsProcessing(false);
      setTimeout(() => {
        router.push('/dashboard?trial=success');
      }, 2000);
    } else if (isLoaded && !isSignedIn) {
      // User needs to sign in/up
      setIsProcessing(false);
    }
  }, [isLoaded, isSignedIn, sessionId, router]);

  if (!isLoaded || isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Loader className="w-12 h-12 text-green-500 animate-spin mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Processing Your Trial...
            </h2>
            <p className="text-gray-600">
              Please wait while we set up your account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-2xl w-full mx-4">
          <CardContent className="p-8 text-center">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-12 h-12 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Welcome to Aplycat Premium! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Your $1 trial is active! You now have 10 credits to transform your resume.
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-green-900 mb-4">What you can do with 10 credits:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>5× Resume Improvements (2 credits each)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>3× Job-Tailored Resumes (3 credits each)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>1× LinkedIn Analysis (1 credit)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>Complete analysis & detailed feedback</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                size="lg"
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-semibold"
                onClick={() => router.push('/dashboard')}
              >
                <Zap className="mr-2 h-5 w-5" />
                Go to Dashboard
              </Button>
              
              <p className="text-sm text-gray-500">
                Redirecting automatically in a few seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User needs to sign in/up
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-2xl text-gray-900">
              Payment Successful! 🎉
            </CardTitle>
            <p className="text-gray-600 mt-2">
              Create your account to access your 10 credits
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">Your $1 Trial Includes:</h4>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• 10 premium credits (worth $8.30)</li>
              <li>• Complete resume analysis</li>
              <li>• AI resume improvements</li>
              <li>• Job-specific tailoring</li>
              <li>• Cover letter generation</li>
            </ul>
          </div>

          <div className="space-y-4">
            <SignIn 
              appearance={{
                elements: {
                  formButtonPrimary: "bg-green-600 hover:bg-green-700 text-sm normal-case",
                  card: "shadow-none border-0",
                },
              }}
              forceRedirectUrl="/dashboard?trial=success"
              fallbackRedirectUrl="/dashboard?trial=success"
            />
          </div>

          <p className="text-xs text-gray-500 text-center">
            Your credits are waiting for you after signup!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}