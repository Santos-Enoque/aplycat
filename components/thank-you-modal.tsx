"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { useTranslations } from "next-intl";
import { CheckCircle } from "lucide-react";

interface ThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  packageName: string;
}

export function ThankYouModal({
  isOpen,
  onClose,
  packageName,
}: ThankYouModalProps) {
  const { width, height } = useWindowSize();
  const t = useTranslations("thankYouModal");

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <Confetti width={width} height={height} recycle={false} />
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <CheckCircle
              className="h-6 w-6 text-green-600"
              aria-hidden="true"
            />
          </div>
          <DialogTitle className="mt-4 text-2xl font-bold leading-6 text-gray-900">
            {t("title")}
          </DialogTitle>
          <DialogDescription className="mt-2 text-sm text-gray-500">
            {t("description", { packageName })}
          </DialogDescription>
        </DialogHeader>
        <div className="mt-5 sm:mt-6">
          <Button
            type="button"
            className="inline-flex w-full justify-center rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600"
            onClick={onClose}
          >
            {t("buttonText")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
