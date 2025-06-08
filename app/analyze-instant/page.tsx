"use client";

import React, { useState, useCallback } from "react";
import { useStreamingAnalysis } from "@/hooks/use-streaming-analysis";
import { StreamingAnalysisDisplay } from "@/components/streaming-analysis-display";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileText,
  AlertCircle,
  Loader,
  XCircle,
  Zap,
} from "lucide-react";
import { useDropzone } from "react-dropzone";

function FileUploadArea({
  onFileSelect,
  disabled,
}: {
  onFileSelect: (file: File) => void;
  disabled: boolean;
}) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    multiple: false,
    disabled,
  });

  return (
    <div
      {...getRootProps()}
      className={`p-10 border-2 border-dashed rounded-lg text-center cursor-pointer transition-colors
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}
        ${
          disabled ? "cursor-not-allowed opacity-50" : "hover:border-gray-400"
        }`}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center justify-center space-y-4">
        <Upload className="w-12 h-12 text-gray-400" />
        <p className="text-lg font-semibold text-gray-700">
          {isDragActive
            ? "Drop the resume here!"
            : "Drag & drop resume, or click to select"}
        </p>
        <p className="text-sm text-gray-500">PDF format only, up to 10MB</p>
      </div>
    </div>
  );
}

export default function InstantAnalysisPage() {
  const { analysis, status, error, startAnalysis } = useStreamingAnalysis();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    startAnalysis(file);
  };

  const renderContent = () => {
    switch (status) {
      case "connecting":
        return (
          <div className="text-center p-8">
            <Loader className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-800">
              Connecting to analysis engine...
            </h3>
            <p className="text-gray-600 mt-2">
              Please wait while we establish a secure connection.
            </p>
          </div>
        );
      case "streaming":
      case "completed":
        return <StreamingAnalysisDisplay analysis={analysis} status={status} />;
      case "error":
        return (
          <Card className="bg-red-50 border-red-200 text-center p-8">
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-red-800">
              Analysis Failed
            </h3>
            <p className="text-red-700 mt-2">{error}</p>
            <Button onClick={() => setSelectedFile(null)} className="mt-4">
              Try a different file
            </Button>
          </Card>
        );
      case "idle":
      default:
        return (
          <Card>
            <CardContent className="p-6">
              <FileUploadArea
                onFileSelect={handleFileSelect}
                disabled={status !== "idle"}
              />
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-100">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <header className="text-center mb-12">
            <div className="inline-block bg-blue-600 text-white rounded-full p-3 mb-4 shadow-lg">
              <Zap className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Instant Resume Analysis
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Get immediate, real-time feedback on your resume. Our AI streams
              the analysis as it's generated.
            </p>
          </header>

          <main>
            {selectedFile &&
              (status === "streaming" ||
                status === "completed" ||
                status === "error") && (
                <Card className="mb-6">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3 font-medium">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <span>{selectedFile.name}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            {renderContent()}
          </main>
        </div>
      </div>
    </div>
  );
}
