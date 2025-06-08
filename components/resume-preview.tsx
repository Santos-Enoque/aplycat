// components/resume-preview.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ResumeCustomization } from "@/components/resume-customization";
import { TailoredResults } from "@/components/tailored-results";
import {
  Download,
  Edit3,
  Share2,
  Copy,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Printer,
  Eye,
  EyeOff,
  Settings,
  Sparkles,
  FileText,
  Target,
} from "lucide-react";

import {
  ImprovedResume,
  PersonalInfo,
  Experience,
  Education,
  Skills,
  ImprovementsAnalysis,
} from "@/types/improved-resume";

interface TailoredData {
  tailoredResume: ImprovedResume;
  coverLetter?: string;
  tailoringAnalysis: {
    jobMatchScore: string;
    keywordAlignment: string[];
    prioritizedExperience: string[];
    recommendedAdjustments: string[];
  };
  includedCoverLetter: boolean;
}

interface ResumePreviewProps {
  improvedResume: ImprovedResume;
  targetRole: string;
  targetIndustry: string;
  fileName: string;
  onBack: () => void;
}

type ViewState = "preview" | "customize" | "tailored";

export function ResumePreview({
  improvedResume,
  targetRole,
  targetIndustry,
  fileName,
  onBack,
}: ResumePreviewProps) {
  const [showIllustrativeMetrics, setShowIllustrativeMetrics] = useState(true);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [currentResume, setCurrentResume] = useState(improvedResume);
  const [viewState, setViewState] = useState<ViewState>("preview");
  const [tailoredData, setTailoredData] = useState<TailoredData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadResume = () => {
    // Create a simple text version for download
    const resumeText = `
${currentResume.personalInfo.name}
${currentResume.personalInfo.email} | ${currentResume.personalInfo.phone} | ${
      currentResume.personalInfo.location
    }
${
  currentResume.personalInfo.linkedin
    ? `LinkedIn: ${currentResume.personalInfo.linkedin}`
    : ""
}

PROFESSIONAL SUMMARY
${currentResume.professionalSummary}

PROFESSIONAL EXPERIENCE
${currentResume.experience
  .map(
    (exp) => `
${exp.title} | ${exp.company} | ${exp.location} | ${exp.startDate} - ${
      exp.endDate
    }
${exp.achievements.map((achievement) => `• ${achievement}`).join("\n")}
`
  )
  .join("\n")}

EDUCATION
${currentResume.education
  .map(
    (edu) => `
${edu.degree} | ${edu.institution} | ${edu.year}
${edu.details || ""}
`
  )
  .join("\n")}

CORE COMPETENCIES
Technical Skills: ${currentResume.skills.technical.join(", ")}
${
  currentResume.skills.certifications.length > 0
    ? `Certifications: ${currentResume.skills.certifications.join(", ")}`
    : ""
}
${
  currentResume.skills.otherRelevantSkills &&
  currentResume.skills.otherRelevantSkills.length > 0
    ? `Additional Skills: ${currentResume.skills.otherRelevantSkills.join(
        ", "
      )}`
    : ""
}
    `.trim();

    const blob = new Blob([resumeText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentResume.personalInfo.name.replace(
      /\s+/g,
      "_"
    )}_Resume.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const printResume = () => {
    window.print();
  };

  const shareResume = async () => {
    const resumeUrl = window.location.href;
    const shareText = `Check out my optimized resume for ${targetRole} in ${targetIndustry}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Optimized Resume",
          text: shareText,
          url: resumeUrl,
        });
      } catch (error) {
        // Fallback to clipboard
        copyToClipboard(resumeUrl, "url");
      }
    } else {
      copyToClipboard(resumeUrl, "url");
    }
  };

  const highlightIllustrativeMetrics = (text: string) => {
    if (!showIllustrativeMetrics) {
      return text.replace(
        /\[Illustrative: [^\]]+\]/g,
        '<span class="bg-gray-200 text-gray-700 px-1 rounded">[REPLACE WITH YOUR DATA]</span>'
      );
    }

    return text.replace(
      /\[Illustrative: ([^\]]+)\]/g,
      '<span class="bg-yellow-200 text-yellow-800 px-1 rounded font-medium" title="This is sample data - replace with your actual metrics">[Illustrative: $1]</span>'
    );
  };

  const handleResumeUpdate = async (updatedResume: ImprovedResume) => {
    setIsUpdating(true);
    setTimeout(() => {
      setCurrentResume(updatedResume);
      setViewState("preview");
      setIsUpdating(false);
    }, 500); // Small delay for smooth transition
  };

  const handleTailoredResult = (result: TailoredData) => {
    setTailoredData(result);
    setViewState("tailored");
  };

  const handleBackToPreview = () => {
    setViewState("preview");
  };

  const handleBackToCustomize = () => {
    setViewState("customize");
  };

  // Render Customization View
  if (viewState === "customize") {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" onClick={handleBackToPreview}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Preview
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Customize Resume
            </h1>
            <p className="text-gray-600">
              Update with feedback or tailor to job description
            </p>
          </div>
        </div>

        <ResumeCustomization
          currentResume={currentResume}
          targetRole={targetRole}
          targetIndustry={targetIndustry}
          onResumeUpdate={handleResumeUpdate}
          onTailoredResume={handleTailoredResult}
        />
      </div>
    );
  }

  // Render Tailored Results View
  if (viewState === "tailored" && tailoredData) {
    return (
      <TailoredResults
        tailoredResume={tailoredData.tailoredResume}
        coverLetter={tailoredData.coverLetter}
        tailoringAnalysis={tailoredData.tailoringAnalysis}
        onBack={handleBackToCustomize}
      />
    );
  }

  // Render Main Preview View
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Analysis
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isUpdating ? "Updating Resume..." : "Improved Resume Preview"}
            </h1>
            <p className="text-gray-600">
              Optimized for{" "}
              <span className="font-medium text-blue-600">{targetRole}</span> in{" "}
              <span className="font-medium text-purple-600">
                {targetIndustry}
              </span>
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowIllustrativeMetrics(!showIllustrativeMetrics)}
            title={
              showIllustrativeMetrics
                ? "Hide sample metrics"
                : "Show sample metrics"
            }
          >
            {showIllustrativeMetrics ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showIllustrativeMetrics ? "Hide" : "Show"} Metrics
          </Button>
          <Button variant="outline" onClick={printResume} title="Print resume">
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Button
            variant="outline"
            onClick={downloadResume}
            title="Download as text file"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      {/* Loading overlay */}
      {isUpdating && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3 shadow-xl">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-700">Updating your resume...</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Resume Preview */}
        <div className="lg:col-span-2">
          <Card className="bg-white shadow-lg">
            <CardContent className="p-8">
              {/* Personal Header */}
              <div className="text-center mb-6 border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {currentResume.personalInfo.name}
                </h1>
                <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                  <span>{currentResume.personalInfo.email}</span>
                  <span>•</span>
                  <span>{currentResume.personalInfo.phone}</span>
                  <span>•</span>
                  <span>{currentResume.personalInfo.location}</span>
                  {currentResume.personalInfo.linkedin && (
                    <>
                      <span>•</span>
                      <a
                        href={currentResume.personalInfo.linkedin}
                        className="text-blue-600 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        LinkedIn
                      </a>
                    </>
                  )}
                  {currentResume.personalInfo.website && (
                    <>
                      <span>•</span>
                      <a
                        href={currentResume.personalInfo.website}
                        className="text-blue-600 hover:text-blue-800"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Website
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* Professional Summary */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  PROFESSIONAL SUMMARY
                </h2>
                <p
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{
                    __html: highlightIllustrativeMetrics(
                      currentResume.professionalSummary
                    ),
                  }}
                />
              </div>

              {/* Professional Experience */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  PROFESSIONAL EXPERIENCE
                </h2>
                <div className="space-y-4">
                  {currentResume.experience.map((exp, index) => (
                    <div key={index} className="relative">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {exp.title}
                          </h3>
                          <p className="text-gray-700 font-medium">
                            {exp.company} - {exp.location}
                          </p>
                        </div>
                        <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                          {exp.startDate} - {exp.endDate}
                        </span>
                      </div>
                      <ul className="space-y-1 ml-4">
                        {exp.achievements.map((achievement, achIndex) => (
                          <li
                            key={achIndex}
                            className="text-gray-700 text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                              __html: `• ${highlightIllustrativeMetrics(
                                achievement
                              )}`,
                            }}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Education */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  EDUCATION
                </h2>
                <div className="space-y-3">
                  {currentResume.education.map((edu, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-start"
                    >
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {edu.degree}
                        </h3>
                        <p className="text-gray-700">{edu.institution}</p>
                        {edu.details && (
                          <p className="text-sm text-gray-600 mt-1">
                            {edu.details}
                          </p>
                        )}
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap ml-4">
                        {edu.year}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                  CORE COMPETENCIES
                </h2>
                <div className="space-y-3">
                  {currentResume.skills.technical.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">
                        Technical Skills:
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {currentResume.skills.technical.join(" • ")}
                      </p>
                    </div>
                  )}
                  {currentResume.skills.certifications.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-1">
                        Certifications:
                      </h3>
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {currentResume.skills.certifications.join(" • ")}
                      </p>
                    </div>
                  )}
                  {currentResume.skills.otherRelevantSkills &&
                    currentResume.skills.otherRelevantSkills.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-800 mb-1">
                          Additional Skills:
                        </h3>
                        <p className="text-gray-700 text-sm leading-relaxed">
                          {currentResume.skills.otherRelevantSkills.join(" • ")}
                        </p>
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Improvement Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-green-600" />
                Optimization Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-1">
                    {
                      currentResume.improvementsAnalysis
                        .targetOptimizedResumeScore
                    }
                  </div>
                  <p className="text-sm text-gray-600">Target Optimization</p>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-green-600 h-3 rounded-full transition-all duration-1000"
                    style={{
                      width: `${parseInt(
                        currentResume.improvementsAnalysis.targetOptimizedResumeScore.split(
                          "-"
                        )[0]
                      )}%`,
                    }}
                  ></div>
                </div>

                <div className="text-center pt-2 border-t">
                  <div className="text-lg font-semibold text-gray-700 mb-1">
                    {
                      currentResume.improvementsAnalysis
                        .originalResumeEffectivenessEstimateForTarget
                    }
                    /100
                  </div>
                  <p className="text-xs text-gray-500">Original Score</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customization CTA */}
          <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-purple-800">
                <Settings className="h-5 w-5" />
                Customize Further
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-purple-700">
                Fine-tune your resume with feedback or tailor it to specific job
                postings
              </p>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => setViewState("customize")}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  size="sm"
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  Update with Feedback
                </Button>

                <Button
                  onClick={() => setViewState("customize")}
                  variant="outline"
                  className="w-full border-purple-300 text-purple-700 hover:bg-purple-50"
                  size="sm"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Tailor to Job
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Key Improvements */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Key Improvements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {currentResume.improvementsAnalysis.keyRevisionsImplemented.map(
                  (revision, index) => (
                    <li
                      key={index}
                      className="text-sm text-gray-700 flex items-start gap-2"
                    >
                      <span className="text-green-600 mt-1 text-xs">✓</span>
                      <span className="leading-relaxed">{revision}</span>
                    </li>
                  )
                )}
              </ul>
            </CardContent>
          </Card>

          {/* Action Required */}
          <Card className="border-2 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
                <AlertTriangle className="h-5 w-5" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentResume.improvementsAnalysis.recommendationsForUser.map(
                  (rec, index) => (
                    <div
                      key={index}
                      className="text-sm text-yellow-800 bg-yellow-100 p-3 rounded border border-yellow-200 leading-relaxed"
                    >
                      {rec}
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  copyToClipboard(currentResume.professionalSummary, "summary")
                }
              >
                {copiedSection === "summary" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Summary
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() =>
                  copyToClipboard(
                    currentResume.skills.technical.join(", "),
                    "skills"
                  )
                }
              >
                {copiedSection === "skills" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Skills
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={shareResume}
              >
                {copiedSection === "url" ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Target Information */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg text-blue-800 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Optimization Target
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 mb-2"
                  >
                    Target Role
                  </Badge>
                  <p className="text-sm text-blue-700 font-medium">
                    {targetRole}
                  </p>
                </div>
                <div>
                  <Badge
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 mb-2"
                  >
                    Industry
                  </Badge>
                  <p className="text-sm text-blue-700 font-medium">
                    {targetIndustry}
                  </p>
                </div>
                <div className="pt-2 border-t border-blue-200">
                  <p className="text-xs text-blue-600">
                    Resume optimized with industry keywords and role-specific
                    achievements
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
