"use client";

import { useState, useEffect } from "react";
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
  const [editingField, setEditingField] = useState<string | null>(null);

  const isHighlighted = (field: string) => {
    return highlightedFields.some((highlightedField) => {
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

  const EditableText = ({
    field,
    value,
    className = "",
    multiline = false,
  }: {
    field: string;
    value: string;
    className?: string;
    multiline?: boolean;
  }) => {
    const [tempValue, setTempValue] = useState(value);

    if (editingField === field) {
      return multiline ? (
        <Textarea
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            onEdit(field, tempValue);
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.ctrlKey) {
              onEdit(field, tempValue);
              setEditingField(null);
            }
            if (e.key === "Escape") {
              setTempValue(value);
              setEditingField(null);
            }
          }}
          className="min-h-[80px] resize-none"
          autoFocus
        />
      ) : (
        <Input
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={() => {
            onEdit(field, tempValue);
            setEditingField(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onEdit(field, tempValue);
              setEditingField(null);
            }
            if (e.key === "Escape") {
              setTempValue(value);
              setEditingField(null);
            }
          }}
          className={className}
          autoFocus
        />
      );
    }

    return (
      <div
        className={`${className} cursor-pointer hover:bg-gray-50 rounded px-1 py-0.5 transition-colors group relative ${
          isHighlighted(field) ? "bg-yellow-100 border border-yellow-300" : ""
        }`}
        onClick={() => setEditingField(field)}
        title="Click to edit"
      >
        {value}
        <Edit3 className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 absolute top-0 right-0 transition-opacity" />
        {isHighlighted(field) && (
          <Badge
            variant="secondary"
            className="absolute -top-2 -right-2 text-xs"
          >
            AI Added
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white shadow-lg max-w-3xl mx-auto">
      {/* Resume Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="text-center">
          <EditableText
            field="personalInfo.name"
            value={resumeData.personalInfo.name}
            className="text-2xl font-bold text-gray-900 text-center border-0 focus:ring-0"
          />
          <div className="mt-2 text-sm text-gray-600 space-y-1">
            <div className="flex justify-center gap-4 flex-wrap">
              <EditableText
                field="personalInfo.email"
                value={resumeData.personalInfo.email}
                className="text-sm border-0 focus:ring-0 text-center"
              />
              <EditableText
                field="personalInfo.phone"
                value={resumeData.personalInfo.phone}
                className="text-sm border-0 focus:ring-0 text-center"
              />
            </div>
            <div className="flex justify-center gap-4 flex-wrap">
              <EditableText
                field="personalInfo.location"
                value={resumeData.personalInfo.location}
                className="text-sm border-0 focus:ring-0 text-center"
              />
              {resumeData.personalInfo.linkedin && (
                <EditableText
                  field="personalInfo.linkedin"
                  value={resumeData.personalInfo.linkedin}
                  className="text-sm border-0 focus:ring-0 text-center"
                />
              )}
              {resumeData.personalInfo.website && (
                <EditableText
                  field="personalInfo.website"
                  value={resumeData.personalInfo.website}
                  className="text-sm border-0 focus:ring-0 text-center"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Professional Summary
        </h3>
        <EditableText
          field="professionalSummary"
          value={resumeData.professionalSummary}
          className="text-sm text-gray-700 leading-relaxed border-0 focus:ring-0"
          multiline
        />
      </div>

      {/* Experience */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Professional Experience
        </h3>
        <div className="space-y-6">
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="border-l-2 border-gray-200 pl-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <EditableText
                    field={`experience.${index}.title`}
                    value={exp.title}
                    className="text-base font-semibold text-gray-900 border-0 focus:ring-0"
                  />
                  <EditableText
                    field={`experience.${index}.company`}
                    value={exp.company}
                    className="text-sm font-medium text-gray-700 border-0 focus:ring-0"
                  />
                  <EditableText
                    field={`experience.${index}.location`}
                    value={exp.location}
                    className="text-sm text-gray-600 border-0 focus:ring-0"
                  />
                </div>
                <div className="text-sm text-gray-600">
                  <EditableText
                    field={`experience.${index}.startDate`}
                    value={exp.startDate}
                    className="text-sm border-0 focus:ring-0"
                  />
                  {" - "}
                  <EditableText
                    field={`experience.${index}.endDate`}
                    value={exp.endDate}
                    className="text-sm border-0 focus:ring-0"
                  />
                </div>
              </div>
              <ul className="space-y-1 ml-2">
                {exp.achievements.map((achievement, achIndex) => (
                  <li
                    key={achIndex}
                    className="text-sm text-gray-700 flex items-start"
                  >
                    <span className="text-gray-400 mr-2">•</span>
                    <EditableText
                      field={`experience.${index}.achievements.${achIndex}`}
                      value={achievement}
                      className="flex-1 text-sm border-0 focus:ring-0"
                      multiline
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Education</h3>
        <div className="space-y-4">
          {resumeData.education.map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between items-start">
                <div>
                  <EditableText
                    field={`education.${index}.degree`}
                    value={edu.degree}
                    className="text-base font-semibold text-gray-900 border-0 focus:ring-0"
                  />
                  <EditableText
                    field={`education.${index}.institution`}
                    value={edu.institution}
                    className="text-sm font-medium text-gray-700 border-0 focus:ring-0"
                  />
                  {edu.details && (
                    <EditableText
                      field={`education.${index}.details`}
                      value={edu.details}
                      className="text-sm text-gray-600 border-0 focus:ring-0"
                    />
                  )}
                </div>
                <EditableText
                  field={`education.${index}.year`}
                  value={edu.year}
                  className="text-sm text-gray-600 border-0 focus:ring-0"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
        <div className="space-y-3">
          {resumeData.skills.technical.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Technical Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.technical.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {resumeData.skills.certifications.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Certifications
              </p>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {resumeData.skills.otherRelevantSkills.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Additional Skills
              </p>
              <div className="flex flex-wrap gap-2">
                {resumeData.skills.otherRelevantSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
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
    if (tailoringResult.coverLetter) {
      setCoverLetter(tailoringResult.coverLetter);
      setActiveTab("coverLetter");
    }

    // If a new version was created, navigate to it
    if (tailoringResult.tailoredResumeId) {
      // Give user a moment to see the result, then navigate
      setTimeout(() => {
        router.push(`/improved-resume/${tailoringResult.tailoredResumeId}`);
      }, 2000);
    }
  };

  const handleCustomImprove = (improvementResult: any) => {
    if (improvementResult.improvedResume) {
      setEditableResume(improvementResult.improvedResume);
    }

    // If a new version was created, navigate to it
    if (improvementResult.improvedResumeId) {
      // Give user a moment to see the result, then navigate
      setTimeout(() => {
        router.push(`/improved-resume/${improvementResult.improvedResumeId}`);
      }, 2000);
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
          <div className="flex items-center gap-4">
            <Button onClick={handleGoBack} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Analysis
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {improvedResume.versionName ||
                  `Version ${improvedResume.version}`}
              </h1>
              <p className="text-gray-600">
                {improvedResume.targetRole} • {improvedResume.targetIndustry}
              </p>
            </div>
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
            <Button variant="outline" size="sm" disabled>
              <Download className="h-4 w-4 mr-2" />
              Download
              <Badge variant="secondary" className="ml-2 text-xs">
                Soon
              </Badge>
            </Button>
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
            <Card className="h-fit">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
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
              <CardContent className="p-0">
                {activeTab === "resume" ? (
                  <ResumePreview
                    resumeData={editableResume}
                    onEdit={handleEditResume}
                    highlightedFields={highlightedFields}
                  />
                ) : (
                  <div className="p-6 bg-white">
                    <div className="prose max-w-none">
                      <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                        {coverLetter}
                      </pre>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Stats & Actions (takes 1/3 width) */}
          <div className="lg:col-span-1 space-y-4">
            {/* Version Stats */}
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

            {improvedResumeId && (
              <>
                <TailoringComponent
                  currentResume={editableResume}
                  onTailor={handleTailor}
                  improvedResumeId={improvedResumeId}
                />

                <CustomPromptComponent
                  currentResume={editableResume}
                  onImprove={handleCustomImprove}
                  improvedResumeId={improvedResumeId}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
