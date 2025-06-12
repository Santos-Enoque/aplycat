// components/enhanced-credits-modal.tsx
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Check,
  Zap,
  CreditCard,
  Star,
  Loader2,
  ExternalLink,
  Shield,
  RefreshCw,
  Smartphone,
  Wallet,
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

interface PaymentMethodOption {
  id: "credit_card" | "mobile_money";
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  processingTime?: string;
}

export function EnhancedCreditsModal({
  isOpen,
  onClose,
  onCreditsUpdated,
  requiredCredits,
}: CreditsModalProps) {
  const { user } = useUser();
  const t = useTranslations("creditsModal");
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    "credit_card" | "mobile_money"
  >("credit_card");

  // Get available payment methods (no limits)
  const getAvailablePaymentMethods = () => {
    return [
      {
        id: "credit_card",
        name: t("payWith", { method: "Credit/Debit Card" }),
        description: t("creditCardPayment"),
        icon: CreditCard,
        available: true,
        processingTime: "Instant",
      },
      {
        id: "mobile_money",
        name: t("payWith", { method: "Mobile Money (Emola)" }),
        description: t("mobileMoneyPayment"),
        icon: Smartphone,
        available: true,
        processingTime: "Instant",
      },
    ];
  };

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

        // Set packages with country-based pricing
        const packagesWithCountryPricing = data.packages
          .filter(
            (pkg: any) =>
              !pkg.id.includes("trial") &&
              !pkg.name.toLowerCase().includes("trial")
          )
          .map((pkg: any) => ({
            ...pkg,
            // Format price with proper currency symbol
            formattedPrice:
              data.pricing.currency === "MZN"
                ? `${pkg.price} MZN`
                : `$${pkg.price.toFixed(2)}`,
            currency: data.pricing.currency,
            countryInfo: data.country,
          }));

        setPackages(packagesWithCountryPricing);

        // Log country detection for debugging
        console.log("[CREDITS_MODAL] Country detected:", data.country);
        console.log("[CREDITS_MODAL] Pricing:", data.pricing);
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
      t("credits.packages.analyses", { count: analysisCredits }),
      t("credits.packages.improvements", { count: improvementCredits }),
      t("credits.packages.jobTailoring", { count: jobTailoringCredits }),
      credits >= 30
        ? t("credits.packages.prioritySupport")
        : t("credits.packages.emailSupport"),
      ...(credits >= 70
        ? [
            t("credits.packages.premiumSupport"),
            t("credits.packages.careerOptimization"),
          ]
        : []),
    ];
  };

  // Get popular badge for middle package
  const isPopular = (index: number, total: number) => {
    return total === 3 && index === 1; // Middle package
  };

  // No auto-switching needed since all methods are available

  // Handle purchase with explicit payment method
  const handlePurchase = async (
    packageId: string,
    paymentMethod?: "credit_card" | "mobile_money"
  ) => {
    if (!user) {
      toast.error("Please sign in to purchase credits");
      return;
    }

    // Use the passed payment method or fall back to selected one
    const finalPaymentMethod = paymentMethod || selectedPaymentMethod;

    setIsLoading(true);
    setSelectedPackage(packageId);

    // Update the selected payment method if provided
    if (paymentMethod) {
      setSelectedPaymentMethod(paymentMethod);
    }

    try {
      console.log(
        "Creating checkout for package:",
        packageId,
        "with payment method:",
        finalPaymentMethod
      );

      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          packageType: packageId,
          paymentMethod: finalPaymentMethod,
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
          paymentMethod: finalPaymentMethod,
          provider: data.provider,
          checkoutId: data.checkoutId,
          timestamp: Date.now(),
        })
      );

      // Show different messages based on payment method
      if (finalPaymentMethod === "credit_card") {
        toast.info(t("redirectingPayment"));
      } else if (finalPaymentMethod === "mobile_money") {
        toast.info(t("redirectingMobile"));
      }

      // Redirect to checkout
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
      const provider = urlParams.get("provider");

      if (paymentStatus === "success") {
        // Clear the URL parameter
        const newUrl = window.location.pathname;
        window.history.replaceState({}, "", newUrl);

        // Show success message with provider info
        const providerName = provider === "paysuite" ? "MPesa/Emola" : "Stripe";
        toast.success(`🎉 ${providerName} ${t("paymentSuccess")}`);

        // Clear pending purchase
        localStorage.removeItem("pendingPurchase");

        // Notify parent component to refresh user data
        if (onCreditsUpdated) {
          onCreditsUpdated();
        }
      }
    }
  }, [isOpen, onCreditsUpdated, t]);

  // Loading state for packages
  if (isLoadingPackages) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              <Zap className="h-6 w-6 inline mr-2 text-purple-600" />
              {t("title")}
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
            {t("title")}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            {t("subtitle")}
          </DialogDescription>
        </DialogHeader>

        {requiredCredits && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3 mx-4 my-4 text-center">
            {t("requiredCredits", { credits: requiredCredits })}
          </div>
        )}

        {/* Centered pricing cards */}
        <div className="flex justify-center">
          <div
            className={`mt-6 ${
              packages.length === 1
                ? "flex justify-center"
                : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl"
            }`}
          >
            {packages.map((pkg, index) => {
              const popular = isPopular(index, packages.length);
              const features = getPackageFeatures(pkg.credits);

              return (
                <Card
                  key={pkg.id}
                  className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
                    packages.length === 1 ? "w-80" : ""
                  } ${
                    selectedPackage === pkg.id
                      ? "border-purple-500 shadow-lg ring-2 ring-purple-200"
                      : popular
                      ? "border-purple-500 shadow-lg ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-purple-300"
                  }`}
                  onClick={() => setSelectedPackage(pkg.id)}
                >
                  {selectedPackage === pkg.id && (
                    <div className="absolute -top-3 left-4">
                      <Badge className="bg-green-600 text-white px-2 py-1 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        {t("selected")}
                      </Badge>
                    </div>
                  )}
                  {popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white px-3 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        {t("mostPopular")}
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-semibold text-center">
                      {pkg.name}
                    </CardTitle>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">
                        {(pkg as any).formattedPrice || `$${pkg.price}`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {pkg.credits} credits
                      </div>
                      <div className="text-xs text-green-600 font-medium mt-1">
                        {(pkg as any).currency === "MZN"
                          ? `${(pkg.price / pkg.credits).toFixed(0)} MZN`
                          : `$${pkg.pricePerCredit}`}{" "}
                        {t("perCredit")}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      {pkg.description}
                    </p>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <ul className="space-y-2 mb-6">
                      {features.slice(0, 4).map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-center text-sm"
                        >
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-3">
                      {/* Package Selection */}
                      <Button
                        onClick={() => setSelectedPackage(pkg.id)}
                        variant={
                          selectedPackage === pkg.id ? "default" : "outline"
                        }
                        className={`w-full ${
                          selectedPackage === pkg.id
                            ? "bg-purple-600 hover:bg-purple-700 border-purple-600"
                            : popular
                            ? "border-purple-500 text-purple-700 hover:bg-purple-50"
                            : "border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {selectedPackage === pkg.id ? (
                          <div className="flex items-center">
                            <Check className="h-4 w-4 mr-2" />
                            {t("packageSelected")}
                          </div>
                        ) : (
                          t("selectPackage")
                        )}
                      </Button>

                      {/* Payment Method Selection - Only show when package is selected */}
                      {selectedPackage === pkg.id && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 text-center">
                            {t("choosePaymentMethod")}
                          </p>
                          <div className="grid grid-cols-1 gap-2">
                            {getAvailablePaymentMethods().map((method) => (
                              <Button
                                key={method.id}
                                onClick={() => {
                                  handlePurchase(
                                    pkg.id,
                                    method.id as "credit_card" | "mobile_money"
                                  );
                                }}
                                disabled={isLoading}
                                variant="outline"
                                className="w-full flex items-center justify-center py-3 hover:bg-green-50 hover:border-green-500 hover:text-green-700"
                              >
                                {isLoading &&
                                selectedPaymentMethod === method.id ? (
                                  <div className="flex items-center">
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    {t("processing")}
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <method.icon className="h-4 w-4 mr-2" />
                                    {method.name}
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </div>
                                )}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Simplified guarantees */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Shield className="h-3 w-3" />
            {t("guarantees")}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
