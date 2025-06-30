"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { format, isToday, isYesterday, isThisWeek, isThisMonth } from "date-fns";
import { ResumeCard } from "../resume-card-enhanced";
import type { ResumeWithRelations } from "@/types/resume-library";

interface TimelineViewProps {
  resumes: ResumeWithRelations[];
  selectedResumes: string[];
  onResumeSelect: (resumeId: string, selected: boolean) => void;
  onSelectAll: (selected: boolean) => void;
  onRefresh: () => void;
}

interface TimelineGroup {
  label: string;
  resumes: ResumeWithRelations[];
}

export function TimelineView({
  resumes,
  selectedResumes,
  onResumeSelect,
  onRefresh,
}: TimelineViewProps) {
  const t = useTranslations("resume.library.timeline");

  // Group resumes by time period
  const groupedResumes = React.useMemo(() => {
    const groups: TimelineGroup[] = [];
    const groupMap = new Map<string, ResumeWithRelations[]>();

    resumes.forEach((resume) => {
      const date = new Date(resume.createdAt);
      let groupKey: string;

      if (isToday(date)) {
        groupKey = t("today");
      } else if (isYesterday(date)) {
        groupKey = t("yesterday");
      } else if (isThisWeek(date)) {
        groupKey = t("thisWeek");
      } else if (isThisMonth(date)) {
        groupKey = t("thisMonth");
      } else {
        groupKey = format(date, "MMMM yyyy");
      }

      if (!groupMap.has(groupKey)) {
        groupMap.set(groupKey, []);
      }
      groupMap.get(groupKey)!.push(resume);
    });

    // Convert map to array and maintain order
    const orderedKeys = [
      t("today"),
      t("yesterday"),
      t("thisWeek"),
      t("thisMonth"),
    ];

    orderedKeys.forEach((key) => {
      if (groupMap.has(key)) {
        groups.push({ label: key, resumes: groupMap.get(key)! });
      }
    });

    // Add remaining months
    groupMap.forEach((resumesInGroup, key) => {
      if (!orderedKeys.includes(key)) {
        groups.push({ label: key, resumes: resumesInGroup });
      }
    });

    return groups;
  }, [resumes, t]);

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

      {/* Timeline groups */}
      <div className="space-y-8">
        {groupedResumes.map((group, groupIndex) => (
          <div key={groupIndex} className="relative">
            {/* Group label */}
            <div className="flex items-center gap-4 mb-4">
              <div className="relative z-10 w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white dark:ring-gray-900" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {group.label}
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                ({group.resumes.length})
              </span>
            </div>

            {/* Resumes in group */}
            <div className="ml-12 space-y-4">
              {group.resumes.map((resume) => (
                <div key={resume.id} className="relative">
                  <ResumeCard
                    resume={resume}
                    viewMode="timeline"
                    selected={selectedResumes.includes(resume.id)}
                    onSelect={(selected) => onResumeSelect(resume.id, selected)}
                    onDelete={onRefresh}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}