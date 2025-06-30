"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Grid3X3, 
  List, 
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Upload,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ResumeLibraryView, ViewMode, SortOption, LibraryStatistics } from "@/types/resume-library";

interface LibraryHeaderProps {
  view: ResumeLibraryView;
  onViewChange: (updates: Partial<ResumeLibraryView>) => void;
  selectedCount: number;
  onBulkAction: (action: string) => void;
  statistics?: LibraryStatistics;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
}

export function LibraryHeader({
  view,
  onViewChange,
  selectedCount,
  onBulkAction,
  statistics,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
}: LibraryHeaderProps) {
  const t = useTranslations("resume.library");

  const viewModeIcons = {
    grid: <Grid3X3 className="h-4 w-4" />,
    list: <List className="h-4 w-4" />,
    timeline: <Calendar className="h-4 w-4" />,
  };

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split(':') as [SortOption, 'asc' | 'desc'];
    onViewChange({ sortBy, sortOrder });
  };

  const currentSort = `${view.sortBy}:${view.sortOrder}`;

  return (
    <div className="space-y-4">
      {/* Statistics Bar */}
      {statistics && (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.totalResumes}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("statistics.totalResumes")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.totalAnalyses}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("statistics.totalAnalyses")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.totalImprovements}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("statistics.totalImprovements")}
              </p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {statistics.averageScore}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("statistics.averageScore")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {t("title")}
          </h2>
          {selectedCount > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {t("selectedCount", { count: selectedCount })}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Upload New Resume */}
          <Button
            onClick={() => onBulkAction('upload')}
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            {t("uploadNew")}
          </Button>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {(['grid', 'list', 'timeline'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onViewChange({ viewMode: mode })}
                className={cn(
                  "p-2 rounded transition-colors",
                  view.viewMode === mode
                    ? "bg-white dark:bg-gray-700 shadow-sm"
                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                )}
                title={t(`viewMode.${mode}`)}
              >
                {viewModeIcons[mode]}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <Select value={currentSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder={t("sort.label")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dateUploaded:desc">
                {t("sort.dateUploadedDesc")}
              </SelectItem>
              <SelectItem value="dateUploaded:asc">
                {t("sort.dateUploadedAsc")}
              </SelectItem>
              <SelectItem value="lastModified:desc">
                {t("sort.lastModifiedDesc")}
              </SelectItem>
              <SelectItem value="lastModified:asc">
                {t("sort.lastModifiedAsc")}
              </SelectItem>
              <SelectItem value="title:asc">
                {t("sort.titleAsc")}
              </SelectItem>
              <SelectItem value="title:desc">
                {t("sort.titleDesc")}
              </SelectItem>
              <SelectItem value="analysisScore:desc">
                {t("sort.analysisScoreDesc")}
              </SelectItem>
              <SelectItem value="analysisScore:asc">
                {t("sort.analysisScoreAsc")}
              </SelectItem>
              <SelectItem value="mostAnalyzed:desc">
                {t("sort.mostAnalyzedDesc")}
              </SelectItem>
              <SelectItem value="mostImproved:desc">
                {t("sort.mostImprovedDesc")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Filter Toggle */}
        <Button
          variant="outline"
          onClick={onToggleFilters}
          className={cn(
            "flex items-center gap-2",
            hasActiveFilters && "border-blue-500 text-blue-600 dark:text-blue-400"
          )}
        >
          <Filter className="h-4 w-4" />
          {t("filters.toggle")}
          {hasActiveFilters && (
            <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {t("filters.active")}
            </span>
          )}
          {showFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
}