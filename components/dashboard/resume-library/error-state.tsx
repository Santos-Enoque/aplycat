"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";

interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

export function ErrorState({ error, onRetry }: ErrorStateProps) {
  const t = useTranslations("resume.library.error");

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
        {t("title")}
      </h3>
      <p className="text-gray-600 dark:text-gray-400 max-w-md mb-6">
        {error.message || t("description")}
      </p>
      <Button
        onClick={onRetry}
        className="flex items-center gap-2"
      >
        <RefreshCcw className="h-4 w-4" />
        {t("retryButton")}
      </Button>
    </div>
  );
}