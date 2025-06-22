"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  Download,
  RefreshCw,
  DollarSign,
  CreditCard,
  Users,
  TrendingUp,
  Calendar,
  Smartphone,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  type: string;
  provider: "stripe" | "mpesa" | "paysuite";
  amount: number;
  description?: string;
  status: string;
  createdAt: string;
  completedAt?: string | null;
  user: User;
  credits?: number;
  currency?: string;
  paymentMethod?: string;
  phoneNumber?: string;
  reference?: string;
  errorMessage?: string;
}

interface TransactionSummary {
  totalTransactions: number;
  completedTransactions: number;
  pendingTransactions: number;
  failedTransactions: number;
  totalRevenue: number;
  todayRevenue: number;
  todayTransactions: number;
}

interface TransactionFilters {
  status?: string;
  provider?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

interface AdminTransactionsResponse {
  success: boolean;
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  summary: TransactionSummary;
  filters: TransactionFilters;
  error?: string;
}

export function AdminDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 25,
    total: 0,
    pages: 0,
  });
  const [filters, setFilters] = useState<TransactionFilters>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchTransactions = useCallback(
    async (newFilters?: TransactionFilters, page = 1) => {
      try {
        setIsRefreshing(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          ...filters,
          ...newFilters,
        });

        // Remove empty values
        for (const [key, value] of Array.from(params.entries())) {
          if (!value) {
            params.delete(key);
          }
        }

        const response = await fetch(`/api/admin/transactions?${params}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data: AdminTransactionsResponse = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to fetch transactions");
        }

        setTransactions(data.data);
        setSummary(data.summary);
        setPagination(data.pagination);
        setFilters(data.filters);
      } catch (error) {
        console.error("Failed to fetch transactions:", error);
        toast.error("Failed to load transactions", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [filters, pagination.limit]
  );

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleFilterChange = (
    key: keyof TransactionFilters,
    value: string | undefined
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTransactions(newFilters, 1);
  };

  const handleSearch = () => {
    handleFilterChange("search", searchTerm || undefined);
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchTransactions(filters, newPage);
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
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    switch (normalizedStatus) {
      case "completed":
      case "success":
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case "failed":
      case "cancelled":
        return <Badge className="bg-red-100 text-red-800">Failed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case "stripe":
        return <CreditCard className="h-4 w-4 text-blue-600" />;
      case "mpesa":
        return <Smartphone className="h-4 w-4 text-green-600" />;
      case "paysuite":
        return <Smartphone className="h-4 w-4 text-purple-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatAmount = (transaction: Transaction) => {
    const { amount, currency = "USD" } = transaction;
    const formatter = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const formattedAmount = formatter.format(amount || 0);

    if (currency === "MZN") {
      return `${formattedAmount} MZN`;
    }

    if (currency === "USD") {
      return `$${formattedAmount}`;
    }

    return `${formattedAmount} ${currency}`;
  };

  const formatUserName = (user: User) => {
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    return user.email;
  };

  const getDateRangePresets = () => [
    { label: "Today", value: "today" },
    { label: "Yesterday", value: "yesterday" },
    { label: "Last 7 days", value: "7days" },
    { label: "Last 30 days", value: "30days" },
    { label: "This month", value: "month" },
    { label: "Last month", value: "lastMonth" },
  ];

  const handleDatePreset = (preset: string) => {
    const today = new Date();
    let dateFrom: string | undefined;
    let dateTo: string | undefined;

    switch (preset) {
      case "today":
        dateFrom = today.toISOString().split("T")[0];
        dateTo = dateFrom;
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        dateFrom = dateTo = yesterday.toISOString().split("T")[0];
        break;
      case "7days":
        const sevenDays = new Date(today);
        sevenDays.setDate(sevenDays.getDate() - 7);
        dateFrom = sevenDays.toISOString().split("T")[0];
        dateTo = today.toISOString().split("T")[0];
        break;
      case "30days":
        const thirtyDays = new Date(today);
        thirtyDays.setDate(thirtyDays.getDate() - 30);
        dateFrom = thirtyDays.toISOString().split("T")[0];
        dateTo = today.toISOString().split("T")[0];
        break;
      case "month":
        dateFrom = new Date(today.getFullYear(), today.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        dateTo = today.toISOString().split("T")[0];
        break;
      case "lastMonth":
        const lastMonth = new Date(
          today.getFullYear(),
          today.getMonth() - 1,
          1
        );
        const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        dateFrom = lastMonth.toISOString().split("T")[0];
        dateTo = lastMonthEnd.toISOString().split("T")[0];
        break;
    }

    const newFilters = { ...filters, dateFrom, dateTo };
    setFilters(newFilters);
    fetchTransactions(newFilters, 1);
  };

  if (isLoading) {
    return <AdminDashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Manage transactions and monitor sales performance
          </p>
        </div>
        <Button
          onClick={() => fetchTransactions(filters, pagination.page)}
          disabled={isRefreshing}
          variant="outline"
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Revenue
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalRevenue.toFixed(2)} MZN
              </div>
              <p className="text-xs text-muted-foreground">
                All time revenue from completed transactions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Revenue
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.todayRevenue.toFixed(2)} MZN
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.todayTransactions} transactions today
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Transactions
              </CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.totalTransactions}
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.completedTransactions} completed,{" "}
                {summary.pendingTransactions} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(
                  (summary.completedTransactions / summary.totalTransactions) *
                  100
                ).toFixed(1)}
                %
              </div>
              <p className="text-xs text-muted-foreground">
                {summary.failedTransactions} failed transactions
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Date Presets */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Quick Date Ranges
            </label>
            <div className="flex flex-wrap gap-2">
              {getDateRangePresets().map((preset) => (
                <Button
                  key={preset.value}
                  variant="outline"
                  size="sm"
                  onClick={() => handleDatePreset(preset.value)}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleFilterChange("dateFrom", undefined);
                  handleFilterChange("dateTo", undefined);
                }}
              >
                Clear Dates
              </Button>
            </div>
          </div>

          {/* Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
                <Button onClick={handleSearch} size="sm">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={filters.status || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "status",
                    value === "all" ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Provider Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select
                value={filters.provider || "all"}
                onValueChange={(value) =>
                  handleFilterChange(
                    "provider",
                    value === "all" ? undefined : value
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All providers</SelectItem>
                  <SelectItem value="stripe">Stripe</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="paysuite">PaySuite</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date From */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                From Date
              </label>
              <Input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  handleFilterChange("dateFrom", e.target.value || undefined)
                }
              />
            </div>

            {/* Date To */}
            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) =>
                  handleFilterChange("dateTo", e.target.value || undefined)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Badge variant="outline">{pagination.total} total</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      No transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {transaction.id.substring(0, 8)}...
                          </div>
                          {transaction.credits && (
                            <div className="text-sm text-gray-500">
                              +{transaction.credits} credits
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {formatUserName(transaction.user)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {transaction.user.email}
                          </div>
                          {transaction.phoneNumber && (
                            <div className="text-sm text-gray-500">
                              {transaction.phoneNumber}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatAmount(transaction)}
                        </div>
                        {transaction.currency && (
                          <div className="text-sm text-gray-500">
                            {transaction.currency}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(transaction.status)}
                          {getStatusBadge(transaction.status)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getProviderIcon(transaction.provider)}
                          <span className="capitalize">
                            {transaction.provider}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>
                            {new Date(
                              transaction.createdAt
                            ).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(
                              transaction.createdAt
                            ).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {transaction.reference && (
                            <div>Ref: {transaction.reference}</div>
                          )}
                          {transaction.errorMessage && (
                            <div
                              className="text-red-600 truncate max-w-32"
                              title={transaction.errorMessage}
                            >
                              {transaction.errorMessage}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} transactions
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>

      {/* Summary Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-16" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-20" />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-16 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Skeleton */}
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
