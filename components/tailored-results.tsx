// components/tailored-results.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Copy,
  CheckCircle,
  Target,
  FileText,
  Eye,
  EyeOff,
  Share2,
} from "lucide-react";
import { useTranslations } from "next-intl";

interface TailoredResultsProps {
  tailoredResume: any;
  coverLetter?: string;
  tailoringAnalysis: any;
  onBack: () => void;
}

export function TailoredResults({
  tailoredResume,
  coverLetter,
  tailoringAnalysis,
  onBack,
}: TailoredResultsProps) {
  const t = useTranslations("tailoredResults");
  const [activeView, setActiveView] = useState<"resume" | "cover">("resume");
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(true);

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const downloadContent = () => {
    if (activeView === "cover" && coverLetter) {
      // Download cover letter
      const blob = new Blob([coverLetter], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tailoredResume.personalInfo.name.replace(
        /\s+/g,
        "_"
      )}_Cover_Letter.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      // Download tailored resume
      const resumeText = `
${tailoredResume.personalInfo.name}
${tailoredResume.personalInfo.email} | ${tailoredResume.personalInfo.phone} | ${
        tailoredResume.personalInfo.location
      }
${
  tailoredResume.personalInfo.linkedin
    ? `LinkedIn: ${tailoredResume.personalInfo.linkedin}`
    : ""
}

PROFESSIONAL SUMMARY
${tailoredResume.professionalSummary}

PROFESSIONAL EXPERIENCE
${tailoredResume.experience
  .map(
    (exp: any) => `
${exp.title} | ${exp.company} | ${exp.location} | ${exp.startDate} - ${
      exp.endDate
    }
${exp.achievements.map((achievement: string) => `• ${achievement}`).join("\n")}
`
  )
  .join("\n")}

EDUCATION
${tailoredResume.education
  .map(
    (edu: any) => `
${edu.degree} | ${edu.institution} | ${edu.year}
${edu.details || ""}
`
  )
  .join("\n")}

CORE COMPETENCIES
Technical Skills: ${tailoredResume.skills.technical.join(", ")}
${
  tailoredResume.skills.certifications.length > 0
    ? `Certifications: ${tailoredResume.skills.certifications.join(", ")}`
    : ""
}
      `.trim();

      const blob = new Blob([resumeText], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${tailoredResume.personalInfo.name.replace(
        /\s+/g,
        "_"
      )}_Tailored_Resume.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const highlightKeywords = (text: string) => {
    if (!tailoringAnalysis?.keywordAlignment) return text;

    let highlightedText = text;
    tailoringAnalysis.keywordAlignment.forEach((keyword: string) => {
      // Escape special regex characters to prevent regex errors
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b(${escapedKeyword})\\b`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<span class="bg-green-200 text-green-800 px-1 rounded font-medium">$1</span>'
      );
    });
    return highlightedText;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("backToCustomize")}
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t("title")}</h1>
            <p className="text-gray-600">
              Optimized for the specific job description
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAnalysis(!showAnalysis)}
          >
            {showAnalysis ? (
              <EyeOff className="h-4 w-4 mr-2" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {showAnalysis ? "Hide" : "Show"} Analysis
          </Button>
          <Button variant="outline" onClick={downloadContent}>
            <Download className="h-4 w-4 mr-2" />
            {activeView === "cover" ? t("downloadCover") : t("downloadResume")}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Navigation Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setActiveView("resume")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                activeView === "resume"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              <FileText className="h-4 w-4" />
              Tailored Resume
            </button>
            {coverLetter && (
              <button
                onClick={() => setActiveView("cover")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
                  activeView === "cover"
                    ? "bg-white text-purple-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FileText className="h-4 w-4" />
                Cover Letter
              </button>
            )}
          </div>

          {/* Resume View */}
          {activeView === "resume" && (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                {/* Header */}
                <div className="text-center mb-6 border-b pb-4">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {tailoredResume.personalInfo.name}
                  </h1>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    <span>{tailoredResume.personalInfo.email}</span>
                    <span>•</span>
                    <span>{tailoredResume.personalInfo.phone}</span>
                    <span>•</span>
                    <span>{tailoredResume.personalInfo.location}</span>
                    {tailoredResume.personalInfo.linkedin && (
                      <>
                        <span>•</span>
                        <span className="text-blue-600">LinkedIn</span>
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
                      __html: highlightKeywords(
                        tailoredResume.professionalSummary
                      ),
                    }}
                  />
                </div>

                {/* Experience */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                    PROFESSIONAL EXPERIENCE
                  </h2>
                  <div className="space-y-4">
                    {tailoredResume.experience.map(
                      (exp: any, index: number) => (
                        <div key={index}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">
                                {exp.title}
                              </h3>
                              <p className="text-gray-700">
                                {exp.company} - {exp.location}
                              </p>
                            </div>
                            <span className="text-sm text-gray-600">
                              {exp.startDate} - {exp.endDate}
                            </span>
                          </div>
                          <ul className="space-y-1 ml-4">
                            {exp.achievements.map(
                              (achievement: string, achIndex: number) => (
                                <li
                                  key={achIndex}
                                  className="text-gray-700 text-sm"
                                  dangerouslySetInnerHTML={{
                                    __html: `• ${highlightKeywords(
                                      achievement
                                    )}`,
                                  }}
                                />
                              )
                            )}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>

                {/* Education */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-1">
                    EDUCATION
                  </h2>
                  <div className="space-y-2">
                    {tailoredResume.education.map((edu: any, index: number) => (
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
                            <p className="text-sm text-gray-600">
                              {edu.details}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-gray-600">
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
                    {tailoredResume.skills.technical.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-800 mb-1">
                          Technical Skills:
                        </h3>
                        <p
                          className="text-gray-700 text-sm"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeywords(
                              tailoredResume.skills.technical.join(" • ")
                            ),
                          }}
                        />
                      </div>
                    )}
                    {tailoredResume.skills.certifications.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-800 mb-1">
                          Certifications:
                        </h3>
                        <p className="text-gray-700 text-sm">
                          {tailoredResume.skills.certifications.join(" • ")}
                        </p>
                      </div>
                    )}
                    {tailoredResume.skills.otherRelevantSkills.length > 0 && (
                      <div>
                        <h3 className="font-medium text-gray-800 mb-1">
                          Additional Skills:
                        </h3>
                        <p
                          className="text-gray-700 text-sm"
                          dangerouslySetInnerHTML={{
                            __html: highlightKeywords(
                              tailoredResume.skills.otherRelevantSkills.join(
                                " • "
                              )
                            ),
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cover Letter View */}
          {activeView === "cover" && coverLetter && (
            <Card className="bg-white shadow-lg">
              <CardContent className="p-8">
                <div className="mb-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Cover Letter
                    </h2>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(coverLetter, "cover-letter")
                      }
                    >
                      {copiedSection === "cover-letter" ? (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <Copy className="h-4 w-4 mr-2" />
                      )}
                      Copy
                    </Button>
                  </div>
                  <div
                    className="prose max-w-none text-gray-700 whitespace-pre-line leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightKeywords(coverLetter),
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Analysis Sidebar */}
        {showAnalysis && (
          <div className="space-y-6">
            {/* Match Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="h-5 w-5 text-purple-600" />
                  Job Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <div className="text-4xl font-bold text-purple-600 mb-2">
                    {tailoringAnalysis.jobMatchScore}
                  </div>
                  <p className="text-sm text-gray-600">Job Match Score</p>
                </div>

                <div className="space-y-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-purple-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: tailoringAnalysis.jobMatchScore }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Keywords Integrated */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Keywords Integrated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tailoringAnalysis.keywordAlignment?.map(
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
              </CardContent>
            </Card>

            {/* Prioritized Experience */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emphasized Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tailoringAnalysis.prioritizedExperience?.map(
                    (exp: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-gray-700 flex items-start gap-2"
                      >
                        <span className="text-purple-600 mt-1">•</span>
                        <span>{exp}</span>
                      </li>
                    )
                  )}
                </ul>
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card className="border-2 border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-lg text-blue-800">
                  Additional Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tailoringAnalysis.recommendedAdjustments?.map(
                    (rec: string, index: number) => (
                      <li
                        key={index}
                        className="text-sm text-blue-700 flex items-start gap-2"
                      >
                        <span className="text-blue-600 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    )
                  )}
                </ul>
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
                    copyToClipboard(
                      tailoredResume.professionalSummary,
                      "summary"
                    )
                  }
                >
                  {copiedSection === "summary" ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  Copy Summary
                </Button>

                <Button variant="outline" className="w-full justify-start">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Results
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
