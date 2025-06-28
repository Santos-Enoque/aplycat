"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  X, 
  CalendarIcon,
  Tag,
  FileText,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { ResumeLibraryView, FilterOptions, ProcessingStatus } from "@/types/resume-library";

interface LibraryFiltersProps {
  view: ResumeLibraryView;
  onViewChange: (updates: Partial<ResumeLibraryView>) => void;
  onClearFilters: () => void;
}

export function LibraryFilters({
  view,
  onViewChange,
  onClearFilters,
}: LibraryFiltersProps) {
  const t = useTranslations("resume.library.filters");
  const [localSearchQuery, setLocalSearchQuery] = useState(view.searchQuery);

  const handleSearchChange = (value: string) => {
    setLocalSearchQuery(value);
    // Debounce search
    const timeoutId = setTimeout(() => {
      onViewChange({ searchQuery: value });
    }, 300);
    return () => clearTimeout(timeoutId);
  };

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onViewChange({
      filters: {
        ...view.filters,
        [key]: value,
      },
    });
  };

  const handleStatusToggle = (status: ProcessingStatus) => {
    const currentStatuses = view.filters.status;
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    handleFilterChange('status', newStatuses);
  };

  const handleDateRangeSelect = (range: { from?: Date; to?: Date } | undefined) => {
    if (range?.from && range?.to) {
      handleFilterChange('dateRange', [range.from, range.to]);
    } else {
      handleFilterChange('dateRange', null);
    }
  };

  const activeFilterCount = Object.values(view.filters).filter(
    value => value !== null && value !== false && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length + (view.searchQuery ? 1 : 0);

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder={t("search.placeholder")}
          value={localSearchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {localSearchQuery && (
          <button
            onClick={() => {
              setLocalSearchQuery('');
              onViewChange({ searchQuery: '' });
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Status Filter */}
        <div>
          <Label className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {t("status.label")}
          </Label>
          <div className="flex flex-wrap gap-2">
            {Object.values(ProcessingStatus).map((status) => (
              <Button
                key={status}
                variant={view.filters.status.includes(status) ? "default" : "outline"}
                size="sm"
                onClick={() => handleStatusToggle(status)}
                className="text-xs"
              >
                {t(`status.${status.toLowerCase()}`)}
              </Button>
            ))}
          </div>
        </div>

        {/* Date Range Filter */}
        <div>
          <Label className="mb-3 flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            {t("dateRange.label")}
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !view.filters.dateRange && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {view.filters.dateRange ? (
                  `${format(view.filters.dateRange[0], "PP")} - ${format(view.filters.dateRange[1], "PP")}`
                ) : (
                  <span>{t("dateRange.placeholder")}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                selected={
                  view.filters.dateRange 
                    ? { from: view.filters.dateRange[0], to: view.filters.dateRange[1] }
                    : undefined
                }
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Score Range Filter */}
        <div>
          <Label className="mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t("scoreRange.label")}
          </Label>
          <div className="space-y-3">
            <Slider
              value={view.filters.scoreRange || [0, 100]}
              onValueChange={(value) => handleFilterChange('scoreRange', value)}
              max={100}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>{view.filters.scoreRange?.[0] || 0}</span>
              <span>{view.filters.scoreRange?.[1] || 100}</span>
            </div>
          </div>
        </div>

        {/* Has Analysis Toggle */}
        <div>
          <Label className="mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t("content.label")}
          </Label>
          <div className="space-y-2">
            <Button
              variant={view.filters.hasAnalysis === true ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange('hasAnalysis', 
                view.filters.hasAnalysis === true ? null : true
              )}
              className="w-full text-xs"
            >
              {t("content.hasAnalysis")}
            </Button>
            <Button
              variant={view.filters.hasImprovements === true ? "default" : "outline"}
              size="sm"
              onClick={() => handleFilterChange('hasImprovements', 
                view.filters.hasImprovements === true ? null : true
              )}
              className="w-full text-xs"
            >
              {t("content.hasImprovements")}
            </Button>
          </div>
        </div>

        {/* Tags Filter (placeholder for now) */}
        <div>
          <Label className="mb-3 flex items-center gap-2">
            <Tag className="h-4 w-4" />
            {t("tags.label")}
          </Label>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="text-xs">
              {t("tags.comingSoon")}
            </Badge>
          </div>
        </div>
      </div>

      {/* Active Filters & Clear Button */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {activeFilterCount > 0 ? (
            <span>{t("activeCount", { count: activeFilterCount })}</span>
          ) : (
            <span>{t("noActive")}</span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="text-red-600 hover:text-red-700"
          >
            {t("clearAll")}
          </Button>
        )}
      </div>
    </div>
  );
}