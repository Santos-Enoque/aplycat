"use client";

import { useState } from "react";
import { UploadButton } from "@/lib/uploadthing";
import { Button } from "@/components/ui/button";
import { FileText, X, Upload, CheckCircle, AlertCircle } from "lucide-react";

interface FileUploadWithUploadThingProps {
  onFileUploaded: (resumeId: string, fileName: string) => void;
  isLoading?: boolean;
}

export function FileUploadWithUploadThing({
  onFileUploaded,
  isLoading,
}: FileUploadWithUploadThingProps) {
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    url: string;
    size: number;
  } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleUploadComplete = async (res: any) => {
    console.log("[FILE_UPLOAD_UT] UploadThing upload complete:", res);

    if (res && res.length > 0) {
      const file = res[0];
      const serverData = file.serverData; // This contains the data returned from onUploadComplete

      console.log("[FILE_UPLOAD_UT] Server data:", serverData);

      setUploadedFile({
        name: serverData.fileName || file.name,
        url: serverData.fileUrl || file.url,
        size: serverData.fileSize || file.size,
      });

      try {
        // Save metadata to database
        console.log("[FILE_UPLOAD_UT] Saving metadata to database...");
        const response = await fetch("/api/save-resume", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileUrl: serverData.fileUrl || file.url,
            fileName: serverData.fileName || file.name,
            fileSize: serverData.fileSize || file.size,
          }),
        });

        const result = await response.json();
        console.log("[FILE_UPLOAD_UT] Metadata save result:", result);

        if (!response.ok) {
          throw new Error(result.error || "Failed to save resume metadata");
        }

        // Notify parent component
        onFileUploaded(result.resumeId, result.fileName);
      } catch (error: any) {
        console.error("[FILE_UPLOAD_UT] Error saving metadata:", error);
        setUploadError(error.message || "Failed to save resume data");
      }
    }
  };

  const handleUploadError = (error: Error) => {
    console.error("[FILE_UPLOAD_UT] Upload error:", error);
    setUploadError(error.message);
    setIsUploading(false);
  };

  const clearFile = () => {
    setUploadedFile(null);
    setUploadError(null);
  };

  if (isLoading || isUploading) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            <p className="text-lg font-medium text-gray-900">
              {isUploading ? "Uploading resume..." : "Processing..."}
            </p>
            <p className="text-sm text-gray-500">
              Please wait while we process your file
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (uploadedFile && !uploadError) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-green-900">{uploadedFile.name}</p>
            <p className="text-green-700">
              {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB - Upload
              successful!
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (uploadError) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-red-900">Upload failed</p>
            <p className="text-red-700">{uploadError}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFile}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="border-2 border-dashed border-gray-300 hover:border-gray-400 rounded-lg p-8 text-center transition-all">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Upload className="w-6 h-6 text-gray-600" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              Upload your resume
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Click below to select your PDF file
            </p>
          </div>

          <UploadButton
            endpoint="resumeUploader"
            onClientUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
            onUploadBegin={() => {
              console.log("[FILE_UPLOAD_UT] Upload started");
              setIsUploading(true);
              setUploadError(null);
            }}
            appearance={{
              button:
                "bg-purple-600 hover:bg-purple-700 text-white font-medium px-6 py-3 rounded-lg",
              allowedContent: "text-xs text-gray-400 mt-2",
            }}
          />
        </div>
      </div>
    </div>
  );
}
