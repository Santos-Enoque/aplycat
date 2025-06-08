"use client";

import { useState } from "react";
import { useStreamingLinkedInAnalysis } from "@/hooks/use-streaming-linkedin-analysis";
import { StreamingLinkedInAnalysisDisplay } from "@/components/streaming-linkedin-analysis-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Linkedin, Zap, Loader } from "lucide-react";

export default function LinkedInAnalysisPage() {
  const [profileUrl, setProfileUrl] = useState("");
  const { analysis, status, error, startLinkedInAnalysis } =
    useStreamingLinkedInAnalysis();

  const handleSubmit = () => {
    // Basic URL validation
    if (profileUrl.trim() && profileUrl.includes("linkedin.com/in/")) {
      startLinkedInAnalysis(profileUrl);
    } else {
      // You could show a toast or an inline error here
      alert("Please enter a valid LinkedIn profile URL.");
    }
  };

  const isAnalyzing = status === "connecting" || status === "streaming";

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white rounded-full p-3 mb-4 shadow-lg">
              <Linkedin className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              LinkedIn Profile Analysis
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Enter your LinkedIn profile URL to get a savage, yet priceless,
              review from our AI expert.
            </p>
          </header>

          <main>
            {status === "idle" || status === "error" ? (
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>Enter Your Profile URL</CardTitle>
                  <CardDescription>
                    Make sure your profile is public for the analysis to work.
                    We don't store your data.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="url"
                    placeholder="https://www.linkedin.com/in/your-profile-name"
                    value={profileUrl}
                    onChange={(e) => setProfileUrl(e.target.value)}
                    className="h-12 text-lg"
                    disabled={isAnalyzing}
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!profileUrl.trim() || isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader className="w-5 h-5 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Analyze My Profile
                      </>
                    )}
                  </Button>
                  {error && (
                    <p className="text-red-600 text-sm text-center mt-2">
                      {error}
                    </p>
                  )}
                </CardContent>
              </Card>
            ) : (
              <StreamingLinkedInAnalysisDisplay
                analysis={analysis}
                status={status}
                profileUrl={profileUrl}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
