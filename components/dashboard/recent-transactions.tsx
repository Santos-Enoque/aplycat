"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Eye,
  EyeOff,
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  provider: "stripe" | "paysuite" | "mpesa";
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  packageType?: string;
  credits?: number;
  currency?: string;
  paymentMethod?: string;
  phoneNumber?: string;
  reference?: string;
  errorMessage?: string;
}

export function RecentTransactions() {
  const t = useTranslations("dashboard.transactions");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function loadTransactions() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/payments/history");

        if (!response.ok) {
          throw new Error("Failed to fetch transactions");
        }

        const data = await response.json();

        if (data.success) {
          setTransactions(data.transactions || []);
        } else {
          throw new Error(data.error || "Failed to load transactions");
        }
      } catch (err) {
        console.error("Failed to load transactions:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load transactions"
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadTransactions();
  }, []);

  const getProviderIcon = (provider: Transaction["provider"]) => {
    switch (provider) {
      case "stripe":
        return <CreditCard className="h-4 w-4" />;
      case "mpesa":
        return <Smartphone className="h-4 w-4" />;
      case "paysuite":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "failed":
      case "cancelled":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
      case "success":
        return (
          <Badge
            variant="secondary"
            className="bg-green-100 text-green-800 border-green-200"
          >
            {t("status.completed")}
          </Badge>
        );
      case "failed":
      case "cancelled":
        return (
          <Badge
            variant="secondary"
            className="bg-red-100 text-red-800 border-red-200"
          >
            {t("status.failed")}
          </Badge>
        );
      case "pending":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 border-yellow-200"
          >
            {t("status.pending")}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (transaction: Transaction) => {
    const { amount, currency = "USD", provider } = transaction;

    if (provider === "mpesa" || provider === "paysuite" || currency === "MZN") {
      return `${amount.toFixed(2)} MZN`;
    }

    if (provider === "stripe" || currency === "USD") {
      return `$${(amount / 100).toFixed(2)}`;
    }

    return `${amount} ${currency}`;
  };

  const getTransactionDescription = (transaction: Transaction) => {
    if (transaction.description) {
      return transaction.description;
    }

    if (transaction.credits) {
      return t("description.creditPurchase", {
        credits: transaction.credits,
        provider: transaction.provider.toUpperCase(),
      });
    }

    return t("description.payment", {
      provider: transaction.provider.toUpperCase(),
    });
  };

  const displayedTransactions = showAll
    ? transactions
    : transactions.slice(0, 5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-2">{t("error.title")}</p>
            <p className="text-sm text-gray-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {t("title")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">{t("empty.title")}</p>
            <p className="text-sm text-gray-500">{t("empty.description")}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {getProviderIcon(transaction.provider)}
                  {getStatusIcon(transaction.status)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm truncate">
                    {getTransactionDescription(transaction)}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">
                      {new Date(transaction.createdAt).toLocaleDateString()}
                    </p>
                    {transaction.credits && (
                      <Badge variant="outline" className="text-xs">
                        +{transaction.credits} {t("credits")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right flex-shrink-0 ml-3">
                <p className="font-semibold text-sm">
                  {formatAmount(transaction)}
                </p>
                <div className="mt-1">{getStatusBadge(transaction.status)}</div>
              </div>
            </div>
          ))}
        </div>

        {transactions.length > 5 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              className="text-sm"
            >
              {showAll ? (
                <>
                  <EyeOff className="h-4 w-4 mr-2" />
                  {t("showLess")}
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  {t("showAll", { count: transactions.length })}
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
