"use client";

import { useContext } from "react";
import { CreditsModalContext } from "@/components/providers/credits-modal-provider";

export function useCreditsModal() {
  const context = useContext(CreditsModalContext);
  if (context === undefined) {
    throw new Error("useCreditsModal must be used within a CreditsModalProvider");
  }
  return context;
} 