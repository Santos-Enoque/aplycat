"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WorkflowProgressMiniProps {
  progress: number; // 0-100
  compact?: boolean;
}

export function WorkflowProgressMini({ progress, compact = false }: WorkflowProgressMiniProps) {
  const t = useTranslations("resume.library.workflow");

  const stages = [
    { name: t("upload"), threshold: 0, icon: "📤" },
    { name: t("analyze"), threshold: 25, icon: "🔍" },
    { name: t("improve"), threshold: 50, icon: "✨" },
    { name: t("export"), threshold: 75, icon: "📄" },
  ];

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t("progress", { progress })}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t("progress", { progress })}
        </span>
      </div>
      <div className="relative">
        <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="absolute inset-0 flex justify-between items-center px-1">
          {stages.map((stage, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full border-2 transition-all duration-300",
                      progress > stage.threshold
                        ? "bg-blue-500 border-blue-500"
                        : "bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
                    )}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{stage.icon} {stage.name}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
}