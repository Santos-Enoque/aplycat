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
        name: "Credit/Debit Card",
        description: "Visa, Mastercard, American Express",
        icon: CreditCard,
        available: true,
        processingTime: "Instant",
      },
      {
        id: "mobile_money",
        name: "Mobile Money (Emola)",
        description: "Digital wallet payment via Emola",
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
        toast.info("Redirecting to secure payment...");
      } else if (finalPaymentMethod === "mobile_money") {
        toast.info("Redirecting to mobile money payment...");
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
        toast.success(
          `🎉 ${providerName} payment successful! Your credits have been added to your account.`
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
          <span>Secure payment processing by Stripe & PaySuite</span>
        </div>

        {/* Payment Methods Info */}
        <div className="mx-4 mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            💳 Available Payment Methods
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-700">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <span>
                <strong>Credit/Debit Cards:</strong> Visa, Mastercard, Amex
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              <span>
                <strong>Mobile Money:</strong> Emola (instant processing)
              </span>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            ℹ️ Payment method selection happens after choosing your package
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {packages.map((pkg, index) => {
            const popular = isPopular(index, packages.length);
            const features = getPackageFeatures(pkg.credits);

            return (
              <Card
                key={pkg.id}
                className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer ${
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
                      Selected
                    </Badge>
                  </div>
                )}
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
                          Package Selected
                        </div>
                      ) : (
                        "Select This Package"
                      )}
                    </Button>

                    {/* Payment Method Selection - Only show when package is selected */}
                    {selectedPackage === pkg.id && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700 text-center">
                          Choose Payment Method:
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
                                  Processing...
                                </div>
                              ) : (
                                <div className="flex items-center">
                                  <method.icon className="h-4 w-4 mr-2" />
                                  Pay with {method.name}
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
