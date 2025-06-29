"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Checkbox } from "@/components/ui/checkbox";
import { ResumeCard } from "../resume-card-enhanced";
import type { ResumeWithRelations } from "@/types/resume-library";

interface ListViewProps {
  resumes: ResumeWithRelations[];
  selectedResumes: string[];
  onResumeSelect: (resumeId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
}

export function ListView({
  resumes,
  selectedResumes,
  onResumeSelect,
  onSelectAll,
}: ListViewProps) {
  const t = useTranslations("resume.library");
  const allSelected = resumes.length > 0 && selectedResumes.length === resumes.length;
  const someSelected = selectedResumes.length > 0 && selectedResumes.length < resumes.length;

  return (
    <div className="space-y-4">
      {/* Select All Header */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 flex items-center gap-4">
        <Checkbox
          checked={allSelected || someSelected}
          onCheckedChange={(checked) => onSelectAll(checked as boolean)}
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {allSelected ? t("deselectAll") : t("selectAll")}
        </span>
      </div>

      {/* Resume List */}
      <div className="space-y-2">
        {resumes.map((resume) => (
          <ResumeCard
            key={resume.id}
            resume={resume}
            viewMode="list"
            selected={selectedResumes.includes(resume.id)}
            onSelect={(selected) => onResumeSelect(resume.id, selected)}
          />
        ))}
      </div>
    </div>
  );
}