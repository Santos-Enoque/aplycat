"use client";

import React, { useEffect } from "react";
import { useStreamingAnalysis } from "@/hooks/use-streaming-analysis";
import { ResumeAnalysis } from "@/types/analysis";

interface StreamingAnalysisCardsProps {
  fileData: string;
  fileName: string;
  onComplete?: (analysis: ResumeAnalysis) => void;
  onError?: (error: string) => void;
}

export function StreamingAnalysisCards({
  fileData,
  fileName,
  onComplete,
  onError,
}: StreamingAnalysisCardsProps) {
  const {
    analysis,
    isStreaming,
    isComplete,
    error,
    progress,
    startAnalysis,
    stopAnalysis,
    retryAnalysis,
  } = useStreamingAnalysis();

  useEffect(() => {
    if (fileData && fileName) {
      try {
        const fetchRes = fetch(fileData);
        fetchRes
          .then((res) => res.blob())
          .then((blob) => {
            const file = new File([blob], fileName, { type: blob.type });
            startAnalysis(file);
          })
          .catch((err) => {
            console.error("Error converting file data to File object:", err);
            if (onError) {
              onError("Failed to process file data.");
            }
          });
      } catch (err) {
        console.error("Error fetching file data:", err);
        if (onError) {
          onError("Invalid file data URL.");
        }
      }
    }
  }, [fileData, fileName, startAnalysis, onError]);

  useEffect(() => {
    if (isComplete && analysis && onComplete) {
      onComplete(analysis as ResumeAnalysis);
    }
  }, [isComplete, analysis, onComplete]);

  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (error) {
    return (
      <AnalysisError
        error={error}
        onRetry={retryAnalysis}
        onCancel={stopAnalysis}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {isStreaming && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Analyzing your resume...
            </span>
            <span className="text-sm text-gray-500">{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Scores Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ScoreCard
          title="Overall Score"
          score={analysis?.overall_score}
          category={analysis?.score_category}
          isLoading={!analysis?.overall_score && isStreaming}
          animateIn={!!analysis?.overall_score}
        />
        <ScoreCard
          title="ATS Score"
          score={analysis?.ats_score}
          isLoading={!analysis?.ats_score && isStreaming}
          animateIn={!!analysis?.ats_score}
        />
        <RoastCard
          roast={analysis?.main_roast}
          isLoading={!analysis?.main_roast && isStreaming}
          animateIn={!!analysis?.main_roast}
        />
        <SummaryCard
          sectionsCount={analysis?.resume_sections?.length}
          missingSectionsCount={analysis?.missing_sections?.length}
          isLoading={
            (!analysis?.resume_sections || !analysis?.missing_sections) &&
            isStreaming
          }
          animateIn={
            !!(analysis?.resume_sections && analysis?.missing_sections)
          }
        />
      </div>

      {/* Section Analysis Grid */}
      <SectionAnalysisGrid
        sections={analysis?.resume_sections || []}
        isStreaming={isStreaming}
        isComplete={isComplete}
      />

      {/* Missing Sections */}
      {analysis?.missing_sections && analysis.missing_sections.length > 0 && (
        <MissingSectionsCard
          sections={analysis.missing_sections}
          animateIn={true}
        />
      )}

      {/* Good Stuff, Needs Work, Critical Issues */}
      {analysis && (
        <AnalysisDetails analysis={analysis} isComplete={isComplete} />
      )}

      {/* Action Plan */}
      {analysis?.action_plan && (
        <ActionPlanCard actionPlan={analysis.action_plan} animateIn={true} />
      )}
    </div>
  );
}

// Individual Card Components
function ScoreCard({
  title,
  score,
  category,
  isLoading,
  animateIn,
}: {
  title: string;
  score?: number;
  category?: string;
  isLoading: boolean;
  animateIn: boolean;
}) {
  if (isLoading) {
    return <ScoreCardSkeleton title={title} />;
  }

  const scoreColor = getScoreColor(score || 0);

  return (
    <div
      className={`bg-white p-6 rounded-lg border shadow-sm transition-all duration-500 ${
        animateIn
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform translate-y-4"
      }`}
    >
      <div className={`text-3xl font-bold mb-2 ${scoreColor}`}>
        {score || 0}
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      {category && <p className="text-sm text-gray-600">{category}</p>}
    </div>
  );
}

function RoastCard({
  roast,
  isLoading,
  animateIn,
}: {
  roast?: string;
  isLoading: boolean;
  animateIn: boolean;
}) {
  if (isLoading) {
    return <RoastCardSkeleton />;
  }

  return (
    <div
      className={`bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200 transition-all duration-500 ${
        animateIn
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform translate-y-4"
      }`}
    >
      <div className="text-2xl mb-2">🔥</div>
      <h3 className="font-semibold text-gray-900 mb-2">AI Roast</h3>
      <p className="text-sm text-gray-700 leading-relaxed">
        {roast || "Preparing your personalized roast..."}
      </p>
    </div>
  );
}

function SummaryCard({
  sectionsCount,
  missingSectionsCount,
  isLoading,
  animateIn,
}: {
  sectionsCount?: number;
  missingSectionsCount?: number;
  isLoading: boolean;
  animateIn: boolean;
}) {
  if (isLoading) {
    return <SummaryCardSkeleton />;
  }

  return (
    <div
      className={`bg-white p-6 rounded-lg border shadow-sm transition-all duration-500 ${
        animateIn
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform translate-y-4"
      }`}
    >
      <div className="text-2xl mb-2">📊</div>
      <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
      <div className="space-y-1 text-sm text-gray-600">
        <p>{sectionsCount || 0} sections analyzed</p>
        <p>{missingSectionsCount || 0} sections missing</p>
      </div>
    </div>
  );
}

function SectionAnalysisGrid({
  sections,
  isStreaming,
  isComplete,
}: {
  sections: any[];
  isStreaming: boolean;
  isComplete: boolean;
}) {
  const expectedSections = 6; // Typical number of resume sections
  const loadingSections = Math.max(0, expectedSections - sections.length);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        Section Analysis
      </h2>

      {/* Completed sections */}
      {sections.map((section, index) => (
        <SectionCard
          key={section.section_name}
          section={section}
          delay={index * 100}
        />
      ))}

      {/* Loading skeletons for pending sections */}
      {(isStreaming || !isComplete) && loadingSections > 0 && (
        <>
          {Array.from({ length: loadingSections }).map((_, index) => (
            <SectionCardSkeleton key={`loading-${index}`} />
          ))}
        </>
      )}
    </div>
  );
}

function SectionCard({ section, delay = 0 }: { section: any; delay?: number }) {
  const scoreColor = getScoreColor(section.score || 0);

  return (
    <div
      className="bg-white p-6 rounded-lg border shadow-sm transition-all duration-500 transform opacity-0 animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">
            {section.section_name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xl font-bold ${scoreColor}`}>
              {section.score}/10
            </span>
            <span
              className={`px-2 py-1 text-xs rounded-full ${
                section.found
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {section.found ? "Found" : "Missing"}
            </span>
          </div>
        </div>
      </div>

      {section.roast && (
        <div className="bg-orange-50 p-3 rounded-lg mb-4">
          <p className="text-sm text-orange-800 font-medium">
            🔥 {section.roast}
          </p>
        </div>
      )}

      {section.strengths && section.strengths.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-green-800 mb-2">✅ Strengths</h4>
          <ul className="space-y-1">
            {section.strengths.map((strength: string, index: number) => (
              <li key={index} className="text-sm text-gray-700">
                • {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.issues && section.issues.length > 0 && (
        <div className="mb-4">
          <h4 className="font-medium text-red-800 mb-2">⚠️ Issues</h4>
          <ul className="space-y-1">
            {section.issues.map((issue: string, index: number) => (
              <li key={index} className="text-sm text-gray-700">
                • {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {section.tips && section.tips.length > 0 && (
        <div>
          <h4 className="font-medium text-blue-800 mb-2">💡 Tips</h4>
          <div className="space-y-2">
            {section.tips.map((tip: any, index: number) => (
              <div key={index} className="bg-blue-50 p-3 rounded">
                <p className="text-sm font-medium text-blue-900 mb-1">
                  {tip.tip}
                </p>
                {tip.example && (
                  <p className="text-xs text-blue-700">
                    Example: {tip.example}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Skeleton Components
function ScoreCardSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm animate-pulse">
      <div className="w-16 h-8 bg-gray-200 rounded mb-2"></div>
      <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
      <div className="w-20 h-4 bg-gray-200 rounded"></div>
    </div>
  );
}

function RoastCardSkeleton() {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 p-6 rounded-lg border border-orange-200 animate-pulse">
      <div className="text-2xl mb-2">🔥</div>
      <h3 className="font-semibold text-gray-900 mb-2">AI Roast</h3>
      <div className="space-y-2">
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function SummaryCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm animate-pulse">
      <div className="text-2xl mb-2">📊</div>
      <h3 className="font-semibold text-gray-900 mb-2">Summary</h3>
      <div className="space-y-2">
        <div className="w-24 h-4 bg-gray-200 rounded"></div>
        <div className="w-20 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function SectionCardSkeleton() {
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="w-32 h-6 bg-gray-200 rounded mb-2"></div>
          <div className="w-16 h-5 bg-gray-200 rounded"></div>
        </div>
      </div>
      <div className="space-y-3">
        <div className="w-full h-4 bg-gray-200 rounded"></div>
        <div className="w-3/4 h-4 bg-gray-200 rounded"></div>
        <div className="w-5/6 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

// Additional Components (to be implemented)
function MissingSectionsCard({
  sections,
  animateIn,
}: {
  sections: any[];
  animateIn: boolean;
}) {
  return (
    <div
      className={`bg-red-50 p-6 rounded-lg border border-red-200 transition-all duration-500 ${
        animateIn
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform translate-y-4"
      }`}
    >
      <h3 className="font-semibold text-red-900 mb-4">⚠️ Missing Sections</h3>
      <div className="grid gap-3">
        {sections.map((section, index) => (
          <div key={index} className="bg-white p-3 rounded border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-900">
                {section.section_name}
              </h4>
              <span
                className={`px-2 py-1 text-xs rounded ${
                  section.importance === "Critical"
                    ? "bg-red-100 text-red-800"
                    : section.importance === "Important"
                    ? "bg-orange-100 text-orange-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {section.importance}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-2">{section.roast}</p>
            <p className="text-sm text-blue-600">{section.recommendation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalysisDetails({
  analysis,
  isComplete,
}: {
  analysis: any;
  isComplete: boolean;
}) {
  if (!isComplete) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Good Stuff */}
      {analysis.good_stuff && analysis.good_stuff.length > 0 && (
        <div className="bg-green-50 p-6 rounded-lg border border-green-200">
          <h3 className="font-semibold text-green-900 mb-4">
            ✅ What's Working
          </h3>
          <div className="space-y-3">
            {analysis.good_stuff.map((item: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Work */}
      {analysis.needs_work && analysis.needs_work.length > 0 && (
        <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
          <h3 className="font-semibold text-yellow-900 mb-4">
            ⚠️ Needs Improvement
          </h3>
          <div className="space-y-3">
            {analysis.needs_work.map((item: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{item.issue}</p>
                <p className="text-sm text-blue-600">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Issues */}
      {analysis.critical_issues && analysis.critical_issues.length > 0 && (
        <div className="bg-red-50 p-6 rounded-lg border border-red-200">
          <h3 className="font-semibold text-red-900 mb-4">
            🚨 Critical Issues
          </h3>
          <div className="space-y-3">
            {analysis.critical_issues.map((item: any, index: number) => (
              <div key={index} className="bg-white p-3 rounded border">
                <h4 className="font-medium text-gray-900 mb-1">{item.title}</h4>
                <p className="text-sm text-gray-600 mb-2">{item.disaster}</p>
                <p className="text-sm text-blue-600">{item.fix}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActionPlanCard({
  actionPlan,
  animateIn,
}: {
  actionPlan: any;
  animateIn: boolean;
}) {
  return (
    <div
      className={`bg-blue-50 p-6 rounded-lg border border-blue-200 transition-all duration-500 ${
        animateIn
          ? "opacity-100 transform translate-y-0"
          : "opacity-0 transform translate-y-4"
      }`}
    >
      <h3 className="font-semibold text-blue-900 mb-4">📋 Action Plan</h3>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Immediate Actions */}
        {actionPlan.immediate && actionPlan.immediate.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              🚀 Immediate (Do Now)
            </h4>
            <div className="space-y-2">
              {actionPlan.immediate.map((action: any, index: number) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{action.icon}</span>
                    <span className="font-medium text-gray-900">
                      {action.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {action.time_estimate}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Long-term Actions */}
        {actionPlan.longTerm && actionPlan.longTerm.length > 0 && (
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              📅 Long-term (Plan Ahead)
            </h4>
            <div className="space-y-2">
              {actionPlan.longTerm.map((action: any, index: number) => (
                <div key={index} className="bg-white p-3 rounded border">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{action.icon}</span>
                    <span className="font-medium text-gray-900">
                      {action.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {action.time_estimate}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalysisError({
  error,
  onRetry,
  onCancel,
}: {
  error: string;
  onRetry: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
      <div className="text-4xl mb-4">😵</div>
      <h3 className="font-semibold text-red-900 mb-2">Analysis Failed</h3>
      <p className="text-red-700 mb-4">{error}</p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// Utility Functions
function getScoreColor(score: number): string {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 40) return "text-orange-600";
  return "text-red-600";
}
