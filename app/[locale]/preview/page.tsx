"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ResumePreview } from "@/components/resume-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Info } from "lucide-react";
import type { ImprovedResume } from "@/types/improved-resume";

interface PreviewData {
  improvedResume: ImprovedResume;
  targetRole: string;
  targetIndustry: string;
  fileName: string;
  resumeId: string;
  version: number;
  versionName: string;
  immediate: boolean;
}

export default function PreviewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [improvedResume, setImprovedResume] = useState<ImprovedResume | null>(
    null
  );
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [isCheckingDB, setIsCheckingDB] = useState(false);
  const [dbSaveStatus, setDbSaveStatus] = useState<
    "pending" | "saved" | "error"
  >("pending");
  const [improvedResumeId, setImprovedResumeId] = useState<string | null>(null);

  useEffect(() => {
    // Try to get data from sessionStorage first (new approach)
    const storedData = sessionStorage.getItem("aplycat_preview_data");

    if (storedData) {
      try {
        const parsedData: PreviewData = JSON.parse(storedData);
        setPreviewData(parsedData);
        setImprovedResume(parsedData.improvedResume);

        // Start DB check if this is immediate response
        if (parsedData.immediate && parsedData.resumeId && parsedData.version) {
          startDBCheck(parsedData.resumeId, parsedData.version);
        }

        // Clean up sessionStorage after loading
        sessionStorage.removeItem("aplycat_preview_data");
        return;
      } catch (error) {
        console.error(
          "Failed to parse preview data from sessionStorage:",
          error
        );
        sessionStorage.removeItem("aplycat_preview_data");
      }
    }

    // Fallback to URL parameters (legacy approach)
    const improvedResumeParam = searchParams.get("improvedResume");
    const targetRole = searchParams.get("targetRole");
    const targetIndustry = searchParams.get("targetIndustry");
    const fileName = searchParams.get("fileName");
    const resumeId = searchParams.get("resumeId");
    const version = searchParams.get("version");
    const isImmediate = searchParams.get("immediate") === "true";

    if (!improvedResumeParam || !targetRole || !targetIndustry || !fileName) {
      router.push("/dashboard");
      return;
    }

    try {
      const parsedResume = JSON.parse(decodeURIComponent(improvedResumeParam));
      const legacyData: PreviewData = {
        improvedResume: parsedResume,
        targetRole: decodeURIComponent(targetRole),
        targetIndustry: decodeURIComponent(targetIndustry),
        fileName: decodeURIComponent(fileName),
        resumeId: resumeId || "",
        version: parseInt(version || "1"),
        versionName: decodeURIComponent(searchParams.get("versionName") || ""),
        immediate: isImmediate,
      };

      setPreviewData(legacyData);
      setImprovedResume(parsedResume);

      // If this is an immediate response, start checking for DB save completion
      if (isImmediate && resumeId && version) {
        startDBCheck(resumeId, parseInt(version));
      }
    } catch (error) {
      console.error("Failed to parse improved resume from URL:", error);
      router.push("/dashboard");
    }
  }, [searchParams, router]);

  const startDBCheck = async (resumeId: string, version: number) => {
    setIsCheckingDB(true);
    let attempts = 0;
    const maxAttempts = 20; // Check for up to 40 seconds (20 * 2 seconds)

    const checkInterval = setInterval(async () => {
      attempts++;

      try {
        // Check if the improved resume has been saved to the database
        const response = await fetch(
          `/api/improved-resumes?resumeId=${resumeId}&version=${version}`
        );

        if (response.ok) {
          const result = await response.json();
          const savedResume = result.improvedResumes?.find(
            (ir: any) => ir.resumeId === resumeId && ir.version === version
          );

          if (savedResume) {
            console.log(
              "[PREVIEW] Found saved resume in database:",
              savedResume.id
            );
            setImprovedResumeId(savedResume.id);
            setDbSaveStatus("saved");
            clearInterval(checkInterval);
            setIsCheckingDB(false);

            // Auto-redirect after 3 seconds to give user time to see the success message
            setTimeout(() => {
              router.push(`/improved-resume/${savedResume.id}`);
            }, 3000);
            return;
          }
        }

        // If we've exceeded max attempts, stop checking but don't fail
        if (attempts >= maxAttempts) {
          console.log("[PREVIEW] Max attempts reached, stopping DB check");
          setDbSaveStatus("error");
          clearInterval(checkInterval);
          setIsCheckingDB(false);
        }
      } catch (error) {
        console.error("[PREVIEW] Error checking DB status:", error);
        if (attempts >= maxAttempts) {
          setDbSaveStatus("error");
          clearInterval(checkInterval);
          setIsCheckingDB(false);
        }
      }
    }, 2000); // Check every 2 seconds
  };

  const handleBackToAnalysis = () => {
    // Use previewData if available, otherwise fall back to URL params
    const resumeId = previewData?.resumeId || searchParams.get("resumeId");
    const fileName = previewData?.fileName || searchParams.get("fileName");

    if (resumeId && fileName) {
      // Navigate back to analysis with resumeId
      const params = new URLSearchParams({
        resumeId,
        fileName: encodeURIComponent(fileName),
      });
      router.push(`/analyze?${params.toString()}`);
      return;
    }

    // Fallback to dashboard
    router.push("/dashboard");
  };

  const handleViewFullPage = () => {
    if (improvedResumeId) {
      router.push(`/improved-resume/${improvedResumeId}`);
    }
  };

  if (!improvedResume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⏳</div>
          <h3 className="text-xl font-semibold mb-2">Loading preview...</h3>
        </div>
      </div>
    );
  }

  const targetRole = previewData?.targetRole || searchParams.get("targetRole");
  const targetIndustry =
    previewData?.targetIndustry || searchParams.get("targetIndustry");
  const fileName = previewData?.fileName || searchParams.get("fileName");
  const isImmediate =
    previewData?.immediate || searchParams.get("immediate") === "true";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto py-12 px-4">
        {/* Status Banner for Immediate Response */}
        {isImmediate && (
          <div className="mb-6 bg-white rounded-lg border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {dbSaveStatus === "pending" && isCheckingDB && (
                  <>
                    <div className="h-5 w-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                    <div>
                      <p className="font-medium text-gray-900">
                        Resume Improved Successfully!
                      </p>
                      <p className="text-sm text-gray-600">
                        Saving to your account...
                      </p>
                    </div>
                  </>
                )}
                {dbSaveStatus === "saved" && (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Resume Saved to Your Account!
                      </p>
                      <p className="text-sm text-gray-600">
                        Redirecting to full editor...
                      </p>
                    </div>
                  </>
                )}
                {dbSaveStatus === "error" && (
                  <>
                    <Info className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Resume Improved Successfully!
                      </p>
                      <p className="text-sm text-gray-600">
                        Preview available below. Database save may take a
                        moment.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2">
                {dbSaveStatus === "saved" && improvedResumeId && (
                  <Button onClick={handleViewFullPage} size="sm">
                    View Full Editor
                  </Button>
                )}
                <Badge
                  variant={dbSaveStatus === "saved" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {dbSaveStatus === "pending" && "Saving..."}
                  {dbSaveStatus === "saved" && "Saved"}
                  {dbSaveStatus === "error" && "Live Preview"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        <ResumePreview
          improvedResume={improvedResume}
          targetRole={targetRole ? decodeURIComponent(targetRole) : ""}
          targetIndustry={
            targetIndustry ? decodeURIComponent(targetIndustry) : ""
          }
          fileName={fileName ? decodeURIComponent(fileName) : ""}
          onBack={handleBackToAnalysis}
        />
      </div>
    </div>
  );
}
