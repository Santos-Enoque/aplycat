"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Download,
  Star,
  Clock,
  Target,
  Building,
  Zap,
  Sparkles,
  FileText,
  Save,
  Edit3,
  Share,
  Layout,
  Briefcase,
  RefreshCw,
  CheckCircle,
} from "lucide-react";
import { JobTailoringComponent } from "@/components/job-tailoring-component";
import { ResumePreview } from "@/components/resume-preview";
import { ImprovedResume, Experience, Education } from "@/types/improved-resume";

// Extended interface for streaming with edit tracking
interface StreamingImprovedResumeData extends ImprovedResume {
  _hasChanges?: boolean;
}

interface StreamingContext {
  improvement: StreamingImprovedResumeData;
  targetRole: string;
  targetIndustry: string;
  timestamp: number;
}

export default function StreamingImprovedResumePage() {
  const router = useRouter();
  const [streamingData, setStreamingData] = useState<StreamingContext | null>(
    null
  );
  const [editableResume, setEditableResume] =
    useState<StreamingImprovedResumeData | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState<"resume" | "coverLetter">(
    "resume"
  );
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [tailoringAnalysis, setTailoringAnalysis] = useState<any>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedResumeId, setSavedResumeId] = useState<string | null>(null);

  useEffect(() => {
    // Load streaming data from sessionStorage
    const storedData = sessionStorage.getItem("streamingImprovement");
    if (storedData) {
      try {
        const data: StreamingContext = JSON.parse(storedData);
        console.log("🔍 Loaded streaming data:", data);

        setStreamingData(data);

        // Create a clean copy to avoid any reference issues
        const cleanImprovement = JSON.parse(JSON.stringify(data.improvement));
        console.log(
          "📝 Experience entries:",
          cleanImprovement.experience?.length
        );
        console.log(
          "🎓 Education entries:",
          cleanImprovement.education?.length
        );

        // Remove duplicates if they exist
        if (cleanImprovement.experience) {
          const uniqueExperience = cleanImprovement.experience.filter(
            (exp: any, index: number, arr: any[]) => {
              return (
                index ===
                arr.findIndex(
                  (e) =>
                    e.title === exp.title &&
                    e.company === exp.company &&
                    e.startDate === exp.startDate
                )
              );
            }
          );
          cleanImprovement.experience = uniqueExperience;
          console.log("✅ Unique experience entries:", uniqueExperience.length);
        }

        if (cleanImprovement.education) {
          const uniqueEducation = cleanImprovement.education.filter(
            (edu: any, index: number, arr: any[]) => {
              return (
                index ===
                arr.findIndex(
                  (e) =>
                    e.degree === edu.degree &&
                    e.institution === edu.institution &&
                    e.year === edu.year
                )
              );
            }
          );
          cleanImprovement.education = uniqueEducation;
          console.log("✅ Unique education entries:", uniqueEducation.length);
        }

        setEditableResume(cleanImprovement);

        // Set up highlighting for AI changes
        const highlighted: string[] = [];
        const improvement = cleanImprovement;

        // Check for illustrative metrics in experience achievements
        if (improvement.experience) {
          improvement.experience.forEach((exp: any, expIndex: number) => {
            exp.achievements?.forEach(
              (achievement: string, achIndex: number) => {
                if (achievement.includes("[Illustrative:")) {
                  highlighted.push(
                    `experience.${expIndex}.achievements.${achIndex}`
                  );
                }
              }
            );
          });
        }

        // Highlight professional summary if it was improved
        if (
          improvement.improvementsAnalysis?.keyRevisionsImplemented?.some(
            (revision: string) =>
              revision.toLowerCase().includes("summary") ||
              revision.toLowerCase().includes("professional summary")
          )
        ) {
          highlighted.push("professionalSummary");
        }

        setHighlightedFields([...new Set(highlighted)]);
      } catch (error) {
        console.error("Failed to parse streaming data:", error);
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  }, [router]);

  useEffect(() => {
    if (editableResume && streamingData && !isSaved) {
      const saveImprovedResume = async () => {
        try {
          const response = await fetch("/api/resumes/improved", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              resumeData: editableResume,
              targetRole: streamingData.targetRole,
              targetIndustry: streamingData.targetIndustry,
            }),
          });
          if (response.ok) {
            const savedResume = await response.json();
            setSavedResumeId(savedResume.id);
            setIsSaved(true);
            console.log("✅ Initial improved resume saved:", savedResume);
          } else {
            console.error("Failed to save improved resume");
          }
        } catch (error) {
          console.error("Error saving improved resume:", error);
        }
      };

      saveImprovedResume();
    }
  }, [editableResume, streamingData, isSaved]);

  const handleEditResume = (field: string, value: any) => {
    if (!editableResume) return;

    const fieldPath = field.split(".");
    const updatedResume = { ...editableResume };

    // Navigate to the field and update it
    let current: any = updatedResume;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const key = fieldPath[i];
      if (key.includes("[") && key.includes("]")) {
        const [arrayKey, indexStr] = key.split("[");
        const index = parseInt(indexStr.replace("]", ""));
        current = current[arrayKey][index];
      } else {
        current = current[key];
      }
    }

    const lastKey = fieldPath[fieldPath.length - 1];
    if (lastKey.includes("[") && lastKey.includes("]")) {
      const [arrayKey, indexStr] = lastKey.split("[");
      const index = parseInt(indexStr.replace("]", ""));
      current[arrayKey][index] = value;
    } else {
      current[lastKey] = value;
    }

    updatedResume._hasChanges = true;
    setEditableResume(updatedResume);
  };

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!editableResume || !streamingData) return;

    setIsDownloading(true);
    try {
      // Download cover letter if that's the active tab
      if (activeTab === "coverLetter" && coverLetter) {
        // Create a simple text file for cover letter
        const blob = new Blob([coverLetter], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = `${streamingData.targetRole}-cover-letter.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        return;
      }

      // Download resume
      const response = await fetch(`/api/download-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData: editableResume,
          format: format,
          fileName: `${streamingData.targetRole}-resume`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate download");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${streamingData.targetRole}-resume.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download resume. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTailoringComplete = async (tailoringResult: any) => {
    if (tailoringResult.tailoredResume) {
      setEditableResume(tailoringResult.tailoredResume);
    }

    // Store tailoring analysis for keyword highlighting
    if (tailoringResult.tailoringAnalysis) {
      setTailoringAnalysis(tailoringResult.tailoringAnalysis);
      // Set highlighted fields based on keywords from job matching
      const keywords = tailoringResult.tailoringAnalysis.keywordAlignment || [];
      setHighlightedFields(
        keywords.map((keyword: string) => `keyword:${keyword}`)
      );
    }

    if (tailoringResult.coverLetter) {
      setCoverLetter(tailoringResult.coverLetter);
      setActiveTab("coverLetter");
    }

    // Save tailored resume to DB
    if (savedResumeId) {
      try {
        const response = await fetch(`/api/resumes/improved/${savedResumeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            resumeData: tailoringResult.tailoredResume,
            coverLetter: tailoringResult.coverLetter,
            jobDescription: tailoringResult.jobDescription, // Assuming this is available from the component
          }),
        });

        if (response.ok) {
          const updatedResume = await response.json();
          console.log("✅ Tailored resume saved:", updatedResume);
        } else {
          console.error("Failed to save tailored resume");
        }
      } catch (error) {
        console.error("Error saving tailored resume:", error);
      }
    }

    setIsTailoring(false);
    console.log("✅ Tailoring completed:", tailoringResult);
  };

  const handleTailoringStart = () => {
    setIsTailoring(true);
  };

  const handleGoBack = () => {
    router.push("/dashboard");
  };

  if (!streamingData || !editableResume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your improved resume...</p>
        </div>
      </div>
    );
  }

  const improvementsAnalysis = editableResume.improvementsAnalysis;
  const originalScore =
    improvementsAnalysis?.originalResumeEffectivenessEstimateForTarget
      ? parseInt(
          improvementsAnalysis.originalResumeEffectivenessEstimateForTarget
        )
      : null;
  const newScore = improvementsAnalysis?.targetOptimizedResumeScore
    ? parseInt(improvementsAnalysis.targetOptimizedResumeScore.split("-")[0])
    : null;
  const scoreChange =
    originalScore && newScore ? newScore - originalScore : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              AI-Improved Resume
            </h1>
            <p className="text-gray-600">
              {streamingData.targetRole} • {streamingData.targetIndustry}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsFavorite(!isFavorite)}
              variant={isFavorite ? "default" : "outline"}
              size="sm"
            >
              <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("docx")}
                disabled={isDownloading}
              >
                {isDownloading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {activeTab === "coverLetter" && coverLetter
                  ? "Cover Letter"
                  : "DOCX"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("pdf")}
                disabled
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
                <Badge variant="secondary" className="ml-2 text-xs">
                  Soon
                </Badge>
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleGoBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Resume Preview (takes 2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="h-fit bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200 shadow-xl">
              <CardHeader className="bg-white border-b border-blue-100">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    {activeTab === "resume" ? "Resume Preview" : "Cover Letter"}
                  </CardTitle>
                  {coverLetter && (
                    <Tabs
                      value={activeTab}
                      onValueChange={(val) => setActiveTab(val as any)}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="resume">Resume</TabsTrigger>
                        <TabsTrigger value="coverLetter">
                          Cover Letter
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {activeTab === "resume" ? (
                  <div className="rounded-lg overflow-hidden relative">
                    <div
                      className={`transition-all duration-300 ${
                        isTailoring ? "blur-sm opacity-50" : ""
                      }`}
                    >
                      <ResumePreview
                        resumeData={
                          editableResume as StreamingImprovedResumeData
                        }
                        onEdit={handleEditResume}
                        highlightedFields={highlightedFields}
                      />
                    </div>
                    {isTailoring && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">
                            Tailoring resume for job...
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="prose max-w-none">
                      {highlightedFields.some((field) =>
                        field.startsWith("keyword:")
                      ) ? (
                        <div
                          className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed"
                          dangerouslySetInnerHTML={{
                            __html: (() => {
                              const keywords = highlightedFields
                                .filter((field) => field.startsWith("keyword:"))
                                .map((field) => field.replace("keyword:", ""));

                              let highlightedText = coverLetter || "";
                              keywords.forEach((keyword) => {
                                const escapedKeyword = keyword.replace(
                                  /[.*+?^${}()|[\]\\]/g,
                                  "\\$&"
                                );
                                const regex = new RegExp(
                                  `\\b(${escapedKeyword})\\b`,
                                  "gi"
                                );
                                highlightedText = highlightedText.replace(
                                  regex,
                                  '<span class="bg-green-200 text-green-800 px-1 rounded font-medium">$1</span>'
                                );
                              });
                              return highlightedText;
                            })(),
                          }}
                        />
                      ) : (
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans leading-relaxed">
                          {coverLetter}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Improvement Stats & Tools */}
          <div className="lg:col-span-1 space-y-4">
            {/* Score Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  Improvement Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {improvementsAnalysis?.analysisHeadline && (
                  <p className="text-sm text-gray-600">
                    {improvementsAnalysis.analysisHeadline}
                  </p>
                )}

                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-bold text-gray-800">
                      {originalScore || "--"}
                    </div>
                    <div className="text-xs text-gray-500">Original</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {improvementsAnalysis?.targetOptimizedResumeScore || "--"}
                    </div>
                    <div className="text-xs text-gray-500">Improved</div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {scoreChange ? `+${scoreChange}` : "--"}
                    </div>
                    <div className="text-xs text-gray-500">Increase</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Job Tailoring Component */}
            <JobTailoringComponent
              currentResume={editableResume}
              onTailoringComplete={handleTailoringComplete}
              onTailoringStart={handleTailoringStart}
              isLoading={isTailoring}
            />

            {/* Tailoring Analysis - Show when available */}
            {tailoringAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Job Matching Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tailoringAnalysis.jobMatchScore && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {tailoringAnalysis.jobMatchScore}
                      </div>
                      <p className="text-sm text-gray-600">Job Match Score</p>
                    </div>
                  )}

                  {tailoringAnalysis.keywordAlignment &&
                    tailoringAnalysis.keywordAlignment.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">
                          Keywords Integrated:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {tailoringAnalysis.keywordAlignment.map(
                            (keyword: string, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-green-100 text-green-800"
                              >
                                {keyword}
                              </Badge>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {tailoringAnalysis.emphasizedSkills &&
                    tailoringAnalysis.emphasizedSkills.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">
                          Emphasized Skills:
                        </h4>
                        <ul className="space-y-1">
                          {tailoringAnalysis.emphasizedSkills.map(
                            (skill: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-gray-700 flex items-center gap-2"
                              >
                                <CheckCircle className="h-3 w-3 text-green-500" />
                                {skill}
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* AI Improvements */}
            {improvementsAnalysis?.keyRevisionsImplemented && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-600" />
                    AI Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {improvementsAnalysis.keyRevisionsImplemented.map(
                      (revision, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm"
                        >
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{revision}</span>
                        </li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {improvementsAnalysis?.recommendationsForUser && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-orange-600" />
                    Important Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <ul className="space-y-2">
                      {improvementsAnalysis.recommendationsForUser.map(
                        (rec, index) => (
                          <li key={index} className="text-sm text-yellow-800">
                            • {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Debug Panel - Remove in production */}
            {process.env.NODE_ENV === "development" && (
              <Card className="border-yellow-200 bg-yellow-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-yellow-800">
                    🐛 Debug Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-yellow-800">
                  <div className="space-y-2">
                    <p>
                      <strong>Experience Count:</strong>{" "}
                      {editableResume?.experience?.length || 0}
                    </p>
                    <p>
                      <strong>Education Count:</strong>{" "}
                      {editableResume?.education?.length || 0}
                    </p>
                    <p>
                      <strong>Projects Count:</strong>{" "}
                      {editableResume?.projects?.length || 0}
                    </p>
                    <details className="mt-2">
                      <summary className="cursor-pointer font-semibold">
                        View Raw Data
                      </summary>
                      <pre className="mt-2 p-2 bg-white rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(
                          {
                            experience: editableResume?.experience?.map(
                              (exp, i) => ({
                                index: i,
                                title: exp.title,
                                company: exp.company,
                              })
                            ),
                            education: editableResume?.education?.map(
                              (edu, i) => ({
                                index: i,
                                degree: edu.degree,
                                institution: edu.institution,
                              })
                            ),
                          },
                          null,
                          2
                        )}
                      </pre>
                    </details>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pro Features Coming Soon */}
            <Card className="border-dashed border-2 border-gray-300">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-500">
                  <Building className="h-5 w-5" />
                  Pro Features
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center text-gray-500">
                <div className="space-y-2">
                  <p className="text-sm">✨ Job Tailoring</p>
                  <p className="text-sm">📄 Cover Letters</p>
                  <p className="text-sm">🎨 Multiple Templates</p>
                  <p className="text-sm">🔗 LinkedIn Optimization</p>
                </div>
                <Badge variant="secondary" className="mt-3">
                  Coming Soon
                </Badge>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
