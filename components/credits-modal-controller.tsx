"use client";

import { useEffect } from "react";
import { useCreditsModal } from "@/hooks/use-credits-modal";
import { useRouter } from "next/navigation";

export function CreditsModalController() {
  const { isOpen, requiredCredits, close } = useCreditsModal();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      const query = requiredCredits ? `?required=${requiredCredits}` : "";
      router.push(`/purchase${query}`);
      close(); // Close the modal state to prevent re-triggering
    }
  }, [isOpen, requiredCredits, router, close]);

  return null; // This component no longer renders anything directly
}
