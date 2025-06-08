"use client";

import { CheckCircle, ArrowRight, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Component for Feature 1: Resume Honest Feedback
export function HonestFeedbackPreview() {
  return (
    <div className="overflow-hidden shadow-lg aspect-[4/3] bg-gradient-to-br from-red-50 to-orange-50 p-6 rounded-lg flex flex-col justify-center items-center text-center h-full">
      <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            ATS Score & Feedback
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center space-y-4">
          <div className="relative w-32 h-32">
            <svg className="w-full h-full" viewBox="0 0 36 36">
              <path
                className="text-gray-200"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeWidth="3"
              />
              <path
                className="text-green-500"
                strokeDasharray="89, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                strokeLinecap="round"
                strokeWidth="3"
                transform="rotate(90 18 18)"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-bold text-foreground">89</span>
              <span className="text-sm text-muted-foreground">/ 100</span>
            </div>
          </div>
          <div className="text-left w-full space-y-2">
            <p className="font-semibold text-sm text-foreground">
              Key Improvements:
            </p>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Added quantifiable results</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Optimized for 'SaaS' keywords</span>
              </li>
              <li className="flex items-center">
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                <span>Improved action verb usage</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for Feature 2: AI Resume Generator
export function AiResumeGeneratorPreview() {
  return (
    <div className="overflow-hidden shadow-lg aspect-[4/3] bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg flex flex-col justify-center items-center h-full">
      <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-foreground">
            <TrendingUp className="h-5 w-5 mr-2 text-purple-500" />
            AI-Powered Rewrite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold">
              BEFORE
            </p>
            <p className="text-sm text-gray-500 p-2 bg-gray-100 rounded">
              "Responsible for managing social media accounts."
            </p>
          </div>
          <div className="flex justify-center my-2">
            <ArrowRight className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-green-600 mb-1 font-semibold">AFTER</p>
            <p className="text-sm text-foreground p-2 bg-green-50 rounded border border-green-200">
              "Orchestrated a 35% growth in engagement across 4 social media
              platforms by leveraging data-driven content strategies."
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for Feature 3: Job-Specific Tailoring
export function JobTailoringPreview() {
  return (
    <div className="overflow-hidden shadow-lg aspect-[4/3] bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-lg flex flex-col justify-center items-center text-center h-full">
      <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Tailored for Job:
          </CardTitle>
          <p className="text-md text-purple-500 font-bold">
            Senior Software Engineer
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="font-semibold text-sm text-foreground">
            Top Keyword Matches:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              React
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              Node.js
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              TypeScript
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              AWS
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              CI/CD
            </Badge>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 border-green-200"
            >
              Microservices
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Component for Feature 4: LinkedIn Roast & Rewrite
export function LinkedInPreview() {
  return (
    <div className="overflow-hidden shadow-lg aspect-[4/3] bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg flex flex-col justify-center items-center h-full">
      <Card className="w-full max-w-sm bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-lg font-semibold text-foreground">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 text-blue-700"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
            </svg>
            LinkedIn Headline Rewrite
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-1 font-semibold">
              BEFORE
            </p>
            <p className="text-sm text-gray-500 p-2 bg-gray-100 rounded">
              "Looking for new opportunities"
            </p>
          </div>
          <div className="flex justify-center my-2">
            <ArrowRight className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-green-600 mb-1 font-semibold">AFTER</p>
            <p className="text-sm text-foreground p-2 bg-green-50 rounded border border-green-200">
              "Senior Software Engineer | Building Scalable FinTech Solutions
              with React & TypeScript"
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
