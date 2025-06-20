"use client";

import { useEffect } from "react";
import { useCreditsModal } from "@/hooks/use-credits-modal";
import { useRouter } from "next/navigation";

export function CreditsModalController() {
  const { isOpen, requiredCredits, closeModal } = useCreditsModal();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const query = requiredCredits ? `?required=${requiredCredits}` : "";
      router.push(`/purchase${query}`);
      closeModal(); // Close the modal state to prevent re-triggering
    }
  }, [isOpen, requiredCredits, router, closeModal]);

  return null; // This component no longer renders anything directly
}
