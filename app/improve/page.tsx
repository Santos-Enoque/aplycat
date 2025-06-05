"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImprovementModal } from "@/components/improvement-modal";
import { Button } from "@/components/ui/button";
import type { ImprovementResponse } from "@/types/improved-resume";

export default function ImprovePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isImproving, setIsImproving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showImprovementModal, setShowImprovementModal] = useState(true);
  const [existingVersions, setExistingVersions] = useState<number[]>([]);

  useEffect(() => {
    // Check for new resumeId approach
    const resumeId = searchParams.get("resumeId");
    const fileName = searchParams.get("fileName");

    // Check for legacy fileData approach
    const fileData = searchParams.get("fileData");

    // If neither approach has the required parameters, redirect to dashboard
    if ((!resumeId || !fileName) && (!fileData || !fileName)) {
      router.push("/dashboard");
      return;
    }

    // Fetch existing versions if we have a resumeId
    if (resumeId) {
      fetchExistingVersions(resumeId);
    }
  }, [searchParams, router]);

  const fetchExistingVersions = async (resumeId: string) => {
    try {
      const response = await fetch(
        `/api/improved-resumes?resumeId=${resumeId}`
      );
      if (response.ok) {
        const result = await response.json();
        const versions =
          result.improvedResumes?.map((ir: any) => ir.version) || [];
        setExistingVersions(versions);
        console.log("[IMPROVE_PAGE] Existing versions:", versions);
      }
    } catch (error) {
      console.error("[IMPROVE_PAGE] Failed to fetch existing versions:", error);
      // Don't block the user if we can't fetch versions
    }
  };

  const handleImproveResume = async (
    targetRole: string,
    targetIndustry: string,
    customPrompt?: string,
    versionName?: string
  ) => {
    // Try new approach first
    const resumeId = searchParams.get("resumeId");
    const fileName = searchParams.get("fileName");

    // Fallback to legacy approach
    const fileData = searchParams.get("fileData");

    if ((!resumeId || !fileName) && (!fileData || !fileName)) {
      router.push("/dashboard");
      return;
    }

    setIsImproving(true);
    setError(null);

    try {
      let requestBody;

      if (resumeId && fileName) {
        // New approach with resumeId
        requestBody = {
          resumeId: resumeId,
          fileName: decodeURIComponent(fileName),
          targetRole,
          targetIndustry,
          customPrompt,
          versionName,
        };
      } else {
        // Legacy approach with fileData
        requestBody = {
          fileData: decodeURIComponent(fileData!),
          fileName: decodeURIComponent(fileName!),
          targetRole,
          targetIndustry,
          customPrompt,
          versionName,
        };
      }

      console.log("[IMPROVE_PAGE] Submitting improvement request:", {
        ...requestBody,
        fileData: requestBody.fileData ? "[REDACTED]" : undefined,
      });

      const response = await fetch("/api/improve-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result: ImprovementResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to improve resume");
      }

      console.log("[IMPROVE_PAGE] Improvement successful:", {
        success: result.success,
        improvedResumeId: result.improvedResumeId,
        version: result.version,
        versionName: result.versionName,
      });

      // Always use the immediate redirect approach for better UX
      // The API now returns a preview URL or the improved resume data immediately
      if (result.improvedResumeId) {
        // Background save completed - redirect to full editor
        router.push(`/improved-resume/${result.improvedResumeId}`);
      } else {
        // Immediate response - show preview with smart redirect
        // Store data in sessionStorage to avoid URL length issues
        const previewData = {
          improvedResume: result.improvedResume,
          targetRole: result.targetRole,
          targetIndustry: result.targetIndustry,
          fileName: result.fileName,
          resumeId: resumeId || "",
          version: result.version || 1,
          versionName: result.versionName || "",
          immediate: true,
        };

        // Use sessionStorage instead of URL params to avoid length issues
        sessionStorage.setItem(
          "aplycat_preview_data",
          JSON.stringify(previewData)
        );

        // Navigate to preview with minimal URL
        router.push("/preview");
      }
    } catch (err: any) {
      console.error("[IMPROVE_PAGE] Improvement failed:", err);
      setError(err.message || "An error occurred while improving your resume");
    } finally {
      setIsImproving(false);
    }
  };

  const handleGoBack = () => {
    // Try new approach first
    const resumeId = searchParams.get("resumeId");
    const fileName = searchParams.get("fileName");

    if (resumeId && fileName) {
      // Navigate back to analysis with resumeId
      const params = new URLSearchParams({
        resumeId,
        fileName,
      });
      router.push(`/analyze?${params.toString()}`);
      return;
    }

    // Fallback to legacy approach
    const fileData = searchParams.get("fileData");
    if (fileData && fileName) {
      const params = new URLSearchParams({
        fileData,
        fileName,
      });
      router.push(`/analyze?${params.toString()}`);
      return;
    }

    // If no valid parameters, go to dashboard
    router.push("/dashboard");
  };

  const fileName = searchParams.get("fileName") || "";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Error State */}
        {error && (
          <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto mb-6">
            <div className="text-center">
              <div className="text-6xl mb-4">😿</div>
              <h3 className="text-xl font-semibold text-red-600 mb-2">
                Oops! Something went wrong
              </h3>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleGoBack} variant="outline">
                  ← Back to Analysis
                </Button>
                <Button onClick={() => setError(null)}>Try Again</Button>
              </div>
            </div>
          </div>
        )}

        {/* Back Button */}
        <div className="flex justify-center mb-6">
          <Button onClick={handleGoBack} variant="outline">
            ← Back to Analysis
          </Button>
        </div>

        {/* Improvement Modal */}
        <ImprovementModal
          isOpen={showImprovementModal}
          onClose={handleGoBack}
          onSubmit={handleImproveResume}
          isLoading={isImproving}
          fileName={decodeURIComponent(fileName)}
          existingVersions={existingVersions}
        />
      </div>
    </div>
  );
}
