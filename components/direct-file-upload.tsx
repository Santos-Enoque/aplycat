"use client";

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, AlertCircle, CheckCircle, Zap } from "lucide-react";

interface DirectFileUploadProps {
  onAnalysisComplete?: (analysis: any) => void;
  className?: string;
}

export function DirectFileUpload({
  onAnalysisComplete,
  className = "",
}: DirectFileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const router = useRouter();

  // Convert file to base64
  const fileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:application/pdf;base64,")
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }, []);

  // Process and analyze file directly
  const processFile = useCallback(
    async (file: File) => {
      if (!file) return;

      console.log("[DIRECT_UPLOAD] Processing file:", file.name);
      setError(null);
      setSelectedFile(file);
      setIsAnalyzing(true);

      try {
        // Validate file
        if (
          !file.type.includes("pdf") &&
          !file.name.toLowerCase().endsWith(".pdf")
        ) {
          throw new Error("Please upload a PDF file");
        }

        if (file.size > 10 * 1024 * 1024) {
          // 10MB limit
          throw new Error("File size must be less than 10MB");
        }

        // Convert to base64
        console.log("[DIRECT_UPLOAD] Converting file to base64...");
        const base64Data = await fileToBase64(file);

        // Send directly to analysis API
        console.log("[DIRECT_UPLOAD] Sending to direct analysis API...");
        const response = await fetch("/api/analyze-resume-direct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Analysis failed");
        }

        console.log("[DIRECT_UPLOAD] Analysis completed successfully!");
        console.log("[DIRECT_UPLOAD] Result structure:", {
          success: result.success,
          hasAnalysis: !!result.analysis,
          fileName: result.fileName,
          mode: result.mode,
          processingTimeMs: result.processingTimeMs,
        });

        // Handle successful analysis
        if (onAnalysisComplete) {
          onAnalysisComplete(result);
        } else {
          // Navigate to results page with analysis data
          const params = new URLSearchParams({
            fileName: encodeURIComponent(file.name),
            mode: "direct",
            timestamp: new Date().toISOString(),
          });

          // Store analysis in sessionStorage for the results page
          const storageData = {
            ...result,
            fileName: file.name, // Ensure fileName is set
            mode: "direct", // Ensure mode is set
          };

          console.log("[DIRECT_UPLOAD] Storing data in sessionStorage:", {
            success: storageData.success,
            hasAnalysis: !!storageData.analysis,
            fileName: storageData.fileName,
            mode: storageData.mode,
          });

          sessionStorage.setItem(
            "aplycat_direct_analysis",
            JSON.stringify(storageData)
          );

          // Verify storage
          const stored = sessionStorage.getItem("aplycat_direct_analysis");
          console.log("[DIRECT_UPLOAD] Verification - data stored:", !!stored);

          router.push(`/analyze-results?${params.toString()}`);
        }
      } catch (error: any) {
        console.error("[DIRECT_UPLOAD] Error:", error);
        setError(
          error.message || "Failed to analyze resume. Please try again."
        );
      } finally {
        setIsAnalyzing(false);
      }
    },
    [fileToBase64, onAnalysisComplete, router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    },
    [processFile]
  );

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return (
    <div className={`w-full max-w-2xl mx-auto ${className}`}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 cursor-pointer
          ${
            isDragOver
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-blue-400 hover:bg-blue-50/50"
          }
          ${isAnalyzing ? "pointer-events-none opacity-75" : ""}
        `}
      >
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isAnalyzing}
        />

        {/* Upload Content */}
        <div className="space-y-4">
          {/* Icon */}
          <div className="flex justify-center">
            {isAnalyzing ? (
              <div className="relative">
                <Zap className="w-12 h-12 text-blue-600 animate-pulse" />
                <div className="absolute inset-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : selectedFile ? (
              <CheckCircle className="w-12 h-12 text-green-600" />
            ) : (
              <Upload className="w-12 h-12 text-gray-400" />
            )}
          </div>

          {/* Text */}
          <div>
            {isAnalyzing ? (
              <div>
                <p className="text-lg font-semibold text-blue-700 mb-2">
                  ⚡ Analyzing Your Resume...
                </p>
                <p className="text-blue-600 text-sm">
                  AI is processing your resume directly - no upload wait time!
                </p>
              </div>
            ) : selectedFile ? (
              <div>
                <p className="text-lg font-semibold text-green-700 mb-1">
                  Ready to Analyze!
                </p>
                <p className="text-green-600 text-sm">
                  {selectedFile.name} •{" "}
                  {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-semibold text-gray-700 mb-2">
                  Drop your resume here or click to browse
                </p>
                <p className="text-gray-500 text-sm">
                  PDF files only • Max 10MB • Instant analysis
                </p>
              </div>
            )}
          </div>

          {/* File Info */}
          {selectedFile && !isAnalyzing && (
            <div className="flex items-center justify-center space-x-4 pt-4">
              <div className="flex items-center space-x-2 text-gray-600">
                <FileText className="w-4 h-4" />
                <span className="text-sm">{selectedFile.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
                className="text-sm text-red-600 hover:text-red-700 underline"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {isAnalyzing && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-xl overflow-hidden">
            <div className="h-full bg-blue-600 animate-pulse"></div>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-red-800 font-medium">Analysis Failed</p>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                if (selectedFile) {
                  processFile(selectedFile);
                }
              }}
              className="text-red-600 hover:text-red-700 text-sm underline mt-2"
              disabled={isAnalyzing}
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Features */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-blue-50 rounded-lg">
          <div className="text-blue-600 font-semibold text-sm">
            ⚡ Instant Processing
          </div>
          <div className="text-blue-700 text-xs">No upload delays</div>
        </div>
        <div className="p-3 bg-green-50 rounded-lg">
          <div className="text-green-600 font-semibold text-sm">
            🔒 Secure Analysis
          </div>
          <div className="text-green-700 text-xs">Direct to AI model</div>
        </div>
        <div className="p-3 bg-purple-50 rounded-lg">
          <div className="text-purple-600 font-semibold text-sm">
            🎯 ATS Optimized
          </div>
          <div className="text-purple-700 text-xs">Beat the robots</div>
        </div>
      </div>
    </div>
  );
}
