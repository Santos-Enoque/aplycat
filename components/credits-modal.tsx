"use client";

import { useState } from "react";
import { usePayment } from "@/hooks/use-payment";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, CreditCard, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useCreditsModal } from "@/hooks/use-credits-modal";
import { STRIPE_CONFIG } from "@/lib/stripe/config";

const creditPacks = Object.entries(STRIPE_CONFIG.creditPackages).map(
  ([id, pack]) => ({
    id,
    ...pack,
    popular: id === "pro", // Mark pro pack as popular
    features: getFeaturesForPackage(
      id as keyof typeof STRIPE_CONFIG.creditPackages
    ),
    pricePerCredit: pack.price / pack.credits,
  })
);

function getFeaturesForPackage(
  packId: keyof typeof STRIPE_CONFIG.creditPackages
) {
  switch (packId) {
    case "pro":
      return [
        "22 Resume Improvements",
        "14 Job-Tailored Resume + Cover Letter combos",
        "44 Custom Improvements",
        "Unlimited free analysis",
        "Email Support",
      ];
    default:
      return [];
  }
}

export function CreditsModal() {
  const { isOpen, closeModal, requiredCredits } = useCreditsModal();
  const { createCheckout, isCreatingCheckout } = usePayment();

  const handlePurchase = async (packId: string) => {
    const checkoutUrl = await createCheckout(packId);
    if (checkoutUrl) {
      window.open(checkoutUrl, "_blank");
    } else {
      toast.error("Could not initiate checkout. Please try again.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center flex items-center justify-center">
            <Zap className="h-6 w-6 inline mr-2 text-blue-600" />
            Buy Credits
          </DialogTitle>
          <DialogDescription className="text-center">
            Choose the credit pack that best fits your needs. Credits never
            expire!
          </DialogDescription>
        </DialogHeader>

        {requiredCredits !== null && requiredCredits > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg text-center">
            You need at least <strong>{requiredCredits} credits</strong> for
            this action.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {creditPacks.map((pack) => (
            <Card
              key={pack.id}
              className={`relative transition-all duration-300 hover:shadow-xl flex flex-col ${
                pack.popular
                  ? "border-2 border-blue-500 shadow-lg"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1">
                    <Star className="h-4 w-4 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pt-8 pb-4">
                <CardTitle className="text-xl font-bold">{pack.name}</CardTitle>
                <div className="my-4">
                  <span className="text-4xl font-extrabold text-slate-900">
                    ${pack.price}
                  </span>
                  <p className="text-sm text-slate-500 mt-1">
                    {pack.credits} Credits
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  ${(pack.price / pack.credits).toFixed(2)} per credit
                </Badge>
              </CardHeader>

              <CardContent className="flex-grow">
                <ul className="space-y-3 mb-6 text-sm">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <div className="p-6 pt-0 mt-auto">
                <Button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={isCreatingCheckout}
                  className={`w-full font-semibold py-3 ${
                    pack.popular
                      ? "bg-blue-600 hover:bg-blue-700 text-white"
                      : "bg-slate-800 hover:bg-slate-900 text-white"
                  }`}
                >
                  {isCreatingCheckout ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Buy Now"
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-4 text-center text-xs text-slate-500">
          Secure payment processing by Stripe.
        </div>
      </DialogContent>
    </Dialog>
  );
}
