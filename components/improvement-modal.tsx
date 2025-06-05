// components/improvement-modal.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EnhancedLoading } from "@/components/enhanced-loading";
import {
  X,
  Target,
  Building,
  Sparkles,
  ArrowRight,
  Lightbulb,
  FileText,
  MessageSquare,
  Code,
} from "lucide-react";

interface ImprovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    targetRole: string,
    targetIndustry: string,
    customPrompt?: string,
    versionName?: string
  ) => void;
  isLoading: boolean;
  fileName: string;
  existingVersions?: number[];
}

export function ImprovementModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  fileName,
  existingVersions = [],
}: ImprovementModalProps) {
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [versionName, setVersionName] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetRole.trim() && targetIndustry.trim()) {
      setIsSubmitted(true);
      onSubmit(
        targetRole.trim(),
        targetIndustry.trim(),
        customPrompt.trim() || undefined,
        versionName.trim() || undefined
      );
    }
  };

  // Show enhanced loading if processing or submitted
  if (isLoading || isSubmitted) {
    // Return null - let the parent page handle the loading display
    return null;
  }

  const popularRoles = [
    "Data Analyst",
    "Software Engineer",
    "Product Manager",
    "Marketing Manager",
    "Sales Representative",
    "UX Designer",
    "Business Analyst",
    "Project Manager",
  ];

  const popularIndustries = [
    "Technology",
    "Healthcare",
    "Finance",
    "E-commerce",
    "Manufacturing",
    "Education",
    "Consulting",
    "Retail",
  ];

  const nextVersion =
    existingVersions.length > 0 ? Math.max(...existingVersions) + 1 : 1;
  const defaultVersionName = `Version ${nextVersion}`;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={handleBackdropClick}
    >
      <Card
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl">Improve Your Resume</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Get an AI-optimized, ATS-compliant version tailored to your
                  target role
                </p>
                {existingVersions.length > 0 && (
                  <p className="text-xs text-blue-600 mt-1">
                    Creating version {nextVersion} • {existingVersions.length}{" "}
                    existing version{existingVersions.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Current Resume Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Current Resume</h3>
              <p className="text-sm text-gray-600">{fileName}</p>
            </div>

            {/* Version Name */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <FileText className="h-4 w-4" />
                Version Name (Optional)
              </label>
              <input
                type="text"
                value={versionName}
                onChange={(e) => setVersionName(e.target.value)}
                placeholder={defaultVersionName}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Give this version a memorable name (e.g., "Software Engineer
                Focus", "Tech Company Version")
              </p>
            </div>

            {/* Target Role */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Target className="h-4 w-4" />
                Target Role
              </label>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="e.g., Data Analyst, Software Engineer, Marketing Manager"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />

              {/* Popular Roles */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">Popular roles:</p>
                <div className="flex flex-wrap gap-2">
                  {popularRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setTargetRole(role)}
                      className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Target Industry */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                <Building className="h-4 w-4" />
                Target Industry
              </label>
              <input
                type="text"
                value={targetIndustry}
                onChange={(e) => setTargetIndustry(e.target.value)}
                placeholder="e.g., Technology, Healthcare, Finance, E-commerce"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />

              {/* Popular Industries */}
              <div className="mt-3">
                <p className="text-xs text-gray-500 mb-2">
                  Popular industries:
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularIndustries.map((industry) => (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => setTargetIndustry(industry)}
                      className="px-2 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                    >
                      {industry}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advanced Options Toggle */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <MessageSquare className="h-4 w-4" />
                {showAdvanced ? "Hide" : "Show"} Advanced Options
              </button>
            </div>

            {/* Custom Prompt (Advanced) */}
            {showAdvanced && (
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                  <MessageSquare className="h-4 w-4" />
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Add any specific requirements or preferences for this version (e.g., 'Focus on leadership experience', 'Emphasize technical skills', 'Include volunteer work')"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 h-24 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  These custom instructions will be added to the AI optimization
                  process
                </p>
              </div>
            )}

            {/* What We'll Do */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start gap-3">
                <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-2">
                    What we'll optimize:
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Professional summary tailored to your target role</li>
                    <li>• Experience section with quantified achievements</li>
                    <li>
                      • Skills relevant to the {targetIndustry || "target"}{" "}
                      industry
                    </li>
                    <li>• ATS-friendly formatting and keywords</li>
                    <li>• Content filtered for maximum relevance</li>
                    {customPrompt && (
                      <li>
                        • Custom requirements: {customPrompt.slice(0, 50)}
                        {customPrompt.length > 50 ? "..." : ""}
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!targetRole.trim() || !targetIndustry.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <div className="flex items-center gap-2">
                  <span>Create {versionName || defaultVersionName}</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </Button>
            </div>

            {/* Credits Info */}
            <div className="text-center text-xs text-gray-500 border-t pt-4">
              This improvement will use 3 credits
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
