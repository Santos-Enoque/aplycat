"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, Zap, CreditCard, Star } from "lucide-react";

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const creditPacks = [
  {
    id: "starter",
    name: "Starter Pack",
    credits: 10,
    price: 9.99,
    popular: false,
    description: "Perfect for getting started",
    features: ["10 Resume Analyses", "10 Resume Improvements", "Basic Support"],
    pricePerCredit: 0.999,
  },
  {
    id: "professional",
    name: "Professional Pack",
    credits: 25,
    price: 19.99,
    popular: true,
    description: "Most popular choice",
    features: [
      "25 Resume Analyses",
      "25 Resume Improvements",
      "Priority Support",
      "Advanced AI Models",
    ],
    pricePerCredit: 0.799,
    savings: "20% savings",
  },
  {
    id: "premium",
    name: "Premium Pack",
    credits: 50,
    price: 34.99,
    popular: false,
    description: "For power users",
    features: [
      "50 Resume Analyses",
      "50 Resume Improvements",
      "Priority Support",
      "Advanced AI Models",
      "Custom Templates",
    ],
    pricePerCredit: 0.699,
    savings: "30% savings",
  },
  {
    id: "enterprise",
    name: "Enterprise Pack",
    credits: 100,
    price: 59.99,
    popular: false,
    description: "Best value for teams",
    features: [
      "100 Resume Analyses",
      "100 Resume Improvements",
      "Premium Support",
      "All AI Models",
      "Custom Templates",
      "Team Dashboard",
    ],
    pricePerCredit: 0.599,
    savings: "40% savings",
  },
];

export function CreditsModal({ isOpen, onClose }: CreditsModalProps) {
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePurchase = async (packId: string) => {
    setIsProcessing(true);
    setSelectedPack(packId);

    try {
      // TODO: Implement actual payment processing
      console.log("Processing purchase for pack:", packId);

      // Simulate processing delay
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // TODO: Redirect to payment gateway or handle payment
      alert("Payment processing would be implemented here");
    } catch (error) {
      console.error("Payment failed:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
      setSelectedPack(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            <Zap className="h-6 w-6 inline mr-2 text-purple-600" />
            Buy Credits
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Choose the credit pack that best fits your needs. Credits never
            expire!
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {creditPacks.map((pack) => (
            <Card
              key={pack.id}
              className={`relative transition-all duration-200 hover:shadow-lg ${
                pack.popular
                  ? "border-purple-500 shadow-lg ring-2 ring-purple-200"
                  : "border-gray-200 hover:border-purple-300"
              }`}
            >
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-purple-600 text-white px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-semibold text-center">
                  {pack.name}
                </CardTitle>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    ${pack.price}
                  </div>
                  <div className="text-sm text-gray-500">
                    {pack.credits} credits
                  </div>
                  {pack.savings && (
                    <Badge variant="secondary" className="mt-1">
                      {pack.savings}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 text-center">
                  {pack.description}
                </p>
              </CardHeader>

              <CardContent className="pt-0">
                <ul className="space-y-2 mb-6">
                  {pack.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="text-center mb-4">
                  <div className="text-xs text-gray-500">
                    ${pack.pricePerCredit.toFixed(2)} per credit
                  </div>
                </div>

                <Button
                  onClick={() => handlePurchase(pack.id)}
                  disabled={isProcessing}
                  className={`w-full ${
                    pack.popular
                      ? "bg-purple-600 hover:bg-purple-700"
                      : "bg-gray-800 hover:bg-gray-900"
                  }`}
                >
                  {isProcessing && selectedPack === pack.id ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Buy Now
                    </div>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">
            What are credits used for?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • <strong>1 credit</strong> = 1 comprehensive resume analysis
            </li>
            <li>
              • <strong>1 credit</strong> = 1 AI-powered resume improvement
            </li>
            <li>• Credits never expire and can be used anytime</li>
            <li>• All features included regardless of pack size</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            Secure payment processing • 30-day money-back guarantee • Cancel
            anytime
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
