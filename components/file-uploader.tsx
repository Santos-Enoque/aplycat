"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { UploadCloud } from "lucide-react";

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  buttonText?: string;
}

export function FileUploader({
  onFileSelect,
  buttonText = "Select File",
}: FileUploaderProps) {
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
  });

  return (
    <div
      {...getRootProps()}
      className={`relative flex flex-col items-center justify-center w-full p-6 border-2 border-dashed rounded-lg cursor-pointer transition-all
      ${
        isDragActive
          ? "border-purple-500 bg-purple-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
    >
      <input {...getInputProps()} />
      <UploadCloud className="w-10 h-10 text-gray-400 mb-3" />
      <p className="text-center text-sm text-gray-600 mb-3">
        {isDragActive
          ? "Drop the resume here..."
          : "Drag & drop your resume here, or click to select"}
      </p>
      <Button variant="outline" size="sm" type="button">
        {buttonText}
      </Button>
      <p className="text-xs text-gray-500 mt-2">PDF format only, up to 10MB</p>
    </div>
  );
}
