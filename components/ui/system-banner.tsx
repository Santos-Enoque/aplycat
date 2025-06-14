"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SystemBanner() {
  const t = useTranslations("systemBanner");
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if banner was previously dismissed
    const dismissed = localStorage.getItem("systemBanner_dismissed");
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const now = Date.now();

    // Show banner if not dismissed or if dismissed more than 24 hours ago
    if (!dismissed || now - dismissedTime > 24 * 60 * 60 * 1000) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("systemBanner_dismissed", Date.now().toString());
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 relative">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-amber-800 mb-1">
              {t("title")}
            </h3>
            <p className="text-sm text-amber-700 leading-relaxed">
              {t("message")}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDismiss}
          className="text-amber-600 hover:text-amber-800 hover:bg-amber-100 flex-shrink-0"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">{t("dismiss")}</span>
        </Button>
      </div>
    </div>
  );
}
