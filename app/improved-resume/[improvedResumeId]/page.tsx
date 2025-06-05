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
  Palette,
  X,
  Check,
  Crown,
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

interface Template {
  id: string;
  name: string;
  description: string;
  isPremium: boolean;
  creditCost: number;
  previewImage?: string;
}

const RESUME_TEMPLATES: Template[] = [
  {
    id: "modern",
    name: "Modern",
    description: "Clean and professional ATS-friendly design",
    isPremium: false,
    creditCost: 0,
  },
  {
    id: "executive",
    name: "Executive",
    description: "Sophisticated layout for senior professionals",
    isPremium: true,
    creditCost: 1,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Eye-catching design for creative industries",
    isPremium: true,
    creditCost: 1,
  },
];

// Sample data for template previews
const SAMPLE_DATA = {
  fullName: "John Doe",
  title: "Software Engineer",
  email: "john.doe@email.com",
  phone: "(555) 123-4567",
  location: "San Francisco, CA",
  linkedinUrl: "linkedin.com/in/johndoe",
  professionalSummary:
    "Experienced software engineer with 5+ years developing scalable web applications.",
  experience: [
    {
      company: "Tech Corp",
      position: "Senior Software Engineer",
      startDate: "2022",
      endDate: "Present",
      achievements: [
        "Led team of 5 developers",
        "Increased performance by 40%",
      ],
    },
  ],
  education: [
    {
      institution: "University of Technology",
      degree: "Bachelor of Computer Science",
      graduationDate: "2020",
    },
  ],
  skills: ["JavaScript", "React", "Node.js", "Python"],
};

