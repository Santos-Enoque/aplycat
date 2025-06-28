"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  MoreHorizontal, 
  FileText, 
  Download, 
  Copy, 
  Trash2,
  Tag,
  X,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { processBulkOperation } from "@/lib/api/bulk-operations";
import type { BulkOperation } from "@/types/resume-library";

interface BulkOperationsBarProps {
  selectedResumes: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
}

export function BulkOperationsBar({
  selectedResumes,
  onClearSelection,
  onRefresh,
}: BulkOperationsBarProps) {
  const t = useTranslations("resume.library.bulk");
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleBulkOperation = async (operation: BulkOperation) => {
    setIsProcessing(true);
    try {
      await processBulkOperation(operation);
      
      const successMessage = t(`success.${operation.type}`, { count: operation.resumeIds.length });
      toast.success(successMessage);
      
      onClearSelection();
      onRefresh();
    } catch (error) {
      const errorMessage = t(`error.${operation.type}`);
      toast.error(errorMessage);
      console.error('Bulk operation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAnalyzeAll = () => {
    handleBulkOperation({ 
      type: 'analyze', 
      resumeIds: selectedResumes 
    });
  };

  const handleExportAll = () => {
    handleBulkOperation({ 
      type: 'export', 
      resumeIds: selectedResumes,
      options: { format: 'zip' }
    });
  };

  const handleDuplicateAll = () => {
    handleBulkOperation({ 
      type: 'duplicate', 
      resumeIds: selectedResumes 
    });
  };

  const handleDeleteAll = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    handleBulkOperation({ 
      type: 'delete', 
      resumeIds: selectedResumes 
    });
    setShowDeleteDialog(false);
  };

  return (
    <>
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="font-medium text-blue-900 dark:text-blue-100">
            {t("selectedCount", { count: selectedResumes.length })}
          </span>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleAnalyzeAll}
              disabled={isProcessing}
              className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-800/30"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              {t("actions.analyzeAll")}
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportAll}
              disabled={isProcessing}
              className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-800/30"
            >
              <Download className="h-4 w-4 mr-2" />
              {t("actions.exportAll")}
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  disabled={isProcessing}
                  className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-800/30"
                >
                  {t("actions.moreActions")}
                  <MoreHorizontal className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleDuplicateAll}>
                  <Copy className="h-4 w-4 mr-2" />
                  {t("actions.duplicateAll")}
                </DropdownMenuItem>
                <DropdownMenuItem disabled>
                  <Tag className="h-4 w-4 mr-2" />
                  {t("actions.tagAll")} ({t("comingSoon")})
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDeleteAll}
                  className="text-red-600 dark:text-red-400"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t("actions.deleteAll")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearSelection}
          className="text-blue-700 hover:text-blue-800 dark:text-blue-300 dark:hover:text-blue-200"
        >
          <X className="h-4 w-4 mr-2" />
          {t("clearSelection")}
        </Button>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description", { count: selectedResumes.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}