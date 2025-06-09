// components/enhanced-credits-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
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
import {
  Check,
  Zap,
  CreditCard,
  Star,
  Loader2,
  ExternalLink,
  Shield,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  pricePerCredit: string;
}

interface CreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsUpdated?: () => void;
  requiredCredits?: number | null;
}

export function EnhancedCreditsModal({
  isOpen,
  onClose,
  onCreditsUpdated,
  requiredCredits,
}: CreditsModalProps) {
  const { user } = useUser();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);

  // Load credit packages on component mount
  useEffect(() => {
    const loadPackages = async () => {
      try {
        setIsLoadingPackages(true);
        const response = await fetch("/api/payments/packages");

        if (!response.ok) {
          throw new Error("Failed to load packages");
        }

        const data = await response.json();
        setPackages(data.packages);
      } catch (error) {
        console.error("Failed to load credit packages:", error);
        toast.error("Failed to load credit packages. Please try again.");
      } finally {
        setIsLoadingPackages(false);
      }
    };

    if (isOpen) {
      loadPackages();
    }
  }, [isOpen]);

  // Get package features based on credits
  const getPackageFeatures = (credits: number) => {
    const analysisCredits = Math.floor(credits / 1);
    const improvementCredits = Math.floor(credits / 2);
    const jobTailoringCredits = Math.floor(credits / 3);

    return [
      `${analysisCredits} Resume Analyses`,
      `${improvementCredits} Resume Improvements`,
      `${jobTailoringCredits} Job-Tailored Resume + Cover Letter combos`,
      credits >= 30 ? "Priority Support" : "Email Support",
      ...(credits >= 70
        ? ["Premium Support", "Career change optimization"]
        : []),
    ];
  };

  // Get popular badge for middle package
  const isPopular = (index: number, total: number) => {
    return total === 3 && index === 1; // Middle package
  };

  // Handle purchase
  const handlePurchase = async (packageId: string) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    setIsLoading(true);
    setSelectedPackage(packageId);

    try {
      console.log("Creating checkout for package:", packageId);

      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageType: packageId,
          returnUrl: window.location.href,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create checkout");
      }

      const data = await response.json();

      if (!data.success || !data.checkoutUrl) {
        throw new Error("Invalid checkout response");
      }

      console.log("Checkout created, redirecting to:", data.checkoutUrl);

      // Store package info for success handling
      localStorage.setItem(
        "pendingPurchase",
        JSON.stringify({
          packageId,
          checkoutId: data.checkoutId,
          timestamp: Date.now(),
        })
      );

      // Redirect to Lemon Squeezy checkout
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Purchase failed:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Purchase failed. Please try again."
      );
    } finally {
      setIsLoading(false);
      setSelectedPackage(null);
    }
  };

  // Check for successful purchase on modal open
  useEffect(() => {
    if (isOpen) {
      const urlParams = new URLSearchParams(window.location.search);
      const paymentStatus = urlParams.get("payment");

      if (paymentStatus === "success") {
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);

        // Show success message
        toast.success(
          "🎉 Purchase successful! Your credits have been added to your account."
        );

        // Clear pending purchase
        localStorage.removeItem("pendingPurchase");

        // Notify parent component to refresh user data
        if (onCreditsUpdated) {
          onCreditsUpdated();
        }
      }
    }
  }, [isOpen, onCreditsUpdated]);

  // Loading state for packages
  if (isLoadingPackages) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              <Zap className="h-6 w-6 inline mr-2 text-purple-600" />
              Buy Credits
            </DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Loading credit packages...
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

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

        {requiredCredits && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3 mx-4 my-4 text-center">
            You need at least <strong>{requiredCredits} credits</strong> for
            this action.
          </div>
        )}

        {/* Security Badge */}
        <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-3 mx-4">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Secure payment processing by Lemon Squeezy</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {packages.map((pkg, index) => {
            const popular = isPopular(index, packages.length);
            const features = getPackageFeatures(pkg.credits);

            return (
              <Card
                key={pkg.id}
                className={`relative transition-all duration-200 hover:shadow-lg ${
                  popular
                    ? "border-purple-500 shadow-lg ring-2 ring-purple-200"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                {popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-3 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold text-center">
                    {pkg.name}
                  </CardTitle>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">
                      ${pkg.price}
                    </div>
                    <div className="text-sm text-gray-500">
                      {pkg.credits} credits
                    </div>
                    <div className="text-xs text-green-600 font-medium mt-1">
                      ${pkg.pricePerCredit} per credit
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 text-center">
                    {pkg.description}
                  </p>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-2 mb-6">
                    {features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center text-sm"
                      >
                        <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePurchase(pkg.id)}
                    disabled={isLoading}
                    className={`w-full ${
                      popular
                        ? "bg-purple-600 hover:bg-purple-700"
                        : "bg-gray-800 hover:bg-gray-900"
                    }`}
                  >
                    {isLoading && selectedPackage === pkg.id ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        Buy Now
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </div>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Features Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">
            What are credits used for?
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • <strong>1 credit</strong> = 1 comprehensive resume analysis
            </li>
            <li>
              • <strong>2 credits</strong> = 1 AI-powered resume improvement
            </li>
            <li>
              • <strong>3 credits</strong> = 1 job-tailored resume + cover
              letter
            </li>
            <li>• Credits never expire and can be used anytime</li>
            <li>• All features included regardless of pack size</li>
          </ul>
        </div>

        {/* Guarantees */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Shield className="h-3 w-3" />
            Secure payment processing • 30-day money-back guarantee
            <RefreshCw className="h-3 w-3" />
            Instant credit delivery
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
