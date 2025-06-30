import { Resume } from "@prisma/client";

export async function downloadResume(resume: Resume) {
  const response = await fetch(`/api/resumes/${resume.id}/download`);
  
  if (!response.ok) {
    throw new Error("Failed to download resume");
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = resume.fileName;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export async function duplicateResume(resumeId: string) {
  const response = await fetch(`/api/resumes/${resumeId}/duplicate`, {
    method: "POST",
  });
  
  if (!response.ok) {
    throw new Error("Failed to duplicate resume");
  }

  return response.json();
}

export async function tagResume(resumeId: string, tags: string[]) {
  const response = await fetch(`/api/resumes/${resumeId}/tags`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ tags }),
  });
  
  if (!response.ok) {
    throw new Error("Failed to tag resume");
  }

  return response.json();
}

export async function deleteResume(resumeId: string) {
  const response = await fetch(`/api/resumes/${resumeId}/delete`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    throw new Error("Failed to delete resume");
  }

  return response.json();
}