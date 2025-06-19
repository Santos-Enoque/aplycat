"use client";

import { useState, useEffect, useRef } from "react";
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
import { ThankYouModal } from "@/components/thank-you-modal";

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

export default function PurchasePage() {
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
  const [showThankYouModal, setShowThankYouModal] = useState(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const requiredCredits = searchParams.get("required");
  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  const TEST_MPESA_PRICE = 5;

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

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
            mpesaPrice: TEST_MPESA_PRICE,
            formattedCardPrice: t("priceFormats.usd", {
              price: (pkg.price / 100).toFixed(2),
            }),
            formattedMpesaPrice: t("priceFormats.mznTest", {
              price: TEST_MPESA_PRICE,
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
              mpesaPrice: TEST_MPESA_PRICE,
              formattedCardPrice: t("priceFormats.usd", { price: "2.00" }),
              formattedMpesaPrice: t("priceFormats.mznTest", {
                price: TEST_MPESA_PRICE,
              }),
              description: t("fallbackPackage.pro.description"),
              pricePerCredit: "5",
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
            mpesaPrice: TEST_MPESA_PRICE,
            formattedCardPrice: t("priceFormats.usd", { price: "2.00" }),
            formattedMpesaPrice: t("priceFormats.mznTest", {
              price: TEST_MPESA_PRICE,
            }),
            description: t("fallbackPackage.pro.description"),
            pricePerCredit: "5",
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
    setShowThankYouModal(true);
  };

  const pollPaymentStatus = async (paymentId: string, maxAttempts = 30) => {
    let attempts = 0;
    const poll = setInterval(async () => {
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
          } else if (result.payment.status === "COMPLETED") {
            updatePaymentStep("processing", "completed");
            updatePaymentStep("completed", "completed");
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsProcessingPayment(false);
            handleSuccessfulPayment();
          } else if (result.payment.status === "FAILED") {
            updatePaymentStep("pending", "failed");
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsProcessingPayment(false);
            toast.error(
              t("errors.paymentFailedWithReason", {
                reason:
                  result.payment.mpesaResponseDescription ||
                  t("payments.status.failed"),
              })
            );
          }
          if (attempts >= maxAttempts && result.payment.status === "PENDING") {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setIsProcessingPayment(false);
            toast.warning(t("payments.status.timeout"));
          }
        }
      } catch (error) {
        console.error("Status check failed:", error);
        if (attempts >= maxAttempts) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsProcessingPayment(false);
          updatePaymentStep(currentStep, "failed");
          toast.error(t("errors.paymentFailed"));
        }
      }
    }, 3000);
    pollIntervalRef.current = poll;
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
          successUrl: `${window.location.origin}/dashboard?payment=success`,
          cancelUrl: `${window.location.origin}/dashboard?payment=cancelled`,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t("errors.paymentFailed"));
      }
      const data = await response.json();
      if (!data.success || !data.url) {
        throw new Error(data.message || t("errors.paymentFailed"));
      }
      window.location.href = data.url;
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
        const errorData = await response.json();
        throw new Error(errorData.message || t("errors.paymentFailed"));
      }
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.message || t("errors.paymentFailed"));
      }
      updatePaymentStep("initiated", "completed");
      toast.success(t("payments.status.initiated"));
      pollPaymentStatus(data.paymentId);
    } catch (error) {
      console.error("MPesa payment failed:", error);
      setIsProcessingPayment(false);
      updatePaymentStep("initiated", "failed");
      toast.error(
        error instanceof Error
          ? t("errors.paymentFailedWithReason", { reason: error.message })
          : t("errors.paymentFailed")
      );
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
        <ThankYouModal
          isOpen={showThankYouModal}
          onClose={() => {
            setShowThankYouModal(false);
            router.push(redirectUrl);
          }}
          packageName={
            packages.find((p) => p.id === selectedPackage)?.name || ""
          }
        />

        {requiredCredits && (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm rounded-lg p-3 mb-4 text-center">
            {t("requiredCredits", { credits: requiredCredits })}
          </div>
        )}

        {isProcessingPayment && paymentMethod === "mpesa" && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            {paymentSteps.length > 0 && (
              <div className="mb-4">
                <div className="flex items-center justify-between overflow-x-auto pb-2">
                  {paymentSteps.map((step, index) => (
                    <div
                      key={step.key}
                      className="flex items-center flex-shrink-0"
                    >
                      <div
                        className={`flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-medium ${
                          step.status === "completed"
                            ? "bg-green-600 text-white"
                            : step.status === "active"
                            ? "bg-blue-600 text-white"
                            : step.status === "failed"
                            ? "bg-red-600 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {step.status === "completed" ? (
                          <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : step.status === "failed" ? (
                          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                        ) : step.status === "active" ? (
                          <Clock className="h-3 w-3 sm:h-4 sm:w-4 animate-pulse" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      {index < paymentSteps.length - 1 && (
                        <div
                          className={`h-1 w-4 sm:w-8 mx-1 sm:mx-2 ${
                            step.status === "completed"
                              ? "bg-green-600"
                              : "bg-gray-300"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  {paymentSteps.map((step) => (
                    <div key={step.key} className="text-xs text-center">
                      <p
                        className={`truncate ${
                          step.status === "active"
                            ? "text-blue-600 font-medium"
                            : step.status === "completed"
                            ? "text-green-600"
                            : step.status === "failed"
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        {step.title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {paymentStatus?.status === "COMPLETED" ? (
                  <Check className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                ) : paymentStatus?.status === "FAILED" ? (
                  <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 animate-pulse" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {paymentStatus?.status === "COMPLETED"
                    ? t("payments.steps.completed")
                    : paymentStatus?.status === "FAILED"
                    ? t("payments.steps.failed")
                    : currentStep === "initiated"
                    ? t("payments.steps.initiated")
                    : currentStep === "pending"
                    ? t("payments.steps.pending")
                    : t("payments.steps.processing")}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {paymentStatus?.status === "COMPLETED"
                    ? t("payments.status.completed")
                    : paymentStatus?.status === "FAILED"
                    ? paymentStatus.mpesaResponseDescription ||
                      t("payments.status.failed")
                    : currentStep === "initiated"
                    ? t("payments.status.initiated")
                    : currentStep === "pending"
                    ? t("payments.status.pending")
                    : t("payments.status.processing")}
                </p>
                {paymentStatus && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {t("paymentDetails", {
                      amount: paymentStatus.amount,
                      status: paymentStatus.status,
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
