"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { GridView } from "./views/grid-view";
import { ListView } from "./views/list-view";
import { TimelineView } from "./views/timeline-view";
import { EmptyState } from "./empty-state";
import { LoadingState } from "./loading-state";
import { ErrorState } from "./error-state";
import type { ResumeLibraryView, ResumeWithRelations } from "@/types/resume-library";

interface LibraryContentProps {
  view: ResumeLibraryView;
  resumes: ResumeWithRelations[];
  selectedResumes: string[];
  onSelectionChange: (selected: string[]) => void;
  isLoading: boolean;
  error: Error | null;
  onRefresh: () => void;
}

export function LibraryContent({
  view,
  resumes,
  selectedResumes,
  onSelectionChange,
  isLoading,
  error,
  onRefresh,
}: LibraryContentProps) {
  const t = useTranslations("resume.library");

  if (error) {
    return <ErrorState error={error} onRetry={onRefresh} />;
  }

  if (isLoading) {
    return <LoadingState viewMode={view.viewMode} />;
  }

  if (resumes.length === 0) {
    return <EmptyState hasFilters={!!view.searchQuery || Object.values(view.filters).some(f => f !== null && f !== false && (Array.isArray(f) ? f.length > 0 : true))} />;
  }

  const handleResumeSelect = (resumeId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedResumes, resumeId]);
    } else {
      onSelectionChange(selectedResumes.filter(id => id !== resumeId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      onSelectionChange(resumes.map(r => r.id));
    } else {
      onSelectionChange([]);
    }
  };

  const commonProps = {
    resumes,
    selectedResumes,
    onResumeSelect: handleResumeSelect,
    onSelectAll: handleSelectAll,
    onRefresh,
  };

  switch (view.viewMode) {
    case 'grid':
      return <GridView {...commonProps} />;
    case 'list':
      return <ListView {...commonProps} />;
    case 'timeline':
      return <TimelineView {...commonProps} />;
    default:
      return <GridView {...commonProps} />;
  }
}