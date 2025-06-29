"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FileText, Upload, Filter } from "lucide-react";

interface EmptyStateProps {
  hasFilters?: boolean;
}

export function EmptyState({ hasFilters = false }: EmptyStateProps) {
  const t = useTranslations("resume.library.empty");
  const router = useRouter();

  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <Filter className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          {t("noResultsTitle")}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
          {t("noResultsDescription")}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
        <FileText className="h-10 w-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {t("title")}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-8">
        {t("description")}
      </p>
      <div className="flex gap-4">
        <Button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {t("uploadButton")}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/help')}
        >
          {t("learnMoreButton")}
        </Button>
      </div>
    </div>
  );
}