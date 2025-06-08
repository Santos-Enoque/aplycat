"use client";

import { useState } from "react";
import { ImprovedResume } from "@prisma/client";
import { ResumePreview } from "@/components/resume-preview";
import { Button } from "./ui/button";

interface ResumeViewerProps {
  initialResume: ImprovedResume & { improvedResumeData: any };
}

export function ResumeViewer({ initialResume }: ResumeViewerProps) {
  const [resume, setResume] = useState(initialResume.improvedResumeData);
  const [highlightedFields, setHighlightedFields] = useState<string[]>([]);

  const handleEdit = (field: string, value: string) => {
    // This is a simplified version. A real implementation would handle nested fields.
    const fieldPath = field.split(".");
    const updatedResume = { ...resume };

    let current: any = updatedResume;
    for (let i = 0; i < fieldPath.length - 1; i++) {
      const key = fieldPath[i];
      if (key.includes("[") && key.includes("]")) {
        const [arrayKey, indexStr] = key.split("[");
        const index = parseInt(indexStr.replace("]", ""));
        current = current[arrayKey][index];
      } else {
        current = current[key];
      }
    }

    const lastKey = fieldPath[fieldPath.length - 1];
    if (lastKey.includes("[") && lastKey.includes("]")) {
      const [arrayKey, indexStr] = lastKey.split("[");
      const index = parseInt(indexStr.replace("]", ""));
      current[arrayKey][index] = value;
    } else {
      current[lastKey] = value;
    }

    setResume(updatedResume);
  };

  const handleSaveChanges = async () => {
    // Here you would call the API to save the changes
    console.log("Saving changes...", resume);
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{initialResume.targetRole}</h1>
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
      <ResumePreview
        resumeData={resume}
        onEdit={handleEdit}
        highlightedFields={highlightedFields}
      />
    </div>
  );
}
