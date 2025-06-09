"use client";

import { createContext, useState, ReactNode } from "react";
import { CreditsModalController } from "../credits-modal-controller";

interface CreditsModalContextType {
  isOpen: boolean;
  openModal: (credits?: number) => void;
  closeModal: () => void;
  requiredCredits: number | null;
}

export const CreditsModalContext = createContext<
  CreditsModalContextType | undefined
>(undefined);

export function CreditsModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [requiredCredits, setRequiredCredits] = useState<number | null>(null);

  const openModal = (credits?: number) => {
    setRequiredCredits(credits || null);
    setIsOpen(true);
  };
  const closeModal = () => {
    setIsOpen(false);
    setRequiredCredits(null);
  };

  return (
    <CreditsModalContext.Provider
      value={{ isOpen, openModal, closeModal, requiredCredits }}
    >
      {children}
      <CreditsModalController />
    </CreditsModalContext.Provider>
  );
}
