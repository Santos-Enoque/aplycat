"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  FileType,
  MoreHorizontal,
  Plus,
  RefreshCw,
} from "lucide-react";
import { EnhancedLoading } from "@/components/enhanced-loading";
import { ImprovedResume, Experience, Education } from "@/types/improved-resume";

interface ImprovedResumeProps {
  params: Promise<{ improvedResumeId: string }>;
}

interface ImprovedResumeData {
  id: string;
  resumeId: string;
  version: number;
  versionName?: string;
  targetRole: string;
  targetIndustry: string;
  customPrompt?: string;
  improvedResumeData: ImprovedResume;
  improvementSummary?: string;
  keyChanges?: { changes: string[] };
  originalScore?: number;
  improvedScore?: number;
  improvementPercentage?: number;
  fileName?: string;
  creditsUsed: number;
  processingTimeMs?: number;
  isFavorite: boolean;
  createdAt: string;
  resume: {
    id: string;
    fileName: string;
    title?: string;
  };
}

interface EditableResumeData extends ImprovedResume {
  _hasChanges?: boolean;
}

// ATS-Friendly Resume Preview Component
function ResumePreview({
  resumeData,
  onEdit,
  highlightedFields = [],
}: {
  resumeData: EditableResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
}) {
  const isHighlighted = (field: string) => {
    return highlightedFields.some((highlightedField) => {
      // Skip keyword highlights for field-level highlighting
      if (highlightedField.startsWith("keyword:")) return false;

      // Exact match
      if (highlightedField === field) return true;

      // Partial match for general patterns (e.g., 'experience.achievements' matches 'experience.0.achievements.1')
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
    const keywords = highlightedFields
      .filter((field) => field.startsWith("keyword:"))
      .map((field) => field.replace("keyword:", ""));

    if (keywords.length === 0) return text;

    let highlightedText = text;
    keywords.forEach((keyword) => {
      // Escape special regex characters
      const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b(${escapedKeyword})\\b`, "gi");
      highlightedText = highlightedText.replace(
        regex,
        '<span class="bg-green-200 text-green-800 px-1 rounded font-medium">$1</span>'
      );
    });
    return highlightedText;
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
          // Place cursor at end of text
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
        if (newValue !== value) {
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
          editableRef.current.innerText = value;
        }
        setIsEditing(false);
      }
    };

    const handleInput = () => {
      // Auto-adjust height for multiline content
      if (multiline && editableRef.current) {
        editableRef.current.style.height = "auto";
        editableRef.current.style.height =
          editableRef.current.scrollHeight + "px";
      }
    };

    const displayValue =
      hasKeywordHighlights && !isEditing ? highlightKeywords(value) : value;

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

    // Return different JSX structures to avoid dangerouslySetInnerHTML + children conflict
    if (!isEditing && hasKeywordHighlights) {
      // Use dangerouslySetInnerHTML with NO children - UI elements outside
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
            onInput={handleInput}
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

    // Normal rendering without dangerouslySetInnerHTML
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
        onInput={handleInput}
        title={isEditing ? "" : "Click to edit"}
        role="textbox"
        aria-label={`Edit ${field}`}
      >
        {isEditing ? (
          value
        ) : (
          <>
            {value}
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

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white shadow-xl max-w-3xl mx-auto min-h-[297mm] relative border border-blue-100">
      {/* Resume Header */}
      <div className="p-8 border-b border-gray-200">
        <div className="text-center">
          <EditableText
            field="personalInfo.name"
            value={resumeData.personalInfo.name}
            className="text-3xl font-bold text-gray-900 text-center"
            style={{ minHeight: "40px" }}
          />
          <div className="mt-4 text-sm text-gray-600 space-y-2">
            <div className="flex justify-center gap-6 flex-wrap">
              <EditableText
                field="personalInfo.email"
                value={resumeData.personalInfo.email}
                className="text-sm text-center"
              />
              <span className="text-gray-400">•</span>
              <EditableText
                field="personalInfo.phone"
                value={resumeData.personalInfo.phone}
                className="text-sm text-center"
              />
            </div>
            <div className="flex justify-center gap-6 flex-wrap">
              <EditableText
                field="personalInfo.location"
                value={resumeData.personalInfo.location}
                className="text-sm text-center"
              />
              {resumeData.personalInfo.linkedin && (
                <>
                  <span className="text-gray-400">•</span>
                  <EditableText
                    field="personalInfo.linkedin"
                    value={resumeData.personalInfo.linkedin}
                    className="text-sm text-center text-blue-600"
                  />
                </>
              )}
              {resumeData.personalInfo.website && (
                <>
                  <span className="text-gray-400">•</span>
                  <EditableText
                    field="personalInfo.website"
                    value={resumeData.personalInfo.website}
                    className="text-sm text-center text-blue-600"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
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

      {/* Experience */}
      <div className="p-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
          Professional Experience
        </h3>
        <div className="space-y-8">
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="relative">
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

      {/* Education */}
      <div className="p-8 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
          Education
        </h3>
        <div className="space-y-4">
          {resumeData.education.map((edu, index) => (
            <div key={index}>
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

      {/* Skills */}
      <div className="p-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
          Skills
        </h3>
        <div className="space-y-4">
          {resumeData.skills.technical.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Technical Skills
              </p>
              <div className="text-sm text-gray-700 leading-relaxed">
                {resumeData.skills.technical.join(" • ")}
              </div>
            </div>
          )}
          {resumeData.skills.certifications.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Certifications
              </p>
              <div className="text-sm text-gray-700 leading-relaxed">
                {resumeData.skills.certifications.join(" • ")}
              </div>
            </div>
          )}
          {(resumeData.skills.otherRelevantSkills?.length ?? 0) > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Additional Skills
              </p>
              <div className="text-sm text-gray-700 leading-relaxed">
                {resumeData.skills.otherRelevantSkills?.join(" • ")}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Tailoring Component
function TailoringComponent({
  currentResume,
  onTailor,
  improvedResumeId,
}: {
  currentResume: EditableResumeData;
  onTailor: (data: any) => void;
  improvedResumeId: string;
}) {
  const [jobUrl, setJobUrl] = useState("");
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTailor = async () => {
    if (!jobUrl.trim()) return;

    setIsLoading(true);
    try {
      // First extract job information from URL
      const extractResponse = await fetch("/api/extract-job-info", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobUrl }),
      });

      if (!extractResponse.ok) {
        throw new Error("Failed to extract job information");
      }

      const jobInfo = await extractResponse.json();

      if (jobInfo.message) {
        throw new Error(
          "Could not find job posting information at the provided URL"
        );
      }

      // Then tailor the resume using extracted information
      const response = await fetch("/api/tailor-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentResume,
          jobDescription: jobInfo.job_description,
          jobTitle: jobInfo.job_title,
          companyName: jobInfo.company_name,
          includeCoverLetter,
          improvedResumeId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onTailor(result);
      }
    } catch (error) {
      console.error("Failed to tailor resume:", error);
      alert(error instanceof Error ? error.message : "Failed to tailor resume");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          Tailor for Specific Job
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="jobUrl">Job Posting URL</Label>
          <Input
            id="jobUrl"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://company.com/jobs/..."
            type="url"
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste the URL of the job posting you want to tailor for
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="coverLetter"
            checked={includeCoverLetter}
            onChange={(e) => setIncludeCoverLetter(e.target.checked)}
            className="rounded"
          />
          <Label htmlFor="coverLetter">Generate Cover Letter</Label>
        </div>
        <Button
          onClick={handleTailor}
          disabled={!jobUrl.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Job & Tailoring...
            </>
          ) : (
            <>
              <Briefcase className="h-4 w-4 mr-2" />
              Tailor Resume
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Custom Prompt Component
function CustomPromptComponent({
  currentResume,
  onImprove,
  improvedResumeId,
}: {
  currentResume: EditableResumeData;
  onImprove: (data: any) => void;
  improvedResumeId: string;
}) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleImprove = async () => {
    if (!customPrompt.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/improve-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileData: btoa(JSON.stringify(currentResume)),
          fileName: "current-resume.json",
          targetRole:
            currentResume.improvementsAnalysis?.analysisHeadline ||
            "General Improvement",
          targetIndustry: "General",
          customPrompt,
          versionName: `Custom: ${customPrompt.substring(0, 30)}...`,
          improvedResumeId,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        onImprove(result);
      }
    } catch (error) {
      console.error("Failed to improve resume:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Edit3 className="h-5 w-5 text-blue-600" />
          Custom Improvement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="customPrompt">Custom Instructions</Label>
          <Textarea
            id="customPrompt"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="E.g., 'Make it more technical', 'Focus on leadership', 'Add more metrics'..."
            className="min-h-[100px]"
          />
        </div>
        <Button
          onClick={handleImprove}
          disabled={!customPrompt.trim() || isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Improving Resume...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Improve Resume
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ImprovedResumePage({ params }: ImprovedResumeProps) {
  const router = useRouter();
  const [improvedResumeId, setImprovedResumeId] = useState<string | null>(null);
  const [improvedResume, setImprovedResume] =
    useState<ImprovedResumeData | null>(null);
  const [editableResume, setEditableResume] =
    useState<EditableResumeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"resume" | "coverLetter">(
    "resume"
  );
  const [coverLetter, setCoverLetter] = useState<string | null>(null);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);
  const [tailoringAnalysis, setTailoringAnalysis] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    async function getParams() {
      const resolvedParams = await params;
      setImprovedResumeId(resolvedParams.improvedResumeId);
    }
    getParams();
  }, [params]);

  useEffect(() => {
    if (improvedResumeId) {
      fetchImprovedResume();
    }
  }, [improvedResumeId]);

  const fetchImprovedResume = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/improved-resumes/${improvedResumeId}`);

      if (!response.ok) {
        throw new Error("Failed to fetch improved resume");
      }

      const result = await response.json();
      setImprovedResume(result.improvedResume);
      setEditableResume(result.improvedResume.improvedResumeData);

      // Extract highlighted fields from analysis
      const analysis =
        result.improvedResume.improvedResumeData?.improvementsAnalysis;
      if (analysis?.keyRevisionsImplemented) {
        // Detect fields with AI-added content
        const highlighted: string[] = [];
        const resumeData = result.improvedResume.improvedResumeData;

        // Check for illustrative metrics in the content
        const contentString = JSON.stringify(resumeData);
        if (contentString.includes("[Illustrative:")) {
          // Look for illustrative metrics in experience achievements
          resumeData.experience?.forEach((exp: any, expIndex: number) => {
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

        // Check for AI-added keywords based on key revisions
        analysis.keyRevisionsImplemented.forEach((revision: string) => {
          if (
            revision.toLowerCase().includes("illustrative") ||
            revision.toLowerCase().includes("metrics") ||
            revision.toLowerCase().includes("quantified")
          ) {
            // Add general experience achievements highlighting
            highlighted.push("experience.achievements");
          }
          if (
            revision.toLowerCase().includes("summary") ||
            revision.toLowerCase().includes("professional summary")
          ) {
            highlighted.push("professionalSummary");
          }
        });

        setHighlightedFields([...new Set(highlighted)]); // Remove duplicates
      }
    } catch (err: any) {
      setError(
        err.message || "An error occurred while loading the improved resume"
      );
    } finally {
      setLoading(false);
    }
  };

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

  const saveChanges = async () => {
    if (!editableResume?._hasChanges || !improvedResume) return;

    try {
      const response = await fetch(
        `/api/improved-resumes/${improvedResumeId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            improvedResumeData: editableResume,
          }),
        }
      );

      if (response.ok) {
        const updatedResume = { ...editableResume };
        delete updatedResume._hasChanges;
        setEditableResume(updatedResume);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
    }
  };

  const handleTailor = (tailoringResult: any) => {
    if (tailoringResult.tailoredResume) {
      setEditableResume(tailoringResult.tailoredResume);
    }

    // Store tailoring analysis for keyword highlighting and display
    if (tailoringResult.tailoringAnalysis) {
      setTailoringAnalysis(tailoringResult.tailoringAnalysis);
      // Set highlighted fields based on emphasized skills and keywords
      const keywords = tailoringResult.tailoringAnalysis.keywordAlignment || [];
      setHighlightedFields(
        keywords.map((keyword: string) => `keyword:${keyword}`)
      );
    }

    if (tailoringResult.coverLetter) {
      setCoverLetter(tailoringResult.coverLetter);
      setActiveTab("coverLetter");
    }

    // Store the tailoring result for display instead of redirecting
    if (tailoringResult.tailoredResumeId) {
      // Store in local state instead of redirecting immediately
      console.log("Tailored resume created:", tailoringResult.tailoredResumeId);
    }
  };

  const handleCustomImprove = (improvementResult: any) => {
    if (improvementResult.improvedResume) {
      setEditableResume(improvementResult.improvedResume);
    }

    // Store the improvement result for display instead of redirecting
    if (improvementResult.improvedResumeId) {
      // Store in local state instead of redirecting immediately
      console.log(
        "Improved resume created:",
        improvementResult.improvedResumeId
      );
    }
  };

  const handleToggleFavorite = async () => {
    if (!improvedResume) return;

    try {
      const response = await fetch(
        `/api/improved-resumes/${improvedResumeId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            isFavorite: !improvedResume.isFavorite,
          }),
        }
      );

      if (response.ok) {
        setImprovedResume((prev) =>
          prev ? { ...prev, isFavorite: !prev.isFavorite } : null
        );
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
    }
  };

  const handleDownload = async (format: "docx" | "pdf") => {
    if (!improvedResume || !editableResume) return;

    setIsDownloading(true);
    try {
      const response = await fetch(`/api/download-resume`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          resumeData: editableResume,
          format: format,
          fileName:
            improvedResume.versionName || `resume-v${improvedResume.version}`,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate download");
      }

      // Get the blob and create download link
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${
        improvedResume.versionName || `resume-v${improvedResume.version}`
      }.${format}`;
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

  const handleGoBack = () => {
    if (improvedResume) {
      const params = new URLSearchParams({
        resumeId: improvedResume.resumeId,
        fileName: encodeURIComponent(improvedResume.resume.fileName),
      });
      router.push(`/analyze?${params.toString()}`);
    } else {
      router.push("/dashboard");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <EnhancedLoading title="Loading Resume" type="analysis" />
      </div>
    );
  }

  if (error || !improvedResume || !editableResume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
          <div className="text-6xl mb-4">😿</div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">
            {error || "Resume not found"}
          </h3>
          <Button onClick={() => router.push("/dashboard")}>
            ← Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {improvedResume.versionName ||
                `Version ${improvedResume.version}`}
            </h1>
            <p className="text-gray-600">
              {improvedResume.targetRole} • {improvedResume.targetIndustry}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {editableResume._hasChanges && (
              <Button onClick={saveChanges} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}
            <Button
              onClick={handleToggleFavorite}
              variant={improvedResume.isFavorite ? "default" : "outline"}
              size="sm"
            >
              <Star
                className={`h-4 w-4 ${
                  improvedResume.isFavorite ? "fill-current" : ""
                }`}
              />
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
                DOCX
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
            <Button variant="outline" size="sm" disabled>
              <Share className="h-4 w-4 mr-2" />
              Share
              <Badge variant="secondary" className="ml-2 text-xs">
                Soon
              </Badge>
            </Button>
            <Button variant="outline" size="sm" disabled>
              <Layout className="h-4 w-4 mr-2" />
              Templates
              <Badge variant="secondary" className="ml-2 text-xs">
                Soon
              </Badge>
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
                  <div className="rounded-lg overflow-hidden">
                    <ResumePreview
                      resumeData={editableResume}
                      onEdit={handleEditResume}
                      highlightedFields={highlightedFields}
                    />
                  </div>
                ) : (
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-100 shadow-sm">
                    <div className="prose max-w-none">
                      {highlightedFields.some((field) =>
                        field.startsWith("keyword:")
                      ) ? (
                        <div
                          className="whitespace-pre-wrap text-sm text-gray-700 font-sans"
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
                        <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                          {coverLetter}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Improvement Tools & Stats (takes 1/3 width) */}
          <div className="lg:col-span-1 space-y-4">
            {improvedResumeId && (
              <>
                {/* Tailor by Job Title - Priority 1 */}
                <TailoringComponent
                  currentResume={editableResume}
                  onTailor={handleTailor}
                  improvedResumeId={improvedResumeId}
                />

                {/* Custom Improvement - Priority 2 */}
                <CustomPromptComponent
                  currentResume={editableResume}
                  onImprove={handleCustomImprove}
                  improvedResumeId={improvedResumeId}
                />
              </>
            )}

            {/* Tailoring Analysis - Show keywords and analysis */}
            {tailoringAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-600" />
                    Tailoring Analysis
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
                        <h4 className="font-medium text-green-800 mb-2">
                          🎯 Keywords Integrated:
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {tailoringAnalysis.keywordAlignment.map(
                            (keyword: string, index: number) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-green-100 text-green-800 text-xs"
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
                        <h4 className="font-medium text-blue-800 mb-2">
                          ⭐ Emphasized Skills:
                        </h4>
                        <ul className="space-y-1">
                          {tailoringAnalysis.emphasizedSkills.map(
                            (skill: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-blue-700 flex items-start gap-2"
                              >
                                <span className="text-blue-600 mt-1">•</span>
                                <span>{skill}</span>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}

                  {tailoringAnalysis.prioritizedExperience &&
                    tailoringAnalysis.prioritizedExperience.length > 0 && (
                      <div>
                        <h4 className="font-medium text-purple-800 mb-2">
                          🔝 Prioritized Experience:
                        </h4>
                        <ul className="space-y-1">
                          {tailoringAnalysis.prioritizedExperience
                            .slice(0, 3)
                            .map((exp: string, index: number) => (
                              <li
                                key={index}
                                className="text-sm text-purple-700 flex items-start gap-2"
                              >
                                <span className="text-purple-600 mt-1">•</span>
                                <span>{exp}</span>
                              </li>
                            ))}
                        </ul>
                      </div>
                    )}
                </CardContent>
              </Card>
            )}

            {/* Version Stats - Priority 3 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                  Version Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Version</p>
                  <p className="text-xl font-bold">{improvedResume.version}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Target Role</p>
                  <p className="font-medium text-sm">
                    {improvedResume.targetRole}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Industry</p>
                  <p className="font-medium text-sm">
                    {improvedResume.targetIndustry}
                  </p>
                </div>
                {(improvedResume.originalScore ||
                  improvedResume.improvedScore) && (
                  <>
                    {improvedResume.originalScore && (
                      <div>
                        <p className="text-sm text-gray-500">Original Score</p>
                        <p className="text-lg font-bold text-red-600">
                          {improvedResume.originalScore}/100
                        </p>
                      </div>
                    )}
                    {improvedResume.improvedScore && (
                      <div>
                        <p className="text-sm text-gray-500">Improved Score</p>
                        <p className="text-lg font-bold text-green-600">
                          {improvedResume.improvedScore}/100
                        </p>
                      </div>
                    )}
                    {improvedResume.improvementPercentage && (
                      <div>
                        <p className="text-sm text-gray-500">Improvement</p>
                        <p className="text-md font-bold text-blue-600">
                          +{improvedResume.improvementPercentage.toFixed(1)}%
                        </p>
                      </div>
                    )}
                  </>
                )}
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium text-sm">
                    {new Date(improvedResume.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Credits Used</p>
                  <p className="font-medium text-sm">
                    {improvedResume.creditsUsed}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
