"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  MoreHorizontal, 
  FileText, 
  TrendingUp, 
  Download,
  Eye,
  Copy,
  Trash2,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { WorkflowProgressMini } from "./workflow-progress-mini";
import { downloadResume } from "@/lib/api/resume-operations";
import { toast } from "sonner";
import type { ResumeWithRelations, ViewMode } from "@/types/resume-library";

interface ResumeCardProps {
  resume: ResumeWithRelations;
  viewMode: ViewMode;
  selected: boolean;
  onSelect: (selected: boolean) => void;
}

export function ResumeCard({
  resume,
  viewMode,
  selected,
  onSelect,
}: ResumeCardProps) {
  const t = useTranslations("resume.library.card");
  const router = useRouter();
  const [isDownloading, setIsDownloading] = useState(false);

  const latestAnalysis = resume.analyses?.[0];
  const analysisScore = latestAnalysis?.atsScore;
  const analysisCount = resume._count?.analyses || 0;
  const improvementCount = resume._count?.improvements || 0;
  const improvedResumeCount = resume._count?.improvedResumes || 0;

  // Calculate workflow progress
  const workflowProgress = calculateWorkflowProgress(resume);

  const handleView = () => {
    router.push(`/dashboard/resume/${resume.id}`);
  };

  const handleAnalyze = () => {
    if (latestAnalysis?.id) {
      // View existing analysis
      router.push(`/analyze?analysisId=${latestAnalysis.id}`);
    } else {
      // Start new analysis
      router.push(`/analyze?resumeId=${resume.id}`);
    }
  };

  const handleImprove = () => {
    // Store resume data for the improve flow
    const streamingAnalysisFile = {
      filename: resume.fileName,
      fileData: resume.fileUrl, // This will be the UploadThing URL or base64 data
    };
    
    // Store in sessionStorage for the improve page to use
    sessionStorage.setItem('streamingAnalysisFile', JSON.stringify(streamingAnalysisFile));
    sessionStorage.setItem('aplycat_uploadthing_resume_id', resume.id);
    
    // Navigate to improve-v2 which handles the target role/industry collection
    router.push('/improve-v2');
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadResume(resume);
      toast.success(t("downloadSuccess"));
    } catch (error) {
      toast.error(t("downloadError"));
    } finally {
      setIsDownloading(false);
    }
  };

  const statusIcon = getStatusIcon(resume);
  const scoreColor = getScoreColor(analysisScore);

  if (viewMode === 'grid') {
    return (
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border hover:shadow-md transition-all duration-200",
        selected && "ring-2 ring-blue-500 border-blue-500"
      )}>
        <div className="p-6 space-y-4">
          {/* Header with checkbox */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <Checkbox
                checked={selected}
                onCheckedChange={onSelect}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {resume.title || resume.fileName}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {statusIcon}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleView}>
                    <Eye className="h-4 w-4 mr-2" />
                    {t("actions.view")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAnalyze}>
                    <TrendingUp className="h-4 w-4 mr-2" />
                    {t("actions.analyze")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleImprove} disabled={analysisCount === 0}>
                    <FileText className="h-4 w-4 mr-2" />
                    {t("actions.improve")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
                    <Download className="h-4 w-4 mr-2" />
                    {t("actions.download")}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Copy className="h-4 w-4 mr-2" />
                    {t("actions.duplicate")}
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled>
                    <Tag className="h-4 w-4 mr-2" />
                    {t("actions.addTag")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-600 dark:text-red-400">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("actions.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Resume preview placeholder */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md h-32 flex items-center justify-center">
            <FileText className="h-12 w-12 text-gray-400" />
          </div>

          {/* Workflow progress */}
          <WorkflowProgressMini progress={workflowProgress} />

          {/* Stats */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              {analysisScore !== undefined && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className={cn("gap-1", scoreColor)}>
                        {t("score")}: {analysisScore}/100
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t("lastAnalysisScore")}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                {analysisCount} {t("analyses")}
              </span>
              <span className="text-gray-500 dark:text-gray-400">
                {improvedResumeCount} {t("versions")}
              </span>
            </div>
          </div>

          {/* Tags */}
          {resume.tags && resume.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {resume.tags.slice(0, 3).map((tag) => (
                <Badge
                  key={tag.id}
                  variant="secondary"
                  className="text-xs"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </Badge>
              ))}
              {resume.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{resume.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-1" />
              {analysisCount > 0 ? t("viewAnalysis") : t("analyze")}
            </Button>
            <Button
              size="sm"
              onClick={handleImprove}
              disabled={analysisCount === 0}
              className="flex-1"
            >
              <FileText className="h-4 w-4 mr-1" />
              {t("improve")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className={cn(
        "bg-white dark:bg-gray-800 rounded-lg border hover:shadow-sm transition-all duration-200",
        selected && "ring-2 ring-blue-500 border-blue-500"
      )}>
        <div className="p-4 flex items-center gap-4">
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
          />
          
          {/* Resume icon/preview */}
          <div className="bg-gray-100 dark:bg-gray-700 rounded-md w-16 h-16 flex items-center justify-center flex-shrink-0">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>

          {/* Resume info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {resume.title || resume.fileName}
              </h3>
              {statusIcon}
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>{formatDistanceToNow(new Date(resume.createdAt), { addSuffix: true })}</span>
              {analysisScore !== undefined && (
                <span className={cn("font-medium", scoreColor)}>
                  {t("score")}: {analysisScore}/100
                </span>
              )}
              <span>{analysisCount} {t("analyses")}</span>
              <span>{improvedResumeCount} {t("versions")}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <WorkflowProgressMini progress={workflowProgress} compact />
            <Button
              size="sm"
              variant="outline"
              onClick={handleAnalyze}
            >
              {analysisCount > 0 ? t("viewAnalysis") : t("analyze")}
            </Button>
            <Button
              size="sm"
              onClick={handleView}
            >
              {t("view")}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleImprove} disabled={analysisCount === 0}>
                  <FileText className="h-4 w-4 mr-2" />
                  {t("actions.improve")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDownload} disabled={isDownloading}>
                  <Download className="h-4 w-4 mr-2" />
                  {t("actions.download")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 dark:text-red-400">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("actions.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  // Timeline view
  return (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-lg border hover:shadow-sm transition-all duration-200",
      selected && "ring-2 ring-blue-500 border-blue-500"
    )}>
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <Checkbox
              checked={selected}
              onCheckedChange={onSelect}
              className="mt-0.5"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                {resume.title || resume.fileName}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {format(new Date(resume.createdAt), "h:mm a")}
              </p>
            </div>
          </div>
          {statusIcon}
        </div>

        <div className="ml-8 flex items-center gap-4 text-sm">
          {analysisScore !== undefined && (
            <Badge variant="outline" className={cn("gap-1", scoreColor)}>
              {t("score")}: {analysisScore}/100
            </Badge>
          )}
          <span className="text-gray-500 dark:text-gray-400">
            {analysisCount} {t("analyses")}
          </span>
          <span className="text-gray-500 dark:text-gray-400">
            {improvedResumeCount} {t("versions")}
          </span>
        </div>

        <div className="ml-8 flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAnalyze}
          >
            {analysisCount > 0 ? t("viewAnalysis") : t("analyze")}
          </Button>
          <Button
            size="sm"
            onClick={handleView}
          >
            {t("view")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function calculateWorkflowProgress(resume: ResumeWithRelations): number {
  let progress = 25; // Base for upload
  if ((resume._count?.analyses || 0) > 0) progress += 25;
  if ((resume._count?.improvements || 0) > 0) progress += 25;
  if ((resume._count?.improvedResumes || 0) > 0) progress += 25;
  return progress;
}

function getStatusIcon(resume: ResumeWithRelations) {
  // This would be based on actual processing status from the resume
  // For now, we'll use a simple heuristic
  if (resume.analytics?.lastAnalyzedAt && 
      new Date(resume.analytics.lastAnalyzedAt) > new Date(Date.now() - 5 * 60 * 1000)) {
    return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
  }
  if ((resume._count?.analyses || 0) > 0) {
    return <CheckCircle2 className="h-4 w-4 text-green-500" />;
  }
  return <Clock className="h-4 w-4 text-gray-400" />;
}

function getScoreColor(score?: number): string {
  if (score === undefined) return "";
  if (score >= 80) return "text-green-600 border-green-600";
  if (score >= 60) return "text-yellow-600 border-yellow-600";
  return "text-red-600 border-red-600";
}