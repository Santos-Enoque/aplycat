"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { FileText, FileArchive, File, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ExportOptions } from "@/types/resume-library";

interface ExportModalProps {
  resumeIds: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportModal({ resumeIds, open, onOpenChange }: ExportModalProps) {
  const t = useTranslations("resume.library.export");
  const [options, setOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeAnalysis: false,
    includeImprovements: false,
    includeMetadata: true,
    compressionLevel: 'standard',
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      // Simulate progress for now
      const progressInterval = setInterval(() => {
        setExportProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/dashboard/bulk-operations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: 'export',
          resumeIds,
          options,
        }),
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const result = await response.json();
      
      clearInterval(progressInterval);
      setExportProgress(100);

      // Simulate download
      setTimeout(() => {
        toast.success(t("success", { count: resumeIds.length }));
        onOpenChange(false);
      }, 500);

    } catch (error) {
      toast.error(t("error"));
      console.error("Export failed:", error);
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  const formatIcons = {
    pdf: <FileText className="h-5 w-5" />,
    docx: <File className="h-5 w-5" />,
    txt: <FileText className="h-5 w-5" />,
    zip: <FileArchive className="h-5 w-5" />,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { count: resumeIds.length })}
          </DialogDescription>
        </DialogHeader>

        {!isExporting ? (
          <div className="space-y-6 py-4">
            {/* Format Selection */}
            <div className="space-y-3">
              <Label>{t("format.label")}</Label>
              <RadioGroup
                value={options.format}
                onValueChange={(value) => setOptions({ ...options, format: value as any })}
              >
                <div className="grid grid-cols-2 gap-4">
                  {(['pdf', 'docx', 'txt', 'zip'] as const).map((format) => (
                    <div key={format} className="flex items-center space-x-2">
                      <RadioGroupItem value={format} id={format} />
                      <Label
                        htmlFor={format}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        {formatIcons[format]}
                        <span className="font-medium">{format.toUpperCase()}</span>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
              <p className="text-sm text-gray-500">
                {t(`format.${options.format}Description`)}
              </p>
            </div>

            {/* Include Options */}
            <div className="space-y-3">
              <Label>{t("include.label")}</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeAnalysis"
                    checked={options.includeAnalysis}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeAnalysis: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeAnalysis" className="cursor-pointer">
                    {t("include.analysis")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeImprovements"
                    checked={options.includeImprovements}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeImprovements: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeImprovements" className="cursor-pointer">
                    {t("include.improvements")}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="includeMetadata"
                    checked={options.includeMetadata}
                    onCheckedChange={(checked) =>
                      setOptions({ ...options, includeMetadata: checked as boolean })
                    }
                  />
                  <Label htmlFor="includeMetadata" className="cursor-pointer">
                    {t("include.metadata")}
                  </Label>
                </div>
              </div>
            </div>

            {/* Compression (for ZIP only) */}
            {options.format === 'zip' && (
              <div className="space-y-3">
                <Label>{t("compression.label")}</Label>
                <RadioGroup
                  value={options.compressionLevel}
                  onValueChange={(value) =>
                    setOptions({ ...options, compressionLevel: value as any })
                  }
                >
                  <div className="space-y-2">
                    {(['none', 'standard', 'high'] as const).map((level) => (
                      <div key={level} className="flex items-center space-x-2">
                        <RadioGroupItem value={level} id={level} />
                        <Label htmlFor={level} className="cursor-pointer">
                          {t(`compression.${level}`)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>
        ) : (
          <div className="py-8 space-y-4">
            <div className="flex justify-center">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
            <div className="space-y-2">
              <p className="text-center text-sm text-gray-600">
                {t("exporting", { count: resumeIds.length })}
              </p>
              <Progress value={exportProgress} className="w-full" />
              <p className="text-center text-xs text-gray-500">
                {exportProgress}%
              </p>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isExporting}
          >
            {t("cancel")}
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("exporting", { count: resumeIds.length })}
              </>
            ) : (
              t("export")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}