"use client";

import React from "react";
import { ResumeCard } from "../resume-card-enhanced";
import type { ResumeWithRelations } from "@/types/resume-library";

interface GridViewProps {
  resumes: ResumeWithRelations[];
  selectedResumes: string[];
  onResumeSelect: (resumeId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRefresh: () => void;
}

export function GridView({
  resumes,
  selectedResumes,
  onResumeSelect,
  onRefresh,
}: GridViewProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {resumes.map((resume) => (
        <ResumeCard
          key={resume.id}
          resume={resume}
          viewMode="grid"
          selected={selectedResumes.includes(resume.id)}
          onSelect={(selected) => onResumeSelect(resume.id, selected)}
          onDelete={onRefresh}
        />
      ))}
    </div>
  );
}