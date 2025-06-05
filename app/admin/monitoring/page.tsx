// app/admin/monitoring/page.tsx (Internal monitoring dashboard)
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Database,
  Cpu,
  Activity,
} from "lucide-react";

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  service: string;
  version: string;
  environment: string;
  uptime: number;
  checks: {
    database: "healthy" | "degraded" | "down";
    openai: "healthy" | "degraded" | "down";
    memory: {
      heapUsed: number;
      heapTotal: number;
      external: number;
      rss: number;
    };
    responseTime?: number;
  };
  errors?: Array<{
    type: string;
    severity: string;
    timestamp: string;
    message: string;
  }>;
}

interface ErrorStats {
  summary: {
    totalErrors: number;
    errorsLastHour: number;
    errorsLast24Hours: number;
    lastReset: string;
  };
  byType: Record<string, number>;
  byHour: Record<string, number>;
  recentErrorTypes: Record<string, number>;
  severityDistribution: Record<string, number>;
}

export default function MonitoringDashboard() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [healthRes, statsRes] = await Promise.all([
        fetch("/api/monitoring/health"),
        fetch("/api/monitoring/stats"),
      ]);

      const healthData = await healthRes.json();
      const statsData = await statsRes.json();

      setHealth(healthData);
      setStats(statsData.statistics);
      setLastRefresh(new Date());
    } catch (error) {
      console.error("Failed to fetch monitoring data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600 bg-green-100";
      case "degraded":
        return "text-yellow-600 bg-yellow-100";
      case "unhealthy":
      case "down":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case "medium":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "low":
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading && !health) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-600" />
            <span className="ml-2 text-lg">Loading monitoring data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              🐱 Aplycat System Monitoring
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time health and performance monitoring
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Last updated: {lastRefresh.toLocaleTimeString()}
            </div>
            <Button onClick={fetchData} disabled={loading} size="sm">
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Overall Status</p>
                  <p
                    className={`text-lg font-semibold ${
                      health?.status === "healthy"
                        ? "text-green-600"
                        : health?.status === "degraded"
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {health?.status?.toUpperCase() || "UNKNOWN"}
                  </p>
                </div>
                {health?.status === "healthy" ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : health?.status === "degraded" ? (
                  <AlertTriangle className="h-8 w-8 text-yellow-600" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600" />
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Database</p>
                  <Badge
                    className={getStatusColor(
                      health?.checks.database || "unknown"
                    )}
                  >
                    {health?.checks.database || "Unknown"}
                  </Badge>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">OpenAI API</p>
                  <Badge
                    className={getStatusColor(
                      health?.checks.openai || "unknown"
                    )}
                  >
                    {health?.checks.openai || "Unknown"}
                  </Badge>
                </div>
                <Cpu className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Uptime</p>
                  <p className="text-lg font-semibold text-green-600">
                    {health?.uptime ? formatUptime(health.uptime) : "Unknown"}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Error Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Error Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stats ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {stats.summary.totalErrors}
                      </div>
                      <div className="text-sm text-gray-600">Total Errors</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {stats.summary.errorsLastHour}
                      </div>
                      <div className="text-sm text-gray-600">Last Hour</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {stats.summary.errorsLast24Hours}
                      </div>
                      <div className="text-sm text-gray-600">Last 24h</div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Errors by Type</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.byType).map(([type, count]) => (
                        <div
                          key={type}
                          className="flex justify-between items-center"
                        >
                          <span className="text-sm text-gray-600">{type}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-2">Severity Distribution</h4>
                    <div className="space-y-2">
                      {Object.entries(stats.severityDistribution).map(
                        ([severity, count]) => (
                          <div
                            key={severity}
                            className="flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2">
                              {getSeverityIcon(severity)}
                              <span className="text-sm capitalize">
                                {severity}
                              </span>
                            </div>
                            <Badge variant="outline">{count}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  No statistics available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                System Resources
              </CardTitle>
            </CardHeader>
            <CardContent>
              {health?.checks.memory ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-gray-600">Heap Usage</span>
                      <span className="text-sm font-medium">
                        {formatBytes(health.checks.memory.heapUsed)} /{" "}
                        {formatBytes(health.checks.memory.heapTotal)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            (health.checks.memory.heapUsed /
                              health.checks.memory.heapTotal) *
                            100
                          }%`,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">RSS Memory</div>
                      <div className="font-medium">
                        {formatBytes(health.checks.memory.rss)}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-600">External Memory</div>
                      <div className="font-medium">
                        {formatBytes(health.checks.memory.external)}
                      </div>
                    </div>
                  </div>

                  {health.checks.responseTime && (
                    <div className="border-t pt-4">
                      <div className="text-gray-600 text-sm">
                        Average Response Time
                      </div>
                      <div className="text-lg font-semibold">
                        {(health.checks.responseTime / 1000).toFixed(1)}s
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  No memory data available
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Errors
            </CardTitle>
          </CardHeader>
          <CardContent>
            {health?.errors && health.errors.length > 0 ? (
              <div className="space-y-3">
                {health.errors.map((error, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getSeverityIcon(error.severity)}
                        <span className="font-medium">{error.type}</span>
                        <Badge
                          className={`${
                            error.severity === "critical"
                              ? "bg-red-100 text-red-800"
                              : error.severity === "high"
                              ? "bg-orange-100 text-orange-800"
                              : error.severity === "medium"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {error.severity}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(error.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{error.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No Recent Errors
                </h3>
                <p className="text-gray-600">System is running smoothly!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Information */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Service Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">
                    {health?.service || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version:</span>
                  <span className="font-medium">
                    {health?.version || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <Badge
                    className={
                      health?.environment === "production"
                        ? "bg-red-100 text-red-800"
                        : "bg-blue-100 text-blue-800"
                    }
                  >
                    {health?.environment || "Unknown"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Check:</span>
                  <span className="font-medium">
                    {health?.timestamp
                      ? new Date(health.timestamp).toLocaleTimeString()
                      : "Unknown"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button
                  onClick={fetchData}
                  className="w-full"
                  variant="outline"
                  disabled={loading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                  />
                  Refresh Data
                </Button>
                <Button
                  onClick={() =>
                    window.open("/api/monitoring/metrics", "_blank")
                  }
                  className="w-full"
                  variant="outline"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  View Metrics
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="w-full"
                  variant="outline"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reload Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Health Status Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span>
                    <strong>Healthy:</strong> All systems operational
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span>
                    <strong>Degraded:</strong> Some issues detected
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                  <span>
                    <strong>Unhealthy:</strong> Critical issues present
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
