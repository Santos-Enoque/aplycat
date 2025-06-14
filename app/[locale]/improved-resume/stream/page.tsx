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
import { useTranslations } from "next-intl";

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

// Template types
type TemplateType = "classic" | "minimalist" | "two-column" | "modern";

// Template Selector Component
function TemplateSelector({
  selectedTemplate,
  onTemplateChange,
}: {
  selectedTemplate: TemplateType;
  onTemplateChange: (template: TemplateType) => void;
}) {
  const t = useTranslations("improvedResume");

  const templates = [
    {
      id: "classic" as TemplateType,
      name: "Classic",
      preview: "Standard single-column layout",
    },
    {
      id: "minimalist" as TemplateType,
      name: "Minimalist",
      preview: "Clean and simple design",
    },
    {
      id: "two-column" as TemplateType,
      name: "Two-Column",
      preview: "Sidebar layout with main content",
    },
    {
      id: "modern" as TemplateType,
      name: "Modern",
      preview: "Contemporary section organization",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="h-5 w-5 text-blue-600" />
          Resume Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`p-3 border rounded-lg cursor-pointer transition-all ${
              selectedTemplate === template.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => onTemplateChange(template.id)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-gray-500">{template.preview}</p>
              </div>
              {selectedTemplate === template.id && (
                <CheckCircle className="h-4 w-4 text-blue-500" />
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Classic Template (existing template)
function ClassicTemplate({
  resumeData,
  onEdit,
  highlightedFields = [],
}: {
  resumeData: StreamingImprovedResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
}) {
  const t = useTranslations("improvedResume");

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
            title={t("clickToEdit")}
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
        title={isEditing ? "" : t("clickToEdit")}
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
        <p className="text-gray-500">{t("resume.loadingData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl w-full mx-auto min-h-[297mm] relative border border-gray-200 max-w-3xl p-4 sm:p-6 md:p-8 overflow-hidden">
      {/* Resume Header */}
      <div className="p-4 sm:p-6 md:p-8 border-b border-gray-200">
        <div className="text-center">
          <EditableText
            field="personalInfo.name"
            value={resumeData.personalInfo.name}
            className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 text-center break-words"
            style={{ minHeight: "40px", wordWrap: "break-word" }}
          />
          <div className="mt-2 sm:mt-4 text-xs sm:text-sm text-gray-600 space-y-2">
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 md:gap-6">
              <EditableText
                field="personalInfo.email"
                value={resumeData.personalInfo.email}
                className="text-xs sm:text-sm text-center break-all"
              />
              <span className="text-gray-400 hidden sm:inline">•</span>
              <EditableText
                field="personalInfo.phone"
                value={resumeData.personalInfo.phone}
                className="text-xs sm:text-sm text-center"
              />
            </div>
            <div className="flex flex-wrap justify-center gap-1 sm:gap-2 md:gap-6">
              <EditableText
                field="personalInfo.location"
                value={resumeData.personalInfo.location}
                className="text-xs sm:text-sm text-center break-words"
              />
              {resumeData.personalInfo.linkedin && (
                <>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <EditableText
                    field="personalInfo.linkedin"
                    value={resumeData.personalInfo.linkedin}
                    className="text-xs sm:text-sm text-center text-blue-600 break-all"
                  />
                </>
              )}
              {resumeData.personalInfo.website && (
                <>
                  <span className="text-gray-400 hidden sm:inline">•</span>
                  <EditableText
                    field="personalInfo.website"
                    value={resumeData.personalInfo.website}
                    className="text-xs sm:text-sm text-center text-blue-600 break-all"
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.professionalSummary && (
        <div className="p-4 sm:p-6 md:p-8 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 uppercase tracking-wide">
            {t("resume.sections.professionalSummary")}
          </h3>
          <EditableText
            field="professionalSummary"
            value={resumeData.professionalSummary}
            className="text-sm text-gray-700 leading-relaxed break-words"
            multiline
            style={{
              minHeight: "60px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div className="p-4 sm:p-6 md:p-8 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 uppercase tracking-wide">
            {t("resume.sections.experience")}
          </h3>
          <div className="space-y-6 sm:space-y-8">
            {resumeData.experience.map((exp, index) => (
              <div
                key={`exp-${index}-${exp.company}-${exp.title}`}
                className="relative"
              >
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-2">
                  <div className="flex-1 min-w-0">
                    <EditableText
                      field={`experience.${index}.title`}
                      value={exp.title}
                      className="text-sm sm:text-base font-semibold text-gray-900 break-words"
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                      <EditableText
                        field={`experience.${index}.company`}
                        value={exp.company}
                        className="text-sm font-medium text-gray-700 break-words"
                      />
                      <span className="text-gray-400 hidden sm:inline">•</span>
                      <EditableText
                        field={`experience.${index}.location`}
                        value={exp.location}
                        className="text-sm text-gray-600 break-words"
                      />
                    </div>
                  </div>
                  <div className="text-sm text-gray-600 flex-shrink-0 self-start">
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
                      <span className="text-gray-400 mr-3 mt-0.5 flex-shrink-0">
                        •
                      </span>
                      <EditableText
                        field={`experience.${index}.achievements.${achIndex}`}
                        value={achievement}
                        className="flex-1 text-sm leading-relaxed break-words"
                        multiline
                        style={{
                          minHeight: "20px",
                          wordWrap: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
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
            {t("resume.sections.education")}
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
            {t("resume.sections.skills")}
          </h3>
          <div className="space-y-4">
            {resumeData.skills.technical &&
              resumeData.skills.technical.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    {t("resume.sections.technicalSkills")}
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
                    {t("resume.sections.certifications")}
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
                    {t("resume.sections.languages")}
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

// Minimalist Template
function MinimalistTemplate({
  resumeData,
  onEdit,
  highlightedFields = [],
}: {
  resumeData: StreamingImprovedResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
}) {
  const t = useTranslations("improvedResume");

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
    if (!text || typeof text !== "string") {
      return text || "";
    }

    const keywords = highlightedFields
      .filter((field) => field.startsWith("keyword:"))
      .map((field) => field.replace("keyword:", ""));

    if (keywords.length === 0) return text;

    let highlightedText = text;
    keywords.forEach((keyword) => {
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
            title={t("clickToEdit")}
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
        title={isEditing ? "" : t("clickToEdit")}
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
        <p className="text-gray-500">{t("resume.loadingData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl w-full mx-auto min-h-[297mm] relative border border-gray-200 max-w-3xl p-6 overflow-hidden">
      {/* Minimalist Header */}
      <div className="mb-8">
        <EditableText
          field="personalInfo.name"
          value={resumeData.personalInfo.name}
          className="text-3xl font-light text-black mb-2"
          style={{ minHeight: "40px", wordWrap: "break-word" }}
        />
        <div className="text-sm text-gray-600 mb-4">
          <EditableText
            field="personalInfo.email"
            value={resumeData.personalInfo.email}
            className="text-sm break-all"
          />
          {" | "}
          <EditableText
            field="personalInfo.phone"
            value={resumeData.personalInfo.phone}
            className="text-sm"
          />
          {" | "}
          <EditableText
            field="personalInfo.location"
            value={resumeData.personalInfo.location}
            className="text-sm break-words"
          />
        </div>
        {resumeData.personalInfo.linkedin && (
          <div className="text-sm text-gray-600">
            <EditableText
              field="personalInfo.linkedin"
              value={resumeData.personalInfo.linkedin}
              className="text-sm break-all"
            />
          </div>
        )}
      </div>

      {/* Professional Summary */}
      {resumeData.professionalSummary && (
        <div className="mb-8">
          <div className="h-px bg-gray-300 mb-4"></div>
          <EditableText
            field="professionalSummary"
            value={resumeData.professionalSummary}
            className="text-sm text-gray-700 leading-relaxed break-words"
            multiline
            style={{
              minHeight: "60px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div className="mb-8">
          <div className="h-px bg-gray-300 mb-4"></div>
          <h3 className="text-lg font-light text-black mb-4 tracking-wide">
            EXPERIENCE
          </h3>
          <div className="space-y-6">
            {resumeData.experience.map((exp, index) => (
              <div key={`exp-${index}-${exp.company}-${exp.title}`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <EditableText
                      field={`experience.${index}.title`}
                      value={exp.title}
                      className="text-base font-medium text-black"
                    />
                    <EditableText
                      field={`experience.${index}.company`}
                      value={exp.company}
                      className="text-sm text-gray-600"
                    />
                  </div>
                  <div className="text-sm text-gray-500">
                    <EditableText
                      field={`experience.${index}.startDate`}
                      value={exp.startDate}
                      className="text-sm"
                    />
                    {" - "}
                    <EditableText
                      field={`experience.${index}.endDate`}
                      value={exp.endDate}
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  {exp.achievements.map((achievement, achIndex) => (
                    <div key={achIndex} className="text-sm text-gray-700">
                      <EditableText
                        field={`experience.${index}.achievements.${achIndex}`}
                        value={achievement}
                        className="text-sm leading-relaxed break-words"
                        multiline
                        style={{
                          minHeight: "20px",
                          wordWrap: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Education */}
      {resumeData.education && resumeData.education.length > 0 && (
        <div className="mb-8">
          <div className="h-px bg-gray-300 mb-4"></div>
          <h3 className="text-lg font-light text-black mb-4 tracking-wide">
            EDUCATION
          </h3>
          <div className="space-y-3">
            {resumeData.education.map((edu, index) => (
              <div key={`edu-${index}-${edu.institution}-${edu.degree}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <EditableText
                      field={`education.${index}.degree`}
                      value={edu.degree}
                      className="text-base font-medium text-black"
                    />
                    <EditableText
                      field={`education.${index}.institution`}
                      value={edu.institution}
                      className="text-sm text-gray-600"
                    />
                  </div>
                  <EditableText
                    field={`education.${index}.year`}
                    value={edu.year}
                    className="text-sm text-gray-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills */}
      {resumeData.skills && (
        <div>
          <div className="h-px bg-gray-300 mb-4"></div>
          <h3 className="text-lg font-light text-black mb-4 tracking-wide">
            SKILLS
          </h3>
          <div className="text-sm text-gray-700">
            {resumeData.skills.technical &&
              resumeData.skills.technical.length > 0 && (
                <div className="mb-2">
                  {resumeData.skills.technical.join(" • ")}
                </div>
              )}
            {resumeData.skills.certifications &&
              resumeData.skills.certifications.length > 0 && (
                <div className="mb-2">
                  <strong>Certifications:</strong>{" "}
                  {resumeData.skills.certifications.join(" • ")}
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

// Two-Column Template
function TwoColumnTemplate({
  resumeData,
  onEdit,
  highlightedFields = [],
}: {
  resumeData: StreamingImprovedResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
}) {
  const t = useTranslations("improvedResume");

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
    if (!text || typeof text !== "string") {
      return text || "";
    }

    const keywords = highlightedFields
      .filter((field) => field.startsWith("keyword:"))
      .map((field) => field.replace("keyword:", ""));

    if (keywords.length === 0) return text;

    let highlightedText = text;
    keywords.forEach((keyword) => {
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
            title={t("clickToEdit")}
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
        title={isEditing ? "" : t("clickToEdit")}
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
        <p className="text-gray-500">{t("resume.loadingData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl w-full mx-auto min-h-[297mm] relative border border-gray-200 max-w-4xl overflow-hidden">
      <div className="grid grid-cols-3 gap-0 min-h-full">
        {/* Left Sidebar */}
        <div className="bg-gray-50 p-6 border-r border-gray-200">
          {/* Contact Info */}
          <div className="mb-6">
            <EditableText
              field="personalInfo.name"
              value={resumeData.personalInfo.name}
              className="text-xl font-bold text-black mb-3"
              style={{ minHeight: "40px", wordWrap: "break-word" }}
            />
            <div className="space-y-2 text-sm text-gray-700">
              <EditableText
                field="personalInfo.email"
                value={resumeData.personalInfo.email}
                className="text-sm block break-all"
              />
              <EditableText
                field="personalInfo.phone"
                value={resumeData.personalInfo.phone}
                className="text-sm block"
              />
              <EditableText
                field="personalInfo.location"
                value={resumeData.personalInfo.location}
                className="text-sm block break-words"
              />
              {resumeData.personalInfo.linkedin && (
                <EditableText
                  field="personalInfo.linkedin"
                  value={resumeData.personalInfo.linkedin}
                  className="text-sm block break-all"
                />
              )}
            </div>
          </div>

          {/* Skills */}
          {resumeData.skills && (
            <div className="mb-6">
              <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                SKILLS
              </h3>
              <div className="space-y-3">
                {resumeData.skills.technical &&
                  resumeData.skills.technical.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Technical
                      </p>
                      <div className="text-xs text-gray-700 space-y-1">
                        {resumeData.skills.technical.map((skill, index) => (
                          <div key={index}>• {skill}</div>
                        ))}
                      </div>
                    </div>
                  )}
                {resumeData.skills.certifications &&
                  resumeData.skills.certifications.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Certifications
                      </p>
                      <div className="text-xs text-gray-700 space-y-1">
                        {resumeData.skills.certifications.map((cert, index) => (
                          <div key={index}>• {cert}</div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}

          {/* Education */}
          {resumeData.education && resumeData.education.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-black mb-3 uppercase tracking-wide border-b border-gray-300 pb-1">
                EDUCATION
              </h3>
              <div className="space-y-3">
                {resumeData.education.map((edu, index) => (
                  <div key={`edu-${index}-${edu.institution}-${edu.degree}`}>
                    <EditableText
                      field={`education.${index}.degree`}
                      value={edu.degree}
                      className="text-xs font-semibold text-black"
                    />
                    <EditableText
                      field={`education.${index}.institution`}
                      value={edu.institution}
                      className="text-xs text-gray-700 mt-1"
                    />
                    <EditableText
                      field={`education.${index}.year`}
                      value={edu.year}
                      className="text-xs text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-2 p-6">
          {/* Professional Summary */}
          {resumeData.professionalSummary && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-black mb-3 uppercase tracking-wide border-b-2 border-black pb-1">
                PROFESSIONAL SUMMARY
              </h3>
              <EditableText
                field="professionalSummary"
                value={resumeData.professionalSummary}
                className="text-sm text-gray-700 leading-relaxed break-words"
                multiline
                style={{
                  minHeight: "60px",
                  wordWrap: "break-word",
                  whiteSpace: "pre-wrap",
                }}
              />
            </div>
          )}

          {/* Experience */}
          {resumeData.experience && resumeData.experience.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide border-b-2 border-black pb-1">
                EXPERIENCE
              </h3>
              <div className="space-y-5">
                {resumeData.experience.map((exp, index) => (
                  <div key={`exp-${index}-${exp.company}-${exp.title}`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <EditableText
                          field={`experience.${index}.title`}
                          value={exp.title}
                          className="text-base font-bold text-black"
                        />
                        <EditableText
                          field={`experience.${index}.company`}
                          value={exp.company}
                          className="text-sm font-semibold text-gray-700"
                        />
                      </div>
                      <div className="text-sm text-gray-600">
                        <EditableText
                          field={`experience.${index}.startDate`}
                          value={exp.startDate}
                          className="text-sm"
                        />
                        {" - "}
                        <EditableText
                          field={`experience.${index}.endDate`}
                          value={exp.endDate}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <ul className="space-y-1 ml-4">
                      {exp.achievements.map((achievement, achIndex) => (
                        <li
                          key={achIndex}
                          className="text-sm text-gray-700 list-disc"
                        >
                          <EditableText
                            field={`experience.${index}.achievements.${achIndex}`}
                            value={achievement}
                            className="text-sm leading-relaxed break-words"
                            multiline
                            style={{
                              minHeight: "20px",
                              wordWrap: "break-word",
                              whiteSpace: "pre-wrap",
                            }}
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
            <div>
              <h3 className="text-lg font-bold text-black mb-4 uppercase tracking-wide border-b-2 border-black pb-1">
                PROJECTS
              </h3>
              <div className="space-y-4">
                {resumeData.projects.map((project, index) => (
                  <div key={index}>
                    <EditableText
                      field={`projects.${index}.name`}
                      value={project.name}
                      className="text-base font-bold text-black"
                    />
                    <EditableText
                      field={`projects.${index}.description`}
                      value={project.description || ""}
                      className="text-sm text-gray-600 mt-1"
                      multiline
                    />
                    {project.achievements && (
                      <ul className="space-y-1 mt-2 ml-4">
                        {project.achievements.map((achievement, achIndex) => (
                          <li
                            key={achIndex}
                            className="text-sm text-gray-700 list-disc"
                          >
                            <EditableText
                              field={`projects.${index}.achievements.${achIndex}`}
                              value={achievement}
                              className="text-sm leading-relaxed"
                              multiline
                            />
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Modern Template
function ModernTemplate({
  resumeData,
  onEdit,
  highlightedFields = [],
}: {
  resumeData: StreamingImprovedResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
}) {
  const t = useTranslations("improvedResume");

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
    if (!text || typeof text !== "string") {
      return text || "";
    }

    const keywords = highlightedFields
      .filter((field) => field.startsWith("keyword:"))
      .map((field) => field.replace("keyword:", ""));

    if (keywords.length === 0) return text;

    let highlightedText = text;
    keywords.forEach((keyword) => {
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
            title={t("clickToEdit")}
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
        title={isEditing ? "" : t("clickToEdit")}
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
        <p className="text-gray-500">{t("resume.loadingData")}</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-xl w-full mx-auto min-h-[297mm] relative border border-gray-200 max-w-3xl p-8 overflow-hidden">
      {/* Modern Header with accent line */}
      <div className="relative mb-8">
        <div className="absolute top-0 left-0 w-16 h-2 bg-black"></div>
        <div className="pt-6">
          <EditableText
            field="personalInfo.name"
            value={resumeData.personalInfo.name}
            className="text-3xl font-bold text-black mb-2"
            style={{ minHeight: "40px", wordWrap: "break-word" }}
          />
          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
            <EditableText
              field="personalInfo.email"
              value={resumeData.personalInfo.email}
              className="text-sm break-all"
            />
            <EditableText
              field="personalInfo.phone"
              value={resumeData.personalInfo.phone}
              className="text-sm"
            />
            <EditableText
              field="personalInfo.location"
              value={resumeData.personalInfo.location}
              className="text-sm break-words"
            />
          </div>
          {resumeData.personalInfo.linkedin && (
            <div className="text-sm text-gray-600">
              <EditableText
                field="personalInfo.linkedin"
                value={resumeData.personalInfo.linkedin}
                className="text-sm break-all"
              />
            </div>
          )}
        </div>
      </div>

      {/* Professional Summary */}
      {resumeData.professionalSummary && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-black mb-4 relative">
            <span className="bg-black text-white px-4 py-1 text-sm uppercase tracking-wider">
              Profile
            </span>
          </h3>
          <EditableText
            field="professionalSummary"
            value={resumeData.professionalSummary}
            className="text-sm text-gray-700 leading-relaxed break-words ml-4"
            multiline
            style={{
              minHeight: "60px",
              wordWrap: "break-word",
              whiteSpace: "pre-wrap",
            }}
          />
        </div>
      )}

      {/* Skills First (Modern approach) */}
      {resumeData.skills && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-black mb-4 relative">
            <span className="bg-black text-white px-4 py-1 text-sm uppercase tracking-wider">
              Core Competencies
            </span>
          </h3>
          <div className="ml-4 grid grid-cols-2 gap-4">
            {resumeData.skills.technical &&
              resumeData.skills.technical.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.technical.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            {resumeData.skills.certifications &&
              resumeData.skills.certifications.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">
                    Certifications
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {resumeData.skills.certifications.map((cert, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full"
                      >
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      )}

      {/* Experience */}
      {resumeData.experience && resumeData.experience.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-black mb-4 relative">
            <span className="bg-black text-white px-4 py-1 text-sm uppercase tracking-wider">
              Professional Experience
            </span>
          </h3>
          <div className="ml-4 space-y-6">
            {resumeData.experience.map((exp, index) => (
              <div
                key={`exp-${index}-${exp.company}-${exp.title}`}
                className="relative"
              >
                <div className="absolute left-[-20px] top-3 w-3 h-3 bg-black rounded-full"></div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <EditableText
                      field={`experience.${index}.title`}
                      value={exp.title}
                      className="text-base font-bold text-black"
                    />
                    <EditableText
                      field={`experience.${index}.company`}
                      value={exp.company}
                      className="text-sm font-semibold text-gray-700"
                    />
                    <EditableText
                      field={`experience.${index}.location`}
                      value={exp.location}
                      className="text-sm text-gray-500"
                    />
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    <EditableText
                      field={`experience.${index}.startDate`}
                      value={exp.startDate}
                      className="text-sm"
                    />
                    {" - "}
                    <EditableText
                      field={`experience.${index}.endDate`}
                      value={exp.endDate}
                      className="text-sm"
                    />
                  </div>
                </div>
                <ul className="space-y-2">
                  {exp.achievements.map((achievement, achIndex) => (
                    <li
                      key={achIndex}
                      className="text-sm text-gray-700 flex items-start"
                    >
                      <span className="text-black mr-3 mt-1 text-xs">▸</span>
                      <EditableText
                        field={`experience.${index}.achievements.${achIndex}`}
                        value={achievement}
                        className="flex-1 text-sm leading-relaxed break-words"
                        multiline
                        style={{
                          minHeight: "20px",
                          wordWrap: "break-word",
                          whiteSpace: "pre-wrap",
                        }}
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
        <div className="mb-8">
          <h3 className="text-lg font-bold text-black mb-4 relative">
            <span className="bg-black text-white px-4 py-1 text-sm uppercase tracking-wider">
              Education
            </span>
          </h3>
          <div className="ml-4 space-y-3">
            {resumeData.education.map((edu, index) => (
              <div
                key={`edu-${index}-${edu.institution}-${edu.degree}`}
                className="flex justify-between items-start"
              >
                <div className="flex-1">
                  <EditableText
                    field={`education.${index}.degree`}
                    value={edu.degree}
                    className="text-base font-semibold text-black"
                  />
                  <EditableText
                    field={`education.${index}.institution`}
                    value={edu.institution}
                    className="text-sm text-gray-700"
                  />
                </div>
                <EditableText
                  field={`education.${index}.year`}
                  value={edu.year}
                  className="text-sm text-gray-600 font-medium"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects */}
      {resumeData.projects && resumeData.projects.length > 0 && (
        <div>
          <h3 className="text-lg font-bold text-black mb-4 relative">
            <span className="bg-black text-white px-4 py-1 text-sm uppercase tracking-wider">
              Key Projects
            </span>
          </h3>
          <div className="ml-4 space-y-4">
            {resumeData.projects.map((project, index) => (
              <div key={index}>
                <EditableText
                  field={`projects.${index}.name`}
                  value={project.name}
                  className="text-base font-bold text-black"
                />
                <EditableText
                  field={`projects.${index}.description`}
                  value={project.description || ""}
                  className="text-sm text-gray-600 mt-1"
                  multiline
                />
                {project.achievements && (
                  <ul className="space-y-1 mt-2">
                    {project.achievements.map((achievement, achIndex) => (
                      <li
                        key={achIndex}
                        className="text-sm text-gray-700 flex items-start"
                      >
                        <span className="text-black mr-3 mt-1 text-xs">▸</span>
                        <EditableText
                          field={`projects.${index}.achievements.${achIndex}`}
                          value={achievement}
                          className="flex-1 text-sm leading-relaxed"
                          multiline
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Resume Preview Component (Wrapper)
function ResumePreview({
  resumeData,
  onEdit,
  highlightedFields = [],
  selectedTemplate = "classic",
}: {
  resumeData: StreamingImprovedResumeData;
  onEdit: (field: string, value: any) => void;
  highlightedFields: string[];
  selectedTemplate: TemplateType;
}) {
  switch (selectedTemplate) {
    case "minimalist":
      return (
        <MinimalistTemplate
          resumeData={resumeData}
          onEdit={onEdit}
          highlightedFields={highlightedFields}
        />
      );
    case "two-column":
      return (
        <TwoColumnTemplate
          resumeData={resumeData}
          onEdit={onEdit}
          highlightedFields={highlightedFields}
        />
      );
    case "modern":
      return (
        <ModernTemplate
          resumeData={resumeData}
          onEdit={onEdit}
          highlightedFields={highlightedFields}
        />
      );
    case "classic":
    default:
      return (
        <ClassicTemplate
          resumeData={resumeData}
          onEdit={onEdit}
          highlightedFields={highlightedFields}
        />
      );
  }
}

export default function StreamingImprovedResumePage() {
  const router = useRouter();
  const t = useTranslations("improvedResume");
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
  const [selectedTemplate, setSelectedTemplate] =
    useState<TemplateType>("classic");
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
        a.download = `${streamingData.targetRole}-cover-letter-${selectedTemplate}.txt`;
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
          fileName: `${streamingData.targetRole}-resume-${selectedTemplate}`,
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
      a.download = `${streamingData.targetRole}-resume-${selectedTemplate}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert(t("errors.downloadFailed"));
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
    toast.success(t("tailoring.success"));
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
          <p className="text-gray-600">{t("loading")}</p>
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
              {t("title")}
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
                  ? t("header.coverLetter")
                  : t("header.downloadDocx")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDownload("pdf")}
                disabled
                className="w-full sm:w-auto"
              >
                <Download className="h-4 w-4 mr-2" />
                {t("header.downloadPdf")}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {t("header.soon")}
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
              {t("header.dashboard")}
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
                    {activeTab === "resume"
                      ? t("tabs.resumePreview")
                      : t("tabs.coverLetter")}
                  </CardTitle>
                  {coverLetter && (
                    <Tabs
                      value={activeTab}
                      onValueChange={(val) => setActiveTab(val as any)}
                    >
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="resume">
                          {t("tabs.resume")}
                        </TabsTrigger>
                        <TabsTrigger value="coverLetter">
                          {t("tabs.coverLetter")}
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
                        selectedTemplate={selectedTemplate}
                      />
                    </div>
                    {isTailoring && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                          <p className="text-sm text-gray-600">
                            {t("tailoring.tailoringResume")}
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
            {/* Template Selector */}
            <TemplateSelector
              selectedTemplate={selectedTemplate}
              onTemplateChange={setSelectedTemplate}
            />

            {/* Score Improvement */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  {t("cards.improvementSummary.title")}
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
                    <div className="text-xs text-gray-500">
                      {t("cards.improvementSummary.original")}
                    </div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {improvementsAnalysis?.targetOptimizedResumeScore || "--"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("cards.improvementSummary.improved")}
                    </div>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {scoreChange ? `+${scoreChange}` : "--"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {t("cards.improvementSummary.increase")}
                    </div>
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
                    {t("cards.jobMatching.title")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tailoringAnalysis.jobMatchScore && (
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600 mb-1">
                        {tailoringAnalysis.jobMatchScore}
                      </div>
                      <p className="text-sm text-gray-600">
                        {t("cards.jobMatching.jobMatchScore")}
                      </p>
                    </div>
                  )}

                  {tailoringAnalysis.keywordAlignment &&
                    tailoringAnalysis.keywordAlignment.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-gray-600 mb-2">
                          {t("cards.jobMatching.keywordsIntegrated")}
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
                          {t("cards.jobMatching.emphasizedSkills")}
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
                    {t("cards.aiImprovements.title")}
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
                    {t("cards.importantNotes.title")}
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
