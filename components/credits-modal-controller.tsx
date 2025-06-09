"use client";

import { useCreditsModal } from "@/hooks/use-credits-modal";
import { EnhancedCreditsModal } from "@/components/enhanced-credits-modal";

export function CreditsModalController() {
  const { isOpen, closeModal, requiredCredits } = useCreditsModal();
  return (
    <EnhancedCreditsModal
      isOpen={isOpen}
      onClose={closeModal}
      requiredCredits={requiredCredits}
    />
  );
}
