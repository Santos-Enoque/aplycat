"use client";

import {
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface AccordionSectionProps {
  section: {
    section_name: string;
    score: number;
    rating: string;
    roast: string;
    good_things: string[];
    issues_found: string[];
    quick_fixes: string[];
  };
  isOpen: boolean;
  onToggle: () => void;
}

// Get color scheme based on rating
const getRatingColors = (rating: string) => {
  switch (rating.toLowerCase()) {
    case "excellent":
      return {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        header: "bg-emerald-100 hover:bg-emerald-200",
        text: "text-emerald-900",
        score: "text-emerald-700",
        icon: "text-emerald-600",
        focus: "",
      };
    case "good":
      return {
        bg: "bg-blue-50",
        border: "border-blue-200",
        header: "bg-blue-100 hover:bg-blue-200",
        text: "text-blue-900",
        score: "text-blue-700",
        icon: "text-blue-600",
        focus: "",
      };
    case "needs work":
      return {
        bg: "bg-amber-50",
        border: "border-amber-200",
        header: "bg-amber-100 hover:bg-amber-200",
        text: "text-amber-900",
        score: "text-amber-700",
        icon: "text-amber-600",
        focus: "",
      };
    case "critical":
    case "poor":
    default:
      return {
        bg: "bg-red-50",
        border: "border-red-200",
        header: "bg-red-100 hover:bg-red-200",
        text: "text-red-900",
        score: "text-red-700",
        icon: "text-red-600",
        focus: "",
      };
  }
};

const getRatingIcon = (rating: string) => {
  switch (rating.toLowerCase()) {
    case "excellent":
      return <Star className="w-5 h-5" />;
    case "good":
      return <CheckCircle className="w-5 h-5" />;
    case "needs work":
      return <AlertTriangle className="w-5 h-5" />;
    case "critical":
    case "poor":
    default:
      return <XCircle className="w-5 h-5" />;
  }
};

export function AccordionSection({
  section,
  isOpen,
  onToggle,
}: AccordionSectionProps) {
  const colors = getRatingColors(section.rating);
  const Icon = getRatingIcon(section.rating);
  const t = useTranslations("analysisDisplay");

  const getRatingTranslation = (rating: string) => {
    const normalizedRating = rating.toLowerCase().replace(/\s+/g, "");
    switch (normalizedRating) {
      case "excellent":
        return t("ratings.excellent");
      case "strong":
        return t("ratings.strong");
      case "good":
        return t("ratings.good");
      case "fair":
        return t("ratings.fair");
      case "needswork":
        return t("ratings.needsWork");
      case "critical":
        return t("ratings.critical");
      case "poor":
        return t("ratings.poor");
      default:
        return rating; // fallback to original if no translation found
    }
  };

  return (
    <div
      className={cn(
        "rounded-xl border-2 transition-all duration-300 overflow-hidden",
        colors.bg,
        colors.border,
        isOpen ? "shadow-lg" : "shadow-sm hover:shadow-md"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full px-4 md:px-6 py-4 md:py-5 text-left transition-all duration-200",
          colors.header,
          "focus:outline-none",
          colors.focus
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3 md:space-x-4 flex-1 min-w-0">
            <div className={colors.icon}>{Icon}</div>
            <div className="flex-1 min-w-0">
              <h3
                className={cn(
                  "font-semibold text-base md:text-lg truncate",
                  colors.text
                )}
              >
                {section.section_name}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className={cn("text-sm font-medium", colors.score)}>
                  {getRatingTranslation(section.rating)}
                </span>
                <span className={cn("text-xs", colors.score)}>•</span>
                <span className={cn("text-sm font-semibold", colors.score)}>
                  {section.score}/100
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn(
              "transition-transform duration-200",
              colors.icon,
              isOpen ? "rotate-90" : ""
            )}
          >
            <ChevronRight className="w-5 h-5" />
          </div>
        </div>
      </button>

      {/* Content */}
      {isOpen && (
        <div className="px-4 md:px-6 pt-4 md:pt-6 pb-4 md:pb-6 space-y-4 md:space-y-6 animate-in slide-in-from-top-1 duration-300">
          {/* Main Roast */}
          <div>
            <h4
              className={cn(
                "font-semibold text-sm md:text-base mb-2 flex items-center",
                colors.text
              )}
            >
              💬 {t("sectionAnalysis.analysis")}
            </h4>
            <div className="bg-white/70 rounded-lg p-3 md:p-4 border">
              <p
                className={cn(
                  "text-sm md:text-base leading-relaxed",
                  colors.text
                )}
              >
                {section.roast}
              </p>
            </div>
          </div>

          {/* Three columns on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* What's Good */}
            {section.good_things && section.good_things.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-emerald-700 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {t("sectionAnalysis.whatsGood")}
                </h4>
                <ul className="space-y-1">
                  {section.good_things.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs md:text-sm text-emerald-600 flex items-start"
                    >
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Issues Found */}
            {section.issues_found && section.issues_found.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-700 flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  {t("sectionAnalysis.issuesFound")}
                </h4>
                <ul className="space-y-1">
                  {section.issues_found.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs md:text-sm text-red-600 flex items-start"
                    >
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quick Fixes */}
            {section.quick_fixes && section.quick_fixes.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 text-blue-700 flex items-center">
                  <Star className="w-4 h-4 mr-1" />
                  {t("sectionAnalysis.quickFixes")}
                </h4>
                <ul className="space-y-1">
                  {section.quick_fixes.map((item, i) => (
                    <li
                      key={i}
                      className="text-xs md:text-sm text-blue-600 flex items-start"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-1.5 mr-2 flex-shrink-0"></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
