"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ResumeContextType {
  fileData: string | null;
  fileName: string | null;
  setResumeData: (fileData: string, fileName: string) => void;
  clearResumeData: () => void;
}

const ResumeContext = createContext<ResumeContextType | undefined>(undefined);

export function ResumeProvider({ children }: { children: ReactNode }) {
  const [fileData, setFileData] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const setResumeData = (data: string, name: string) => {
    setFileData(data);
    setFileName(name);
  };

  const clearResumeData = () => {
    setFileData(null);
    setFileName(null);
  };

  return (
    <ResumeContext.Provider
      value={{
        fileData,
        fileName,
        setResumeData,
        clearResumeData,
      }}
    >
      {children}
    </ResumeContext.Provider>
  );
}

export function useResumeContext() {
  const context = useContext(ResumeContext);
  if (context === undefined) {
    throw new Error("useResumeContext must be used within a ResumeProvider");
  }
  return context;
}
