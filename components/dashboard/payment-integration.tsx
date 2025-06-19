// components/dashboard/payment-integration.tsx
"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EnhancedCreditsModal } from "@/components/enhanced-credits-modal";
import { usePaymentSuccess } from "@/hooks/use-payment-success";
import { usePendingPurchase } from "@/hooks/use-pending-purchase";
import {
  CreditCard,
  Plus,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { useUserCredits } from "@/hooks/use-user-credits";
import { useRouter, usePathname } from "next/navigation";

interface PaymentIntegrationProps {
  userCredits: number;
  onCreditsUpdated?: () => void;
  transactions?: Array<{
    id: string;
    type: string;
    amount: number;
    description: string;
    createdAt: Date;
  }>;
}

export function PaymentIntegration({
  userCredits,
  onCreditsUpdated,
  transactions = [],
}: PaymentIntegrationProps) {
  const { user } = useUser();
  const [showCreditsModal, setShowCreditsModal] = useState(false);
  const { pendingPurchase, clearPendingPurchase } = usePendingPurchase();
  const t = useTranslations("dashboard.paymentIntegration");
  const { credits, isLoading: isLoadingCredits } = useUserCredits();
  const router = useRouter();
  const pathname = usePathname();

  // Handle payment success
  usePaymentSuccess({
    onSuccess: () => {
      clearPendingPurchase();
      if (onCreditsUpdated) {
        onCreditsUpdated();
      }
    },
    onError: (error) => {
      clearPendingPurchase();
      console.error("Payment error:", error);
    },
  });

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "PURCHASE":
        return <CreditCard className="h-4 w-4 text-green-600" />;
      case "ANALYSIS_USE":
        return <TrendingUp className="h-4 w-4 text-blue-600" />;
      case "IMPROVEMENT_USE":
        return <Zap className="h-4 w-4 text-blue-600" />;
      case "BONUS_CREDIT":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <DollarSign className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTransactionColor = (amount: number) => {
    return amount > 0 ? "text-green-600" : "text-red-600";
  };

  const getCreditStatusColor = (credits: number) => {
    if (credits <= 2) return "text-red-600 bg-red-50";
    if (credits <= 5) return "text-yellow-600 bg-yellow-50";
    return "text-green-600 bg-green-50";
  };

  const getCreditStatusMessage = (credits: number) => {
    if (credits === 0) return "No credits remaining";
    if (credits <= 2) return "Running low on credits";
    if (credits <= 5) return "Consider buying more credits";
    return "Good credit balance";
  };

  const handleBuyCredits = () => {
    router.push(`/purchase?redirect=${pathname}`);
  };

  if (isLoadingCredits) {
    // ... existing code ...
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Credit Status Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Credit Balance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Balance */}
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">
                {userCredits}
              </div>
              <p className="text-sm text-gray-600">Credits Available</p>
            </div>

            {/* Credit Status */}
            <div
              className={`p-3 rounded-lg ${getCreditStatusColor(userCredits)}`}
            >
              <p className="text-sm font-medium">
                {getCreditStatusMessage(userCredits)}
              </p>
            </div>

            {/* Pending Purchase Alert */}
            {pendingPurchase && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Purchase in progress
                  </span>
                </div>
                <p className="text-blue-700 text-xs mt-1">
                  Completing payment for {pendingPurchase.packageId} package
                </p>
              </div>
            )}

            {/* Low Credits Warning */}
            {userCredits <= 5 && !pendingPurchase && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">
                    Low credits
                  </span>
                </div>
                <p className="text-yellow-700 text-xs mt-1">
                  You have {userCredits} credits remaining. Consider purchasing
                  more.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleBuyCredits}
                className="w-full bg-purple-600 text-white hover:bg-purple-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                {t("credits.buyButton")}
              </Button>

              {userCredits > 0 && (
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                  <div className="text-center">
                    <div className="font-medium">
                      {Math.floor(userCredits / 1)}
                    </div>
                    <div>Analyses</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {Math.floor(userCredits / 2)}
                    </div>
                    <div>Improvements</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium">
                      {Math.floor(userCredits / 3)}
                    </div>
                    <div>Job Tailoring</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {transactions.slice(0, 8).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between py-2 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-3">
                      {getTransactionIcon(transaction.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 line-clamp-1">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatDistanceToNow(
                            new Date(transaction.createdAt),
                            {
                              addSuffix: true,
                            }
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`text-sm font-medium ${getTransactionColor(
                          transaction.amount
                        )}`}
                      >
                        {transaction.amount > 0 ? "+" : ""}
                        {transaction.amount}
                      </span>
                      <p className="text-xs text-gray-500 capitalize">
                        {transaction.type.replace("_", " ").toLowerCase()}
                      </p>
                    </div>
                  </div>
                ))}

                {transactions.length > 8 && (
                  <div className="text-center pt-2">
                    <Button variant="ghost" size="sm" className="text-xs">
                      View All Transactions ({transactions.length})
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  No transactions yet
                </h3>
                <p className="text-xs text-gray-600 mb-4">
                  Your credit activity will appear here
                </p>
                <Button
                  onClick={handleBuyCredits}
                  size="sm"
                  className="bg-purple-600 text-white hover:bg-purple-700"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {t("credits.buyButton")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Credits Modal */}
      <EnhancedCreditsModal
        isOpen={showCreditsModal}
        onClose={() => setShowCreditsModal(false)}
        onCreditsUpdated={onCreditsUpdated}
      />
    </>
  );
}