// Template Components
function ModernTemplate({
  data,
  isPreview = false,
}: {
  data: any;
  isPreview?: boolean;
}) {
  const containerClass = isPreview
    ? "bg-white border border-gray-200 rounded p-2 text-xs h-32 overflow-hidden"
    : "bg-white shadow-xl max-w-3xl mx-auto min-h-[297mm] relative border border-blue-100";
  const textSizes = isPreview
    ? { h1: "text-sm font-bold", h2: "text-xs font-semibold", body: "text-xs" }
    : {
        h1: "text-2xl font-bold",
        h2: "text-lg font-semibold",
        body: "text-sm",
      };

  return (
    <div className={containerClass}>
      <div className={isPreview ? "p-1" : "p-8 border-b border-gray-200"}>
        <h1 className={`${textSizes.h1} text-gray-900`}>{data.fullName}</h1>
        <p className={`${textSizes.body} text-gray-600`}>{data.title}</p>
        <div className={`${textSizes.body} text-gray-500 mt-1`}>
          {data.email} • {data.phone} • {data.location}
        </div>
      </div>

      {!isPreview && (
        <>
          <div className="p-8 border-b border-gray-200">
            <h2 className={`${textSizes.h2} text-gray-900 mb-4`}>
              Professional Summary
            </h2>
            <p className={`${textSizes.body} text-gray-700`}>
              {data.professionalSummary}
            </p>
          </div>

          <div className="p-8">
            <h2 className={`${textSizes.h2} text-gray-900 mb-4`}>Experience</h2>
            {data.experience?.map((exp: any, i: number) => (
              <div key={i} className="mb-4">
                <h3 className="font-semibold">{exp.position}</h3>
                <p className="text-gray-600">
                  {exp.company} • {exp.startDate} - {exp.endDate}
                </p>
                <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                  {exp.achievements?.map((achievement: string, j: number) => (
                    <li key={j}>{achievement}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ExecutiveTemplate({
  data,
  isPreview = false,
}: {
  data: any;
  isPreview?: boolean;
}) {
  const containerClass = isPreview
    ? "bg-gradient-to-r from-slate-50 to-blue-50 border border-gray-300 rounded p-2 text-xs h-32 overflow-hidden"
    : "bg-gradient-to-r from-slate-50 to-blue-50 shadow-xl max-w-3xl mx-auto min-h-[297mm] relative border border-slate-200";
  const textSizes = isPreview
    ? { h1: "text-sm font-bold", h2: "text-xs font-semibold", body: "text-xs" }
    : {
        h1: "text-3xl font-bold",
        h2: "text-xl font-semibold",
        body: "text-sm",
      };

  return (
    <div className={containerClass}>
      <div
        className={
          isPreview
            ? "bg-slate-800 text-white p-1"
            : "bg-slate-800 text-white p-8"
        }
      >
        <h1 className={`${textSizes.h1}`}>{data.fullName}</h1>
        <p className={`${textSizes.body} text-slate-200 mt-1`}>{data.title}</p>
        <div className={`${textSizes.body} text-slate-300 mt-1`}>
          {data.email} • {data.phone} • {data.location}
        </div>
      </div>

      {!isPreview && (
        <>
          <div className="p-8 bg-white border-l-4 border-slate-600">
            <h2 className={`${textSizes.h2} text-slate-800 mb-4`}>
              Executive Summary
            </h2>
            <p className={`${textSizes.body} text-slate-700 leading-relaxed`}>
              {data.professionalSummary}
            </p>
          </div>

          <div className="p-8 bg-white">
            <h2
              className={`${textSizes.h2} text-slate-800 mb-6 border-b-2 border-slate-600 pb-2`}
            >
              Professional Experience
            </h2>
            {data.experience?.map((exp: any, i: number) => (
              <div key={i} className="mb-6 bg-slate-50 p-4 rounded-lg">
                <h3 className="font-bold text-slate-800">{exp.position}</h3>
                <p className="text-slate-600 font-medium">
                  {exp.company} • {exp.startDate} - {exp.endDate}
                </p>
                <ul className="list-disc list-inside mt-3 text-sm text-slate-700 space-y-1">
                  {exp.achievements?.map((achievement: string, j: number) => (
                    <li key={j}>{achievement}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function CreativeTemplate({
  data,
  isPreview = false,
}: {
  data: any;
  isPreview?: boolean;
}) {
  const containerClass = isPreview
    ? "bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-300 rounded p-2 text-xs h-32 overflow-hidden"
    : "bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl max-w-3xl mx-auto min-h-[297mm] relative border border-purple-200";
  const textSizes = isPreview
    ? { h1: "text-sm font-bold", h2: "text-xs font-semibold", body: "text-xs" }
    : {
        h1: "text-3xl font-bold",
        h2: "text-xl font-semibold",
        body: "text-sm",
      };

  return (
    <div className={containerClass}>
      <div
        className={
          isPreview
            ? "text-center p-1"
            : "text-center p-8 border-b-4 border-purple-400"
        }
      >
        <h1 className={`${textSizes.h1} text-purple-800`}>{data.fullName}</h1>
        <p className={`${textSizes.body} text-purple-600 font-medium mt-1`}>
          {data.title}
        </p>
        <div className={`${textSizes.body} text-purple-500 mt-1`}>
          {data.email} • {data.phone} • {data.location}
        </div>
      </div>

      {!isPreview && (
        <>
          <div className="p-8 bg-white/70 rounded-lg m-8">
            <h2 className={`${textSizes.h2} text-purple-800 mb-4 text-center`}>
              Creative Summary
            </h2>
            <p
              className={`${textSizes.body} text-purple-700 text-center leading-relaxed`}
            >
              {data.professionalSummary}
            </p>
          </div>

          <div className="px-8 pb-8">
            <h2 className={`${textSizes.h2} text-purple-800 mb-6 text-center`}>
              Experience Highlights
            </h2>
            {data.experience?.map((exp: any, i: number) => (
              <div
                key={i}
                className="mb-6 bg-white/80 p-6 rounded-xl border-l-4 border-purple-400"
              >
                <h3 className="font-bold text-purple-800 text-center">
                  {exp.position}
                </h3>
                <p className="text-purple-600 font-medium text-center">
                  {exp.company} • {exp.startDate} - {exp.endDate}
                </p>
                <ul className="list-none mt-4 text-sm text-purple-700 space-y-2">
                  {exp.achievements?.map((achievement: string, j: number) => (
                    <li key={j} className="flex items-start">
                      <span className="text-purple-400 mr-2">●</span>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Templates Modal Component
function TemplatesModal({
  isOpen,
  onClose,
  currentTemplate,
  onSelectTemplate,
}: {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: string;
  onSelectTemplate: (templateId: string) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Choose Resume Template
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {RESUME_TEMPLATES.map((template) => {
              const isSelected = currentTemplate === template.id;
              const TemplateComponent =
                template.id === "executive"
                  ? ExecutiveTemplate
                  : template.id === "creative"
                  ? CreativeTemplate
                  : ModernTemplate;

              return (
                <div key={template.id} className="relative">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => onSelectTemplate(template.id)}
                  >
                    {/* Template Preview */}
                    <div className="mb-4">
                      <TemplateComponent data={SAMPLE_DATA} isPreview={true} />
                    </div>

                    {/* Template Info */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {template.name}
                        </h3>
                        {template.isPremium && (
                          <Crown className="h-4 w-4 text-yellow-500" />
                        )}
                        {isSelected && (
                          <Check className="h-4 w-4 text-blue-500" />
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">
                        {template.description}
                      </p>

                      <div className="flex items-center justify-center gap-2">
                        {template.isPremium ? (
                          <Badge
                            variant="secondary"
                            className="bg-yellow-100 text-yellow-800"
                          >
                            {template.creditCost} Credit
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-green-100 text-green-800"
                          >
                            Free
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onClose}>Apply Template</Button>
        </div>
      </div>
    </div>
  );
}

// ATS-Friendly Resume Preview Component
function ResumePreview({
  resumeData,
  onEdit,
  highlightedFields = [],
  selectedTemplate = "modern",
}: {
  resumeData: EditableResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
  selectedTemplate?: string;
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

    // If we need to use dangerouslySetInnerHTML, render a different structure
    if (!isEditing && hasKeywordHighlights) {
      return (
        <div
          className={`${className} outline-none transition-all duration-200 group relative cursor-text hover:bg-gray-50 hover:bg-opacity-70 rounded px-1 py-0.5 ${
            isHighlighted(field) ? "bg-yellow-100 border border-yellow-300" : ""
          } ${multiline ? "min-h-[1.5rem]" : ""}`}
          style={{
            ...style,
            wordWrap: "break-word",
            whiteSpace: multiline ? "pre-wrap" : "nowrap",
            overflow: multiline ? "hidden" : "visible",
            lineHeight: multiline ? "1.5" : "inherit",
          }}
          onClick={handleClick}
          title="Click to edit"
          role="textbox"
          aria-label={`Edit ${field}`}
        >
          <div
            ref={editableRef}
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

    // Regular rendering without dangerouslySetInnerHTML
    return (
      <div
        ref={editableRef}
        contentEditable={isEditing}
        suppressContentEditableWarning={true}
        className={`${className} outline-none transition-all duration-200 group relative
          ${
            isEditing
              ? "bg-white ring-2 ring-blue-400 ring-opacity-50 shadow-sm rounded-md px-2 py-1"
              : "cursor-text hover:bg-gray-50 hover:bg-opacity-70 rounded px-1 py-0.5"
          }
          ${
            isHighlighted(field) ? "bg-yellow-100 border border-yellow-300" : ""
          }
          ${multiline ? "min-h-[1.5rem]" : ""}
        `}
        style={{
          ...style,
          wordWrap: "break-word",
          whiteSpace: multiline ? "pre-wrap" : "nowrap",
          overflow: multiline ? "hidden" : "visible",
          lineHeight: multiline ? "1.5" : "inherit",
        }}
        onClick={handleClick}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        title={isEditing ? "" : "Click to edit"}
        role="textbox"
        aria-label={`Edit ${field}`}
      >
        {isEditing ? value : value}
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
  };

  // Apply template-specific styles
  const getTemplateStyles = () => {
    switch (selectedTemplate) {
      case "executive":
        return {
          container:
            "bg-gradient-to-r from-slate-50 to-blue-50 shadow-xl w-full max-w-3xl mx-auto min-h-[297mm] relative border border-slate-200",
          header: "bg-slate-800 text-white p-4 md:p-8",
          headerText: "text-white",
          headerSubtext: "text-slate-200",
          sectionHeader:
            "text-lg md:text-xl font-semibold text-slate-800 mb-4 md:mb-6 border-b-2 border-slate-600 pb-2",
          sectionBg: "p-4 md:p-8 bg-white border-l-4 border-slate-600",
          experienceItem: "mb-4 md:mb-6 bg-slate-50 p-3 md:p-4 rounded-lg",
          textColor: "text-slate-700",
        };
      case "creative":
        return {
          container:
            "bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl w-full max-w-3xl mx-auto min-h-[297mm] relative border border-purple-200",
          header: "text-center p-4 md:p-8 border-b-4 border-purple-400",
          headerText: "text-purple-800",
          headerSubtext: "text-purple-600",
          sectionHeader:
            "text-lg md:text-xl font-semibold text-purple-800 mb-4 md:mb-6 text-center",
          sectionBg: "p-4 md:p-8 bg-white/70 rounded-lg m-4 md:m-8",
          experienceItem:
            "mb-4 md:mb-6 bg-white/80 p-4 md:p-6 rounded-xl border-l-4 border-purple-400",
          textColor: "text-purple-700",
        };
      default: // modern
        return {
          container:
            "bg-white shadow-xl w-full max-w-3xl mx-auto min-h-[297mm] relative border border-blue-100",
          header: "p-4 md:p-8 border-b border-gray-200",
          headerText: "text-gray-900",
          headerSubtext: "text-gray-600",
          sectionHeader:
            "text-base md:text-lg font-semibold text-gray-900 mb-3 md:mb-4 uppercase tracking-wide",
          sectionBg: "p-4 md:p-8 border-b border-gray-200",
          experienceItem: "mb-3 md:mb-4",
          textColor: "text-gray-700",
        };
    }
  };

  const styles = getTemplateStyles();

  return (
    <div className={styles.container}>
      {/* Resume Header */}
      <div className={styles.header}>
        <div className={selectedTemplate === "creative" ? "text-center" : ""}>
          <EditableText
            field="personalInfo.name"
            value={resumeData.personalInfo.name}
            className={`text-2xl md:text-3xl font-bold ${styles.headerText} text-center`}
            style={{ minHeight: "40px" }}
          />
          <div className="mt-4 text-sm space-y-2">
            <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
              <EditableText
                field="personalInfo.email"
                value={resumeData.personalInfo.email}
                className={`text-xs md:text-sm text-center ${styles.headerSubtext}`}
              />
              <span
                className={
                  selectedTemplate === "executive"
                    ? "text-slate-400"
                    : selectedTemplate === "creative"
                    ? "text-purple-400"
                    : "text-gray-400"
                }
              >
                •
              </span>
              <EditableText
                field="personalInfo.phone"
                value={resumeData.personalInfo.phone}
                className={`text-xs md:text-sm text-center ${styles.headerSubtext}`}
              />
            </div>
            <div className="flex justify-center gap-3 md:gap-6 flex-wrap">
              <EditableText
                field="personalInfo.location"
                value={resumeData.personalInfo.location}
                className={`text-xs md:text-sm text-center ${styles.headerSubtext}`}
              />
              {resumeData.personalInfo.linkedin && (
                <>
                  <span
                    className={
                      selectedTemplate === "executive"
                        ? "text-slate-400"
                        : selectedTemplate === "creative"
                        ? "text-purple-400"
                        : "text-gray-400"
                    }
                  >
                    •
                  </span>
                  <EditableText
                    field="personalInfo.linkedin"
                    value={resumeData.personalInfo.linkedin}
                    className={`text-xs md:text-sm text-center ${
                      selectedTemplate === "executive"
                        ? "text-blue-300"
                        : selectedTemplate === "creative"
                        ? "text-purple-300"
                        : "text-blue-600"
                    }`}
                  />
                </>
              )}
              {resumeData.personalInfo.website && (
                <>
                  <span
                    className={
                      selectedTemplate === "executive"
                        ? "text-slate-400"
                        : selectedTemplate === "creative"
                        ? "text-purple-400"
                        : "text-gray-400"
                    }
                  >
                    •
                  </span>
                  <EditableText
                    field="personalInfo.website"
                    value={resumeData.personalInfo.website}
                    className={`text-xs md:text-sm text-center ${
                      selectedTemplate === "executive"
                        ? "text-blue-300"
                        : selectedTemplate === "creative"
                        ? "text-purple-300"
                        : "text-blue-600"
                    }`}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className={styles.sectionBg}>
        <h3 className={styles.sectionHeader}>
          {selectedTemplate === "executive"
            ? "Executive Summary"
            : selectedTemplate === "creative"
            ? "Creative Summary"
            : "Professional Summary"}
        </h3>
        <EditableText
          field="professionalSummary"
          value={resumeData.professionalSummary}
          className={`text-sm ${styles.textColor} leading-relaxed ${
            selectedTemplate === "creative" ? "text-center" : ""
          }`}
          multiline
          style={{ minHeight: "60px" }}
        />
      </div>

      {/* Experience */}
      <div
        className={
          selectedTemplate === "creative"
            ? "px-4 md:px-8 pb-4 md:pb-8"
            : "p-4 md:p-8 border-b border-gray-200"
        }
      >
        <h3 className={styles.sectionHeader}>
          {selectedTemplate === "creative"
            ? "Experience Highlights"
            : "Professional Experience"}
        </h3>
        <div className="space-y-8">
          {resumeData.experience.map((exp, index) => (
            <div key={index} className={styles.experienceItem}>
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-3 space-y-2 md:space-y-0">
                <div className="flex-1">
                  <EditableText
                    field={`experience.${index}.title`}
                    value={exp.title}
                    className={`text-sm md:text-base font-semibold ${
                      styles.headerText
                    } ${selectedTemplate === "creative" ? "text-center" : ""}`}
                  />
                  <div
                    className={`flex items-center gap-2 mt-1 flex-wrap ${
                      selectedTemplate === "creative" ? "justify-center" : ""
                    }`}
                  >
                    <EditableText
                      field={`experience.${index}.company`}
                      value={exp.company}
                      className={`text-xs md:text-sm font-medium ${styles.textColor}`}
                    />
                    <span
                      className={
                        selectedTemplate === "executive"
                          ? "text-slate-400"
                          : selectedTemplate === "creative"
                          ? "text-purple-400"
                          : "text-gray-400"
                      }
                    >
                      •
                    </span>
                    <EditableText
                      field={`experience.${index}.location`}
                      value={exp.location}
                      className={`text-xs md:text-sm ${styles.headerSubtext}`}
                    />
                  </div>
                </div>
                <div
                  className={`text-xs md:text-sm ${styles.headerSubtext} flex-shrink-0`}
                >
                  <EditableText
                    field={`experience.${index}.startDate`}
                    value={exp.startDate}
                    className="text-xs md:text-sm"
                  />
                  <span className="mx-1">-</span>
                  <EditableText
                    field={`experience.${index}.endDate`}
                    value={exp.endDate}
                    className="text-xs md:text-sm"
                  />
                </div>
              </div>
              <ul
                className={
                  selectedTemplate === "creative"
                    ? "list-none mt-4 text-sm space-y-2"
                    : "space-y-2 ml-0"
                }
              >
                {exp.achievements.map((achievement, achIndex) => (
                  <li
                    key={achIndex}
                    className={`text-sm ${styles.textColor} flex items-start`}
                  >
                    <span
                      className={`${
                        selectedTemplate === "creative"
                          ? "text-purple-400"
                          : selectedTemplate === "executive"
                          ? "text-slate-400"
                          : "text-gray-400"
                      } mr-3 mt-0.5`}
                    >
                      •
                    </span>
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
        <h3 className={styles.sectionHeader}>Education</h3>
        <div className="space-y-4">
          {resumeData.education.map((edu, index) => (
            <div key={index}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <EditableText
                    field={`education.${index}.degree`}
                    value={edu.degree}
                    className={`text-base font-semibold ${styles.headerText}`}
                  />
                  <EditableText
                    field={`education.${index}.institution`}
                    value={edu.institution}
                    className={`text-sm font-medium ${styles.textColor} mt-1`}
                  />
                  {edu.details && (
                    <EditableText
                      field={`education.${index}.details`}
                      value={edu.details}
                      className={`text-sm ${styles.headerSubtext} mt-1`}
                    />
                  )}
                </div>
                <EditableText
                  field={`education.${index}.year`}
                  value={edu.year}
                  className={`text-sm ${styles.headerSubtext} flex-shrink-0`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skills */}
      <div className="p-8">
        <h3 className={styles.sectionHeader}>Skills</h3>
        <div className="space-y-4">
          {resumeData.skills.technical.length > 0 && (
            <div>
              <p className={`text-sm font-medium ${styles.textColor} mb-3`}>
                Technical Skills
              </p>
              <div className={`text-sm ${styles.textColor} leading-relaxed`}>
                {resumeData.skills.technical.join(" • ")}
              </div>
            </div>
          )}
          {resumeData.skills.certifications.length > 0 && (
            <div>
              <p className={`text-sm font-medium ${styles.textColor} mb-3`}>
                Certifications
              </p>
              <div className={`text-sm ${styles.textColor} leading-relaxed`}>
                {resumeData.skills.certifications.join(" • ")}
              </div>
            </div>
          )}
          {resumeData.skills.otherRelevantSkills.length > 0 && (
            <div>
              <p className={`text-sm font-medium ${styles.textColor} mb-3`}>
                Additional Skills
              </p>
              <div className={`text-sm ${styles.textColor} leading-relaxed`}>
                {resumeData.skills.otherRelevantSkills.join(" • ")}
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
  onTailoringStateChange,
}: {
  currentResume: EditableResumeData;
  onTailor: (data: any) => void;
  improvedResumeId: string;
  onTailoringStateChange: (isTailoring: boolean) => void;
}) {
  const [jobUrl, setJobUrl] = useState("");
  const [includeCoverLetter, setIncludeCoverLetter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTailor = async () => {
    if (!jobUrl.trim()) return;

    setIsLoading(true);
    onTailoringStateChange(true);
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
      onTailoringStateChange(false);
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
              <div className="h-4 w-4 mr-2 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
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
  const [selectedTemplate, setSelectedTemplate] = useState<string>("modern");
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);

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

  const handleSelectTemplate = async (templateId: string) => {
    const template = RESUME_TEMPLATES.find((t) => t.id === templateId);

    if (template?.isPremium && template.creditCost > 0) {
      // Check user credits and handle payment
      try {
        const response = await fetch("/api/use-credits", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            creditsToUse: template.creditCost,
            action: `Template: ${template.name}`,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("Credit transaction failed:", result);
          alert(
            result.error || "Failed to use this template. Please try again."
          );
          return;
        }

        console.log("Credits deducted successfully:", result);

        // Refresh the page to update credits count in navbar
        window.location.reload();
      } catch (error) {
        console.error("Error processing credit transaction:", error);
        alert("Error processing credit transaction. Please try again.");
        return;
      }
    }

    setSelectedTemplate(templateId);
    setIsTemplateModalOpen(false);
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
      <div className="max-w-7xl mx-auto py-4 md:py-6 px-4">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {improvedResume.versionName ||
                `Version ${improvedResume.version}`}
            </h1>
            <p className="text-sm md:text-base text-gray-600">
              {improvedResume.targetRole} • {improvedResume.targetIndustry}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
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
            <div className="flex items-center gap-2 min-w-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("docx")}
                disabled={isDownloading}
                className="whitespace-nowrap"
              >
                {isDownloading ? (
                  <div className="h-4 w-4 mr-2 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                <span className="hidden sm:inline">DOCX</span>
                <span className="sm:hidden">DOCX</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("pdf")}
                disabled
                className="whitespace-nowrap"
              >
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">PDF</span>
                <span className="sm:hidden">PDF</span>
                <Badge variant="secondary" className="ml-2 text-xs">
                  Soon
                </Badge>
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="whitespace-nowrap"
            >
              <Share className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Share</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                Soon
              </Badge>
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              className="whitespace-nowrap"
            >
              <Palette className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Templates</span>
              <Badge variant="secondary" className="ml-2 text-xs">
                Soon
              </Badge>
            </Button>
          </div>
        </div>

        {/* Mobile Warning */}
        <div className="block lg:hidden bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-blue-600 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Mobile Editing Notice
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                For the best editing experience, we recommend using a larger
                screen (tablet or desktop). Mobile editing is available but may
                be limited.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Left Column - Resume Preview (takes 2/3 width) */}
          <div className="lg:col-span-2 relative order-2 lg:order-1">
            {isTailoring && (
              <div className="absolute inset-0 bg-black bg-opacity-10 backdrop-blur-sm z-10 rounded-lg flex items-center justify-center">
                <div className="bg-white rounded-lg p-4 shadow-lg border">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <span className="text-gray-700 font-medium">
                      Tailoring your resume...
                    </span>
                  </div>
                </div>
              </div>
            )}
            <Card
              className={`h-fit bg-gradient-to-br from-slate-50 to-blue-50 border-blue-200 shadow-xl transition-all duration-300 ${
                isTailoring ? "blur-sm opacity-70" : ""
              }`}
            >
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
              <CardContent className="p-2 md:p-4">
                {activeTab === "resume" ? (
                  <div className="rounded-lg overflow-hidden">
                    <div className="overflow-x-auto">
                      <ResumePreview
                        resumeData={editableResume}
                        onEdit={handleEditResume}
                        highlightedFields={highlightedFields}
                        selectedTemplate={selectedTemplate}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 bg-white rounded-lg border border-blue-100 shadow-sm">
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
          <div className="lg:col-span-1 space-y-4 order-1 lg:order-2">
            {improvedResumeId && (
              <>
                {/* Tailor by Job Title - Priority 1 */}
                <TailoringComponent
                  currentResume={editableResume}
                  onTailor={handleTailor}
                  improvedResumeId={improvedResumeId}
                  onTailoringStateChange={setIsTailoring}
                />

                {/* Custom Improvement - Priority 2 */}
                <Card className="opacity-60">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-orange-600" />
                      Custom Improvements
                      <Badge variant="secondary" className="ml-2 text-xs">
                        Coming Soon
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="customPrompt">
                        Custom Instructions (Disabled)
                      </Label>
                      <Textarea
                        id="customPrompt"
                        value="Advanced custom improvements coming soon..."
                        placeholder="Tell us what specific improvements you'd like..."
                        className="min-h-[100px] resize-none opacity-50 cursor-not-allowed"
                        disabled
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Provide specific feedback or areas you'd like improved
                      </p>
                    </div>
                    <Button className="w-full" disabled>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Improve Resume (Coming Soon)
                    </Button>
                  </CardContent>
                </Card>
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

      {/* Templates Modal */}
      <TemplatesModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        currentTemplate={selectedTemplate}
        onSelectTemplate={handleSelectTemplate}
      />
    </div>
  );
}
