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
import { useUserCredits } from "@/hooks/use-user-credits";
import { toast } from "sonner";

import { ImprovedResume } from "@/types/improved-resume";

// Extended interface for streaming with edit tracking
interface StreamingImprovedResumeData extends ImprovedResume {
  _hasChanges?: boolean;
}

interface StreamingContext {
  improvement: StreamingImprovedResumeData;
  targetRole: string;
  targetIndustry: string;
  timestamp: number;
  tailoringResult?: any;
  highlightedFields?: string[];
}

// ATS-Friendly Resume Preview Component
function ResumePreview({
  resumeData,
  onEdit,
  highlightedFields = [],
}: {
  resumeData: StreamingImprovedResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
}) {
  const isHighlighted = (field: string) => {
    return highlightedFields.some((highlightedField) => {
      if (highlightedField.startsWith("keyword:")) return false;
      if (highlightedField === field) return true;
      if (
        highlightedField === "experience.achievements" &&
        field.includes("experience.") &&
        field.includes(".achievements.")
      ) {
        return true;
      }
      if (
        highlightedField === "professionalSummary" &&
        field === "professionalSummary"
      ) {
        return true;
      }
      return false;
    });
  };

  const highlightKeywords = (text: string) => {
    // Add null/undefined check for text parameter
    if (!text || typeof text !== "string") {
      return text || "";
    }

    const keywords = highlightedFields
      .filter((field) => field.startsWith("keyword:"))
      .map((field) => field.replace("keyword:", ""));

    if (keywords.length === 0) return text;

    let highlightedText = text;
    keywords.forEach((keyword) => {
      // Add null check for keyword and highlightedText
      if (!keyword || !highlightedText) return;

      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b(${escapedKeyword})\\b`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<span class="bg-green-200 text-green-800 px-1 rounded font-medium">$1</span>'
      );
    });
    return highlightedText || "";
  };

  const EditableText = ({
    field,
    value,
    className = "",
    multiline = false,
    style = {},
  }: {
    field: string;
    value: string;
    className?: string;
    multiline?: boolean;
    style?: React.CSSProperties;
  }) => {
    const [isEditing, setIsEditing] = useState(false);
    const editableRef = useRef<HTMLDivElement>(null);
    const hasKeywordHighlights = highlightedFields.some((field) =>
      field.startsWith("keyword:")
    );

    const handleClick = () => {
      setIsEditing(true);
      setTimeout(() => {
        if (editableRef.current) {
          editableRef.current.focus();
          const range = document.createRange();
          const selection = window.getSelection();
          if (editableRef.current.childNodes.length > 0) {
            range.selectNodeContents(editableRef.current);
            range.collapse(false);
          } else {
            range.setStart(editableRef.current, 0);
            range.setEnd(editableRef.current, 0);
          }
          selection?.removeAllRanges();
          selection?.addRange(range);
        }
      }, 0);
    };

    const handleBlur = () => {
      if (editableRef.current) {
        const newValue = editableRef.current.innerText;
        if (newValue !== safeValue) {
          onEdit(field, newValue);
        }
      }
      setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey && !multiline) {
        e.preventDefault();
        handleBlur();
      }
      if (e.key === "Escape") {
        if (editableRef.current) {
          editableRef.current.innerText = safeValue;
        }
        setIsEditing(false);
      }
    };

    // Ensure value is never null/undefined before highlighting
    const safeValue = value || "";
    const displayValue =
      hasKeywordHighlights && !isEditing
        ? highlightKeywords(safeValue)
        : safeValue;

    const commonStyles = {
      ...style,
      wordWrap: "break-word" as const,
      whiteSpace: multiline ? ("pre-wrap" as const) : ("nowrap" as const),
      overflow: multiline ? ("hidden" as const) : ("visible" as const),
      lineHeight: multiline ? "1.5" : "inherit",
    };

    const commonClassName = `${className} outline-none transition-all duration-200 group relative
      ${
        isEditing
          ? "bg-white ring-2 ring-blue-400 ring-opacity-50 shadow-sm rounded-md px-2 py-1"
          : "cursor-text hover:bg-gray-50 hover:bg-opacity-70 rounded px-1 py-0.5"
      }
      ${isHighlighted(field) ? "bg-yellow-100 border border-yellow-300" : ""}
      ${multiline ? "min-h-[1.5rem]" : ""}
    `;

    if (!isEditing && hasKeywordHighlights) {
      return (
        <div className="relative group">
          <div
            ref={editableRef}
            contentEditable={isEditing}
            suppressContentEditableWarning={true}
            className={commonClassName}
            style={commonStyles}
            onClick={handleClick}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            title="Click to edit"
            role="textbox"
            aria-label={`Edit ${field}`}
            dangerouslySetInnerHTML={{ __html: displayValue }}
          />
          <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 absolute top-1 right-1 transition-opacity pointer-events-none" />
          {isHighlighted(field) && (
            <Badge
              variant="secondary"
              className="absolute -top-2 -right-2 text-xs pointer-events-none"
            >
              AI Added
            </Badge>
          )}
        </div>
      );
    }

    return (
      <div
        ref={editableRef}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        className={commonClassName}
        style={commonStyles}
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        title={isEditing ? "" : "Click to edit"}
        role="textbox"
        aria-label={`Edit ${field}`}
      >
        {isEditing ? (
          safeValue
        ) : (
          <>
            {safeValue}
            <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 absolute top-1 right-1 transition-opacity pointer-events-none" />
            {isHighlighted(field) && (
              <Badge
                variant="secondary"
                className="absolute -top-2 -right-2 text-xs pointer-events-none"
              >
                AI Added
              </Badge>
            )}
          </>
        )}
      </div>
    );
  };

  if (!resumeData || !resumeData.personalInfo) {
    return (
      <div className="bg-white p-8 text-center">
        <p className="text-gray-500">Loading resume data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl w-full mx-auto min-h-[297mm] relative border border-gray-200 max-w-3xl sm:max-w-2xl md:max-w-3xl lg:max-w-3xl p-2 sm:p-4 md:p-8">
      {/* Resume Header */}
      <div className="p-2 sm:p-4 md:p-8 border-b border-gray-200">
        <div className="text-center">
          <EditableText
            field="personalInfo.name"
            value={resumeData.personalInfo.name}
            className="text-2xl sm:text-3xl font-bold text-gray-900 text-center"
            style={{ minHeight: "40px" }}
          />
          <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-600 space-y-2">
            <div className="flex flex-wrap justify-center gap-2 sm:gap-6">
              <EditableText
                field="personalInfo.email"
                value={resumeData.personalInfo.email}
                className="text-xs sm:text-sm text-center"
              />
              <span className="text-gray-400">•</span>
              <EditableText
                field="personalInfo.phone"
                value={resumeData.personalInfo.phone}
                className="text-xs sm:text-sm text-center"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-2 sm:gap-6">
              <EditableText
                field="personalInfo.location"
                value={resumeData.personalInfo.location}
                className="text-xs sm:text-sm text-center"
              />
              {resumeData.personalInfo.linkedin && (
                <>
                  <span className="text-gray-400">•</span>
                  <EditableText
                    field="personalInfo.linkedin"
                    value={resumeData.personalInfo.linkedin}
                    className="text-xs sm:text-sm text-center text-blue-600"
                  />
                </>
              )}
              {resumeData.personalInfo.website && (
                <>
                  <span className="text-gray-400">•</span>
                  <EditableText
                    field="personalInfo.website"
                    value={resumeData.personalInfo.website}
                    className="text-xs sm:text-sm text-center text-blue-600"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.professionalSummary && (
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            Professional Summary
          </h3>
          <EditableText
            field="professionalSummary"
            value={resumeData.professionalSummary}
            className="text-sm text-gray-700 leading-relaxed"
            multiline
            style={{ minHeight: "60px" }}
          />
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
            Professional Experience
          </h3>
          <div className="space-y-8">
            {resumeData.experience.map((exp, index) => (
              <div
                key={`exp-${index}-${exp.company}-${exp.title}`}
                className="relative"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <EditableText
                      field={`experience.${index}.title`}
                      value={exp.title}
                      className="text-base font-semibold text-gray-900"
                    />
                    <div className="flex items-center gap-2 mt-1">
                      <EditableText
                        field={`experience.${index}.company`}
                        value={exp.company}
                        className="text-sm font-medium text-gray-700"
                      />
                      <span className="text-gray-400">•</span>
                      <EditableText
                        field={`experience.${index}.location`}
                        value={exp.location}
                        className="text-sm text-gray-600"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 flex-shrink-0">
                    <EditableText
                      field={`experience.${index}.startDate`}
                      value={exp.startDate}
                      className="text-sm"
                    />
                    <span className="mx-1">-</span>
                    <EditableText
                      field={`experience.${index}.endDate`}
                      value={exp.endDate}
                      className="text-sm"
                    />
                  </div>
                </div>
                <ul className="space-y-2 ml-0">
                  {exp.achievements.map((achievement, achIndex) => (
                    <li
                      key={achIndex}
                      className="text-sm text-gray-700 flex items-start"
                    >
                      <span className="text-gray-400 mr-3 mt-0.5">•</span>
                      <EditableText
                        field={`experience.${index}.achievements.${achIndex}`}
                        value={achievement}
                        className="flex-1 text-sm leading-relaxed"
                        multiline
                        style={{ minHeight: "20px" }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {resumeData.projects && resumeData.projects.length > 0 && (
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
            Projects
          </h3>
          <div className="space-y-6">
            {resumeData.projects.map((project, index) => (
              <div key={index} className="relative">
                <EditableText
                  field={`projects.${index}.name`}
                  value={project.name}
                  className="text-base font-semibold text-gray-900"
                />
                <EditableText
                  field={`projects.${index}.description`}
                  value={project.description || ""}
                  className="text-sm text-gray-600 mt-1"
                  multiline
                />
                {project.technologies && (
                  <p className="text-sm text-gray-500 mt-2">
                    <strong>Technologies:</strong> {project.technologies}
                  </p>
                )}
                <ul className="space-y-1 mt-2">
                  {project.achievements?.map((achievement, achIndex) => (
                    <li
                      key={achIndex}
                      className="text-sm text-gray-700 flex items-start"
                    >
                      <span className="text-gray-400 mr-3 mt-0.5">•</span>
                      <EditableText
                        field={`projects.${index}.achievements.${achIndex}`}
                        value={achievement}
                        className="flex-1 text-sm leading-relaxed"
                        multiline
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.length > 0 && (
        <div className="p-8 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
            Education
          </h3>
          <div className="space-y-4">
            {resumeData.education.map((edu, index) => (
              <div key={`edu-${index}-${edu.institution}-${edu.degree}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <EditableText
                      field={`education.${index}.degree`}
                      value={edu.degree}
                      className="text-base font-semibold text-gray-900"
                    />
                    <EditableText
                      field={`education.${index}.institution`}
                      value={edu.institution}
                      className="text-sm font-medium text-gray-700 mt-1"
                    />
                    {edu.details && (
                      <EditableText
                        field={`education.${index}.details`}
                        value={edu.details}
                        className="text-sm text-gray-600 mt-1"
                      />
                    )}
                  </div>
                  <EditableText
                    field={`education.${index}.year`}
                    value={edu.year}
                    className="text-sm text-gray-600 flex-shrink-0"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resumeData.skills && (
        <div className="p-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
            Skills
          </h3>
          <div className="space-y-4">
            {resumeData.skills.technical &&
              resumeData.skills.technical.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Technical Skills
                  </p>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {resumeData.skills.technical.join(" • ")}
                  </div>
                </div>
              )}
            {resumeData.skills.certifications &&
              resumeData.skills.certifications.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Certifications
                  </p>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {resumeData.skills.certifications.join(" • ")}
                  </div>
                </div>
              )}
            {resumeData.skills.languages &&
              resumeData.skills.languages.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Languages
                  </p>
                  <div className="text-sm text-gray-700 leading-relaxed">
                    {resumeData.skills.languages.join(" • ")}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
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
  const [showTailoring, setShowTailoring] = useState(false);
  const [tailoringResult, setTailoringResult] = useState<any>(() => {
    if (typeof window === "undefined") return null;
    const saved = sessionStorage.getItem("tailoringResult");
    return saved ? JSON.parse(saved) : null;
  });
  const { refetch: refetchCredits } = useUserCredits();

  const originalResume = useRef<ImprovedResume | null>(null);

  useEffect(() => {
    if (tailoringResult) {
      sessionStorage.setItem(
        "tailoringResult",
        JSON.stringify(tailoringResult)
      );
    }
  }, [tailoringResult]);

  useEffect(() => {
    const storedContext = sessionStorage.getItem("streamingImprovementContext");
    if (storedContext) {
      try {
        const parsedContext: StreamingContext = JSON.parse(storedContext);

        if (parsedContext.improvement) {
          setStreamingData(parsedContext);
          setEditableResume(parsedContext.improvement);
          originalResume.current = parsedContext.improvement;

          if (parsedContext.tailoringResult) {
            setTailoringResult(parsedContext.tailoringResult);
          }
          if (parsedContext.highlightedFields) {
            setHighlightedFields(parsedContext.highlightedFields);
          }
        } else {
          console.error("No improvement object in parsed context");
          router.push("/dashboard");
        }
      } catch (error) {
        console.error("Failed to parse streaming context:", error);
        router.push("/dashboard");
      }
    } else {
      router.push("/dashboard");
    }
  }, [router]);

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

  const handleTailoringComplete = (tailoringResult: any) => {
    console.log("Tailoring complete:", tailoringResult);

    if (tailoringResult.tailoredResume) {
      setEditableResume(tailoringResult.tailoredResume);
    }

    if (tailoringResult.tailoringAnalysis) {
      setTailoringAnalysis(tailoringResult.tailoringAnalysis);
      const keywords = tailoringResult.tailoringAnalysis.keywordAlignment || [];
      const newKeywordHighlights = keywords.map(
        (keyword: string) => `keyword:${keyword}`
      );

      // Preserve AI improvement highlights and add new keyword highlights
      setHighlightedFields((prev) => [
        ...prev.filter((field) => !field.startsWith("keyword:")),
        ...newKeywordHighlights,
      ]);
    }

    if (tailoringResult.coverLetter) {
      setCoverLetter(tailoringResult.coverLetter);
      setActiveTab("coverLetter");
    }

    setIsTailoring(false);
    setShowTailoring(false); // Optionally close the tailoring view
    toast.success("Resume tailored successfully!");
    refetchCredits(); // Refetch credits after tailoring

    // Save tailored resume as the new "original" for further tailoring
    originalResume.current = tailoringResult.tailoredResume;
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
      <div className="max-w-7xl mx-auto py-4 px-2 sm:py-6 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              AI-Improved Resume
            </h1>
            <p className="text-gray-600 text-sm">
              {streamingData.targetRole} • {streamingData.targetIndustry}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button
              onClick={() => setIsFavorite(!isFavorite)}
              variant={isFavorite ? "default" : "outline"}
              size="sm"
              className="w-full sm:w-auto"
            >
              <Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} />
            </Button>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("docx")}
                disabled={isDownloading}
                className="w-full sm:w-auto"
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
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
                <Badge variant="secondary" className="ml-2 text-xs">
                  Soon
                </Badge>
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGoBack}
              className="w-full sm:w-auto"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Dashboard
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Left Column - Resume Preview (takes 2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="h-fit bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200 shadow-xl">
              <CardHeader className="bg-white border-b border-blue-100">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
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
              <CardContent className="p-2 sm:p-4">
                {activeTab === "resume" ? (
                  <div className="rounded-lg overflow-x-auto relative">
                    <div
                      className={`transition-all duration-300 ${
                        isTailoring ? "blur-sm opacity-50" : ""
                      }`}
                    >
                      <ResumePreview
                        resumeData={editableResume}
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
                  <div className="p-2 sm:p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="prose max-w-none">
                      {highlightedFields.some((field) =>
                        field.startsWith("keyword:")
                      ) ? (
                        <div
                          className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed"
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
                        <pre className="whitespace-pre-wrap text-xs sm:text-sm text-gray-700 font-sans leading-relaxed">
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
          <div className="lg:col-span-1 space-y-4 mt-4 lg:mt-0">
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
          </div>
        </div>
      </div>
    </div>
  );
}
