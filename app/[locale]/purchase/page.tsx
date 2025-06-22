"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Zap,
  Star,
  Loader2,
  Shield,
  Smartphone,
  Clock,
  AlertCircle,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  formattedCardPrice?: string;
  formattedMpesaPrice?: string;
  pricePerCredit: string;
}

interface PaymentStatus {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  mpesaResponseDescription?: string;
}

interface PaymentStep {
  key: string;
  title: string;
  status: "waiting" | "active" | "completed" | "failed";
}

interface PaymentProcessingModalProps {
  isOpen: boolean;
  phoneNumber: string;
  packageName: string;
  amount: string;
  timeRemaining: number;
  currentStep: string;
  paymentStatus: PaymentStatus | null;
  onClose: () => void;
  onRetry: () => void;
}

function PaymentProcessingModal({
  isOpen,
  phoneNumber,
  packageName,
  amount,
  timeRemaining,
  currentStep,
  paymentStatus,
  onClose,
  onRetry,
}: PaymentProcessingModalProps) {
  const t = useTranslations("creditsModal");

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getStatusColor = () => {
    if (paymentStatus?.status === "COMPLETED") return "text-green-600";
    if (
      paymentStatus?.status === "FAILED" ||
      paymentStatus?.status === "CANCELLED"
    )
      return "text-red-600";
    return "text-blue-600";
  };

  const getStatusIcon = () => {
    if (paymentStatus?.status === "COMPLETED") {
      return <Check className="h-8 w-8 text-green-600" />;
    }
    if (
      paymentStatus?.status === "FAILED" ||
      paymentStatus?.status === "CANCELLED"
    ) {
      return <AlertCircle className="h-8 w-8 text-red-600" />;
    }
    return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
  };

  const isProcessing = !paymentStatus || paymentStatus.status === "PENDING";
  const isSuccess = paymentStatus?.status === "COMPLETED";
  const isFailed =
    paymentStatus?.status === "FAILED" || paymentStatus?.status === "CANCELLED";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-center mb-4">
            {getStatusIcon()}
          </div>
          <h2
            className={`text-xl font-semibold text-center ${getStatusColor()}`}
          >
            {isSuccess
              ? t("payments.status.completed")
              : isFailed
              ? t("payments.status.failed")
              : t("payments.processing.title")}
          </h2>
        </div>

        {/* Content */}
        <div className="p-6">
          {isProcessing && (
            <>
              {/* Timer */}
              <div className="text-center mb-6">
                <div className="text-3xl font-mono font-bold text-blue-600 mb-2">
                  {formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-gray-600">
                  {t("payments.processing.timeRemaining")}
                </p>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Smartphone className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">
                      {t("payments.processing.instructions.title")}
                    </h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• {t("payments.processing.instructions.step1")}</li>
                      <li>• {t("payments.processing.instructions.step2")}</li>
                      <li>• {t("payments.processing.instructions.step3")}</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("phoneNumber")}:</span>
                  <span className="font-medium">{phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("package")}:</span>
                  <span className="font-medium">{packageName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">{t("amount")}:</span>
                  <span className="font-medium">{amount}</span>
                </div>
              </div>
            </>
          )}

          {isSuccess && (
            <div className="text-center space-y-4">
              <div className="text-green-600 mb-4">
                <Check className="h-16 w-16 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {t("payments.success.title")}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {t("payments.success.message", { packageName, amount })}
                </p>
              </div>
              <Button
                onClick={onClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {t("payments.success.continue")}
              </Button>
            </div>
          )}

          {isFailed && (
            <div className="text-center space-y-4">
              <div className="text-red-600 mb-4">
                <AlertCircle className="h-16 w-16 mx-auto mb-2" />
                <h3 className="text-lg font-semibold">
                  {t("payments.failed.title")}
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  {paymentStatus?.mpesaResponseDescription ||
                    t("payments.failed.defaultMessage")}
                </p>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={onRetry}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t("payments.failed.retry")}
                </Button>
                <Button onClick={onClose} variant="outline" className="w-full">
                  {t("payments.failed.cancel")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Close button for non-processing states */}
        {!isProcessing && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          >
            <AlertCircle className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

function PurchasePageContent() {
  const { user } = useUser();
  const t = useTranslations("creditsModal");
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(
    null
  );
  const [savedPhoneNumber, setSavedPhoneNumber] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "mpesa">("mpesa");
  const [paymentSteps, setPaymentSteps] = useState<PaymentStep[]>([]);
  const [currentStep, setCurrentStep] = useState<string>("");
  const [timeRemaining, setTimeRemaining] = useState(80); // 80 seconds max polling time
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const requiredCredits = searchParams.get("required");
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const MPESA_PRICE = 200;

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Timer for payment processing
  useEffect(() => {
    if (isProcessingPayment && timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsProcessingPayment(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isProcessingPayment, timeRemaining]);

  const initializePaymentSteps = () => {
    const steps: PaymentStep[] = [
      {
        key: "initiated",
        title: t("payments.steps.initiated"),
        status: "waiting",
      },
      {
        key: "pending",
        title: t("payments.steps.pending"),
        status: "waiting",
      },
      {
        key: "processing",
        title: t("payments.steps.processing"),
        status: "waiting",
      },
      {
        key: "completed",
        title: t("payments.steps.completed"),
        status: "waiting",
      },
    ];
    setPaymentSteps(steps);
    setCurrentStep("initiated");
  };

  const updatePaymentStep = (
    stepKey: string,
    status: "active" | "completed" | "failed"
  ) => {
    setPaymentSteps((prev) =>
      prev.map((step) => {
        if (step.key === stepKey) {
          return { ...step, status };
        }
        const stepIndex = prev.findIndex((s) => s.key === stepKey);
        const currentIndex = prev.findIndex((s) => s.key === step.key);
        if (currentIndex < stepIndex && status !== "failed") {
          return { ...step, status: "completed" };
        }
        return step;
      })
    );
    setCurrentStep(stepKey);
  };

  useEffect(() => {
    const loadData = async () => {
      setIsLoadingPackages(true);
      try {
        const [packagesResponse, mpesaResponse] = await Promise.all([
          fetch("/api/payments/packages"),
          fetch("/api/payments/create-mpesa"),
        ]);

        if (!packagesResponse.ok) {
          throw new Error("Failed to load packages");
        }
        const packagesData = await packagesResponse.json();

        if (!packagesData.success || !packagesData.packages) {
          throw new Error(packagesData.error || "Invalid API response");
        }

        const packagesWithCountryPricing = packagesData.packages
          .filter(
            (pkg: any) =>
              !pkg.id.includes("trial") &&
              !pkg.name.toLowerCase().includes("trial")
          )
          .map((pkg: any) => ({
            ...pkg,
            cardPrice: pkg.price,
            mpesaPrice: MPESA_PRICE,
            formattedCardPrice: t("priceFormats.mzn", {
              price: pkg.price,
            }),
            formattedMpesaPrice: t("priceFormats.mzn", {
              price: MPESA_PRICE,
            }),
          }));

        if (packagesWithCountryPricing.length > 0) {
          setPackages(packagesWithCountryPricing);
        } else {
          const fallbackPackages = [
            {
              id: "pro",
              name: t("fallbackPackage.pro.name"),
              credits: 44,
              price: 200,
              cardPrice: 200,
              mpesaPrice: MPESA_PRICE,
              formattedCardPrice: t("priceFormats.mzn", { price: 200 }),
              formattedMpesaPrice: t("priceFormats.mzn", {
                price: MPESA_PRICE,
              }),
              description: t("fallbackPackage.pro.description"),
              pricePerCredit: (MPESA_PRICE / 44).toFixed(2),
            },
          ];
          setPackages(fallbackPackages);
        }

        if (mpesaResponse.ok) {
          const mpesaData = await mpesaResponse.json();
          if (mpesaData.user?.savedPhoneNumber) {
            setSavedPhoneNumber(mpesaData.user.savedPhoneNumber);
            setPhoneNumber(mpesaData.user.savedPhoneNumber);
          }
        } else {
          console.warn(
            "Failed to load saved phone number:",
            mpesaResponse.statusText
          );
        }
      } catch (error) {
        console.error("Failed to load data:", error);
        const fallbackPackages = [
          {
            id: "pro",
            name: t("fallbackPackage.pro.name"),
            credits: 44,
            price: 200,
            cardPrice: 200,
            mpesaPrice: MPESA_PRICE,
            formattedCardPrice: t("priceFormats.mzn", { price: 200 }),
            formattedMpesaPrice: t("priceFormats.mzn", {
              price: MPESA_PRICE,
            }),
            description: t("fallbackPackage.pro.description"),
            pricePerCredit: (MPESA_PRICE / 44).toFixed(2),
          },
        ];
        setPackages(fallbackPackages);
        toast.error(t("errors.offlinePricing"));
      } finally {
        setIsLoadingPackages(false);
      }
    };

    loadData();
  }, [t]);

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

  const isPopular = (index: number, total: number) => {
    return total === 3 && index === 1;
  };

  const validatePhoneNumber = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.startsWith("258")) {
      if (cleaned.length !== 12) return false;
      const localNumber = cleaned.substring(3);
      const prefix = localNumber.substring(0, 2);
      const validPrefixes = ["82", "83", "84", "85", "86", "87"];
      return validPrefixes.includes(prefix) && localNumber.length === 9;
    }
    if (cleaned.length === 9) {
      const prefix = cleaned.substring(0, 2);
      const validPrefixes = ["82", "83", "84", "85", "86", "87"];
      return validPrefixes.includes(prefix);
    }
    return false;
  };

  const handleSuccessfulPayment = async () => {
    await queryClient.invalidateQueries({ queryKey: ["userCredits"] });
    // Payment modal will handle the success state
  };

  const resetPaymentState = () => {
    // Clear all payment-related state
    setPaymentStatus(null);
    setCurrentStep("");
    setTimeRemaining(80);
    setPaymentSteps([]);
    setIsProcessingPayment(false);
    setIsLoading(false);

    // Clear any ongoing timers
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePaymentComplete = async () => {
    resetPaymentState();

    // Small delay to ensure credits are updated before redirecting
    await new Promise((resolve) => setTimeout(resolve, 500));
    router.push(redirectUrl);
  };

  const handlePaymentRetry = () => {
    resetPaymentState();
    // User can try payment again - resetPaymentState clears all states
  };

  const pollPaymentStatus = async (paymentId: string, maxAttempts = 20) => {
    let attempts = 0;

    // Smart polling with exponential backoff
    const getPollingInterval = (attempt: number) => {
      if (attempt <= 3) return 2000; // First 3 attempts: 2 seconds (fast initial checks)
      if (attempt <= 8) return 4000; // Next 5 attempts: 4 seconds
      return 6000; // Remaining attempts: 6 seconds
    };

    const poll = () => {
      setTimeout(async () => {
        attempts++;
        try {
          const response = await fetch(
            `/api/payments/mpesa-status?paymentId=${paymentId}`
          );
          const result = await response.json();

          if (result.success && result.payment) {
            setPaymentStatus(result.payment);

            if (result.payment.status === "PENDING") {
              updatePaymentStep("pending", "active");

              // Continue polling if not exceeded max attempts and payment still processing
              if (attempts < maxAttempts && isProcessingPayment) {
                poll(); // Schedule next poll
              } else if (attempts >= maxAttempts) {
                // Timeout reached
                updatePaymentStep("pending", "failed");
                setPaymentStatus({
                  ...result.payment,
                  status: "FAILED",
                  mpesaResponseDescription: t("payments.status.timeout"),
                });
              }
            } else if (result.payment.status === "COMPLETED") {
              updatePaymentStep("processing", "completed");
              updatePaymentStep("completed", "completed");
              handleSuccessfulPayment();
            } else if (
              result.payment.status === "FAILED" ||
              result.payment.status === "CANCELLED"
            ) {
              updatePaymentStep("pending", "failed");
              // Payment status is already set, modal will show failure
            }
          } else {
            // API error, retry if not max attempts
            if (attempts < maxAttempts && isProcessingPayment) {
              poll();
            } else {
              updatePaymentStep(currentStep, "failed");
              setPaymentStatus({
                id: paymentId,
                status: "FAILED",
                amount: 0,
                createdAt: new Date().toISOString(),
                mpesaResponseDescription: t("errors.paymentFailed"),
              });
            }
          }
        } catch (error) {
          console.error("Status check failed:", error);

          // Retry on error if not max attempts
          if (attempts < maxAttempts && isProcessingPayment) {
            poll();
          } else {
            updatePaymentStep(currentStep, "failed");
            setPaymentStatus({
              id: paymentId,
              status: "FAILED",
              amount: 0,
              createdAt: new Date().toISOString(),
              mpesaResponseDescription: t("errors.paymentFailed"),
            });
          }
        }
      }, getPollingInterval(attempts));
    };

    // Start polling
    poll();
  };

  const handleCardPayment = async () => {
    if (!user) return toast.error(t("errors.signInRequired"));
    if (!selectedPackage) return toast.error(t("errors.selectPackage"));
    const selectedPkg = packages.find((pkg) => pkg.id === selectedPackage);
    if (!selectedPkg) return toast.error(t("errors.packageNotFound"));
    setIsLoading(true);
    try {
      const response = await fetch("/api/payments/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: selectedPackage,
          paymentMethod: "credit_card",
          returnUrl: `${window.location.origin}/dashboard?payment=success`,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("errors.paymentFailed"));
      }
      const data = await response.json();
      if (!data.success || !data.checkoutUrl) {
        throw new Error(data.message || t("errors.paymentFailed"));
      }
      window.location.href = data.checkoutUrl;
    } catch (error) {
      console.error("Card payment failed:", error);
      toast.error(
        error instanceof Error
          ? t("errors.paymentFailedWithReason", { reason: error.message })
          : t("errors.paymentFailed")
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleMpesaPayment = async () => {
    if (!user) return toast.error(t("errors.signInRequired"));
    if (!selectedPackage) return toast.error(t("errors.selectPackage"));
    if (!phoneNumber.trim()) return toast.error(t("errors.enterPhone"));
    if (!validatePhoneNumber(phoneNumber))
      return toast.error(t("errors.validPhone"));
    const selectedPkg = packages.find((pkg) => pkg.id === selectedPackage);
    if (!selectedPkg) return toast.error(t("errors.packageNotFound"));

    setIsLoading(true);
    setIsProcessingPayment(true);
    setPaymentStatus(null);
    setTimeRemaining(80); // Reset timer to 80 seconds
    initializePaymentSteps();
    updatePaymentStep("initiated", "active");

    try {
      const response = await fetch("/api/payments/create-mpesa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          packageType: selectedPackage,
          phoneNumber: phoneNumber.trim(),
          description: t("mpesaDescription", {
            packageName: selectedPkg.name,
            credits: selectedPkg.credits,
          }),
        }),
      });

      if (!response.ok) {
        let errorMessage = t("errors.paymentFailed");

        if (response.status === 429) {
          errorMessage = t("errors.tooManyRequests");
        } else if (response.status >= 500) {
          errorMessage = t("errors.serverError");
        } else {
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || t("errors.paymentFailed");
          } catch (jsonError) {
            // If JSON parsing fails, use the response text or default message
            errorMessage = t("errors.paymentFailed");
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || t("errors.paymentFailed"));
      }

      // Handle enhanced C2B response
      if (data.immediateResult) {
        // Payment failed immediately, show in modal
        updatePaymentStep("initiated", "failed");
        setPaymentStatus({
          id: "immediate-failure",
          status: "FAILED",
          amount: MPESA_PRICE,
          createdAt: new Date().toISOString(),
          mpesaResponseDescription: data.message || t("errors.paymentFailed"),
        });
        return;
      }

      // Payment initiated successfully, start polling
      updatePaymentStep("initiated", "completed");

      // Only start polling for successful initiations
      if (data.paymentId) {
        pollPaymentStatus(data.paymentId);
      } else {
        // Fallback: no payment ID but should poll (edge case)
        updatePaymentStep("initiated", "failed");
        setPaymentStatus({
          id: "no-payment-id",
          status: "FAILED",
          amount: MPESA_PRICE,
          createdAt: new Date().toISOString(),
          mpesaResponseDescription: t("errors.paymentFailed"),
        });
      }
    } catch (error) {
      console.error("MPesa payment failed:", error);
      updatePaymentStep("initiated", "failed");
      setPaymentStatus({
        id: "api-error",
        status: "FAILED",
        amount: MPESA_PRICE,
        createdAt: new Date().toISOString(),
        mpesaResponseDescription:
          error instanceof Error ? error.message : t("errors.paymentFailed"),
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const paymentStatus = searchParams.get("payment");
    if (paymentStatus === "success") {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
      handleSuccessfulPayment();
    }
  }, [searchParams, t]);

  if (isLoadingPackages) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-gray-50">
      <div className="w-full max-w-4xl mx-auto px-3 py-4 sm:px-6 sm:py-6">
        {requiredCredits && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3 mb-4 text-center">
            {t("requiredCredits", { credits: requiredCredits })}
          </div>
        )}

        {/* Payment Processing Modal */}
        <PaymentProcessingModal
          isOpen={isProcessingPayment}
          phoneNumber={phoneNumber}
          packageName={
            packages.find((p) => p.id === selectedPackage)?.name || ""
          }
          amount={
            packages.find((p) => p.id === selectedPackage)
              ?.formattedMpesaPrice || ""
          }
          timeRemaining={timeRemaining}
          currentStep={currentStep}
          paymentStatus={paymentStatus}
          onClose={handlePaymentComplete}
          onRetry={handlePaymentRetry}
        />

        <div className="w-full">
          <div
            className={`w-full ${
              packages.length === 1
                ? "flex justify-center"
                : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
            }`}
          >
            {packages.map((pkg, index) => {
              const popular = isPopular(index, packages.length);
              const features = getPackageFeatures(pkg.credits);
              return (
                <Card
                  key={pkg.id}
                  className={`relative transition-all duration-200 hover:shadow-lg cursor-pointer w-full ${
                    packages.length === 1 ? "max-w-sm" : ""
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
                    <div className="absolute -top-3 left-3 sm:left-4">
                      <Badge className="bg-purple-600 text-white px-2 py-1 text-xs">
                        <Check className="h-3 w-3 mr-1" />
                        {t("selectedBadge")}
                      </Badge>
                    </div>
                  )}
                  {popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-purple-600 text-white px-2 sm:px-3 py-1 text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        {t("popularBadge")}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                    <CardTitle className="text-lg font-semibold text-center">
                      {pkg.name}
                    </CardTitle>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl font-bold text-purple-600">
                        {t("creditsAmount", { count: pkg.credits })}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 space-y-1 mt-1">
                        <div>
                          {t("paymentMethods.card")}: {pkg.formattedCardPrice}
                        </div>
                        <div>
                          {t("paymentMethods.mpesa")}: {pkg.formattedMpesaPrice}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 text-center mt-2">
                      {pkg.description}
                    </p>
                  </CardHeader>
                  <CardContent className="pt-0 px-4 sm:px-6">
                    <ul className="space-y-2 mb-4 sm:mb-6">
                      {features.slice(0, 4).map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-start text-sm"
                        >
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => setSelectedPackage(pkg.id)}
                      variant={
                        selectedPackage === pkg.id ? "default" : "outline"
                      }
                      className={`w-full text-sm ${
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
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {selectedPackage && !isProcessingPayment && (
          <div className="mt-4 sm:mt-6 w-full max-w-md mx-auto">
            <Tabs
              value={paymentMethod}
              onValueChange={(value) =>
                setPaymentMethod(value as "card" | "mpesa")
              }
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger
                  value="card"
                  className="flex items-center gap-1 sm:gap-2 text-sm"
                >
                  <CreditCard className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("cardTab")}</span>
                  <span className="sm:hidden">Card</span>
                </TabsTrigger>
                <TabsTrigger
                  value="mpesa"
                  className="flex items-center gap-1 sm:gap-2 text-sm"
                >
                  <Smartphone className="h-4 w-4" />
                  <span className="hidden sm:inline">{t("mpesaTab")}</span>
                  <span className="sm:hidden">M-Pesa</span>
                </TabsTrigger>
              </TabsList>
              <TabsContent value="card" className="space-y-4 pt-4">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-4">
                    {t("cardDescription")}
                  </p>
                  <Button
                    onClick={handleCardPayment}
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3"
                    size="lg"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t("processing")}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <CreditCard className="h-4 w-4 mr-2" />
                        <span className="truncate">
                          {t("buttons.payWithCard", {
                            amount:
                              packages.find((p) => p.id === selectedPackage)
                                ?.formattedCardPrice || "",
                          })}
                        </span>
                      </div>
                    )}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="mpesa" className="space-y-4 pt-4">
                <div className="space-y-3">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    {t("phoneNumber")}
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder={t("phonePlaceholder")}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-center"
                    disabled={isLoading}
                  />
                  {savedPhoneNumber && (
                    <p className="text-xs text-gray-500 text-center">
                      {t("savedPhoneNumber", {
                        number: savedPhoneNumber.substring(0, 6) + "***",
                      })}
                    </p>
                  )}
                  <p className="text-xs text-gray-600 text-center">
                    {t("phoneValidPrefixes")}
                  </p>
                </div>
                <Button
                  onClick={handleMpesaPayment}
                  disabled={
                    isLoading ||
                    !phoneNumber.trim() ||
                    !validatePhoneNumber(phoneNumber)
                  }
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3"
                  size="lg"
                >
                  {isLoading ? (
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t("buttons.initiatingPayment")}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Smartphone className="h-4 w-4 mr-2" />
                      <span className="truncate">
                        {t("buttons.payWithMpesa", {
                          amount:
                            packages.find((p) => p.id === selectedPackage)
                              ?.formattedMpesaPrice || "",
                        })}
                      </span>
                    </div>
                  )}
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        )}

        <div className="mt-4 sm:mt-6 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-2">
            <Shield className="h-3 w-3" />
            {t("securityBadge")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function PurchasePage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </div>
      }
    >
      <PurchasePageContent />
    </Suspense>
  );
}
