"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LibraryHeader } from "./library-header";
import { LibraryFilters } from "./library-filters";
import { LibraryContent } from "./library-content";
import { BulkOperationsBar } from "./bulk-operations-bar";
import { ExportModal } from "./export-modal";
import { useResumeLibrary } from "@/hooks/use-resume-library";
import type { ResumeLibraryView, FilterOptions, ViewMode, SortOption } from "@/types/resume-library";

const defaultFilters: FilterOptions = {
  status: [],
  dateRange: null,
  hasAnalysis: null,
  hasImprovements: null,
  targetRole: [],
  tags: [],
  scoreRange: null,
};

const defaultView: ResumeLibraryView = {
  viewMode: 'grid' as ViewMode,
  sortBy: 'dateUploaded' as SortOption,
  sortOrder: 'desc',
  filters: defaultFilters,
  searchQuery: '',
};

export function EnhancedResumeLibrary() {
  const t = useTranslations("resume.library");
  const router = useRouter();
  const [view, setView] = useState<ResumeLibraryView>(defaultView);
  const [selectedResumes, setSelectedResumes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Load saved view preferences from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('resumeLibraryView');
    if (savedView) {
      try {
        const parsed = JSON.parse(savedView);
        setView({
          ...defaultView,
          viewMode: parsed.viewMode || defaultView.viewMode,
          sortBy: parsed.sortBy || defaultView.sortBy,
          sortOrder: parsed.sortOrder || defaultView.sortOrder,
        });
      } catch (error) {
        console.error('Failed to parse saved view preferences:', error);
      }
    }
  }, []);

  // Save view preferences to localStorage
  useEffect(() => {
    const viewToSave = {
      viewMode: view.viewMode,
      sortBy: view.sortBy,
      sortOrder: view.sortOrder,
    };
    localStorage.setItem('resumeLibraryView', JSON.stringify(viewToSave));
  }, [view.viewMode, view.sortBy, view.sortOrder]);

  const { 
    resumes, 
    isLoading, 
    error, 
    refetch,
    statistics 
  } = useResumeLibrary(view);

  const handleViewChange = (updates: Partial<ResumeLibraryView>) => {
    setView(prev => ({ ...prev, ...updates }));
  };

  const handleBulkAction = async (action: string) => {
    if (action === 'upload') {
      router.push('/dashboard');
    } else if (action === 'export' && selectedResumes.length > 0) {
      setShowExportModal(true);
    }
  };

  const handleClearSelection = () => {
    setSelectedResumes([]);
  };

  const hasActiveFilters = useMemo(() => {
    const f = view.filters;
    return (
      f.status.length > 0 ||
      f.dateRange !== null ||
      f.hasAnalysis !== null ||
      f.hasImprovements !== null ||
      f.targetRole.length > 0 ||
      f.tags.length > 0 ||
      f.scoreRange !== null ||
      view.searchQuery.length > 0
    );
  }, [view.filters, view.searchQuery]);

  return (
    <div className="space-y-6">
      <LibraryHeader 
        view={view} 
        onViewChange={handleViewChange}
        selectedCount={selectedResumes.length}
        onBulkAction={handleBulkAction}
        statistics={statistics}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
        hasActiveFilters={hasActiveFilters}
      />
      
      {showFilters && (
        <LibraryFilters 
          view={view} 
          onViewChange={handleViewChange}
          onClearFilters={() => handleViewChange({ filters: defaultFilters, searchQuery: '' })}
        />
      )}
      
      {selectedResumes.length > 0 && (
        <BulkOperationsBar
          selectedResumes={selectedResumes}
          onClearSelection={handleClearSelection}
          onRefresh={refetch}
        />
      )}
      
      <LibraryContent 
        view={view}
        resumes={resumes}
        selectedResumes={selectedResumes}
        onSelectionChange={setSelectedResumes}
        isLoading={isLoading}
        error={error}
        onRefresh={refetch}
      />
      
      {/* Export Modal */}
      <ExportModal
        resumeIds={selectedResumes}
        open={showExportModal}
        onOpenChange={setShowExportModal}
      />
    </div>
  );
}