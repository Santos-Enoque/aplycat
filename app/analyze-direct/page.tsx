"use client";

import React from "react";
import { DirectFileUpload } from "@/components/direct-file-upload";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Zap,
  Clock,
  Shield,
  Target,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function DirectAnalysisPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Zap className="w-8 h-8 text-blue-600" />
              <h1 className="text-4xl font-bold text-gray-900">
                ⚡ Direct Analysis
              </h1>
            </div>
            <p className="text-xl text-gray-600 mb-2">
              Lightning-fast resume analysis with zero upload delays
            </p>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Upload your PDF and get instant analysis results. No file storage,
              no waiting - your resume goes directly to our AI for immediate
              processing.
            </p>
          </div>

          {/* Benefits Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <Zap className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="font-semibold text-blue-800 text-sm">
                  Instant Processing
                </div>
                <div className="text-blue-600 text-xs">No upload delays</div>
              </CardContent>
            </Card>

            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4 text-center">
                <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="font-semibold text-green-800 text-sm">
                  Enhanced Privacy
                </div>
                <div className="text-green-600 text-xs">Direct to AI model</div>
              </CardContent>
            </Card>

            <Card className="bg-purple-50 border-purple-200">
              <CardContent className="p-4 text-center">
                <Target className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="font-semibold text-purple-800 text-sm">
                  ATS Optimized
                </div>
                <div className="text-purple-600 text-xs">Beat the robots</div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <div className="font-semibold text-orange-800 text-sm">
                  ~5 Second Analysis
                </div>
                <div className="text-orange-600 text-xs">
                  Typical processing time
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-center text-2xl">
                Upload Your Resume for Instant Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <DirectFileUpload />
            </CardContent>
          </Card>

          {/* How It Works */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span>How Direct Analysis Works</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-blue-600 font-bold text-lg">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Upload PDF
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Select your resume PDF file. We convert it to base64 format
                    for immediate processing.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-green-600 font-bold text-lg">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Direct to AI
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Your resume goes directly to our AI model - no file storage,
                    no delays.
                  </p>
                </div>

                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                    <span className="text-purple-600 font-bold text-lg">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Instant Results
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Get comprehensive analysis results in seconds with
                    actionable insights.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature Comparison */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Direct vs Standard Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">
                        Feature
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-blue-600">
                        <Zap className="w-4 h-4 inline mr-1" />
                        Direct Analysis
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-600">
                        Standard Processing
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="py-3 px-4">Processing Time</td>
                      <td className="text-center py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">
                          ~5 seconds
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary">30-60 seconds</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">File Upload</td>
                      <td className="text-center py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-800">
                          None Required
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary">UploadThing</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">Privacy</td>
                      <td className="text-center py-3 px-4">
                        <Badge className="bg-green-100 text-green-800">
                          Direct to AI
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary">File Stored</Badge>
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-3 px-4">User Experience</td>
                      <td className="text-center py-3 px-4">
                        <Badge className="bg-purple-100 text-purple-800">
                          Instant
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary">Loading Screens</Badge>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">Background Processing</td>
                      <td className="text-center py-3 px-4">
                        <Badge className="bg-blue-100 text-blue-800">
                          Non-blocking
                        </Badge>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant="secondary">Blocking</Badge>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* What You'll Get */}
          <Card>
            <CardHeader>
              <CardTitle>What You'll Get from Your Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Comprehensive Scoring
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">
                        Overall Resume Score (0-100)
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">ATS Compatibility Score</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">
                        Performance Category Rating
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    Detailed Feedback
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">
                        Specific Strengths & Weaknesses
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">ATS Optimization Tips</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">
                        Actionable Recommendations
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
