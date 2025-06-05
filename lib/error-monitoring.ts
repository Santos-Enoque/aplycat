// lib/error-monitoring.ts
/**
 * Complete error monitoring and logging utilities for production resilience
 * This is the full implementation with all features
 */

interface ErrorContext {
    userId?: string;
    fileName?: string;
    fileSize?: number;
    timestamp: string;
    userAgent?: string;
    processingTime?: number;
    strategy?: string;
    requestId?: string;
    ipAddress?: string;
    route?: string;
    environment?: string;
    nodeVersion?: string;
    memoryUsage?: NodeJS.MemoryUsage;
  }
  
  interface ParseError {
    type: 'JSON_PARSE_ERROR' | 'OPENAI_ERROR' | 'NETWORK_ERROR' | 'FILE_ERROR' | 'AUTH_ERROR' | 'RATE_LIMIT_ERROR' | 'UNKNOWN_ERROR';
    message: string;
    context: ErrorContext;
    rawResponse?: string;
    stackTrace?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    resolvedAt?: string;
    resolution?: string;
  }
  
  interface PerformanceMetrics {
    responseTime: number;
    parseStrategy: string;
    fileSize: number;
    processingSteps: string[];
    memoryUsage?: NodeJS.MemoryUsage;
    cpuUsage?: NodeJS.CpuUsage;
    timestamp: string;
    userId?: string;
    route?: string;
  }
  
  interface SystemHealth {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    service: string;
    version: string;
    environment: string;
    uptime: number;
    checks: {
      database: 'healthy' | 'degraded' | 'down';
      openai: 'healthy' | 'degraded' | 'down';
      memory: NodeJS.MemoryUsage;
      cpu?: NodeJS.CpuUsage;
      diskSpace?: number;
      responseTime?: number;
      errorRate?: number;
    };
    errors?: ParseError[];
    warnings?: string[];
    metrics?: {
      totalRequests: number;
      successfulRequests: number;
      failedRequests: number;
      averageResponseTime: number;
    };
  }
  
  interface ErrorStatistics {
    summary: {
      totalErrors: number;
      errorsLastHour: number;
      errorsLast24Hours: number;
      errorsLastWeek: number;
      lastReset: string;
      uptimePercentage: number;
    };
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byHour: Record<string, number>;
    byDay: Record<string, number>;
    recentErrorTypes: Record<string, number>;
    severityDistribution: Record<string, number>;
    trends: {
      hourlyTrend: Array<{ hour: string; count: number }>;
      dailyTrend: Array<{ day: string; count: number }>;
      typeDistribution: Array<{ type: string; count: number; percentage: number }>;
    };
    performance: {
      averageResponseTime: number;
      p95ResponseTime: number;
      p99ResponseTime: number;
      requestsPerHour: number;
      successRate: number;
    };
  }
  
  // In-memory storage for errors and metrics
  class ErrorStore {
    private errors: ParseError[] = [];
    private performanceMetrics: PerformanceMetrics[] = [];
    private strategyUsage: Map<string, { count: number; totalTime: number; lastUsed: string }> = new Map();
    private requestCounts: Map<string, number> = new Map();
    private responseTimes: number[] = [];
    private maxStoredErrors = 1000;
    private maxStoredMetrics = 5000;
    private maxResponseTimes = 10000;
  
    addError(error: ParseError): void {
      this.errors.unshift(error);
      if (this.errors.length > this.maxStoredErrors) {
        this.errors = this.errors.slice(0, this.maxStoredErrors);
      }
      
      // Update hourly request counts
      const hour = new Date(error.context.timestamp).toISOString().slice(0, 13);
      this.requestCounts.set(hour, (this.requestCounts.get(hour) || 0) + 1);
    }
  
    addPerformanceMetric(metric: PerformanceMetrics): void {
      this.performanceMetrics.unshift(metric);
      if (this.performanceMetrics.length > this.maxStoredMetrics) {
        this.performanceMetrics = this.performanceMetrics.slice(0, this.maxStoredMetrics);
      }
  
      // Track response times
      this.responseTimes.unshift(metric.responseTime);
      if (this.responseTimes.length > this.maxResponseTimes) {
        this.responseTimes = this.responseTimes.slice(0, this.maxResponseTimes);
      }
  
      // Track strategy usage
      const strategy = metric.parseStrategy;
      const current = this.strategyUsage.get(strategy) || { count: 0, totalTime: 0, lastUsed: '' };
      this.strategyUsage.set(strategy, {
        count: current.count + 1,
        totalTime: current.totalTime + metric.responseTime,
        lastUsed: metric.timestamp
      });
    }
  
    getErrors(limit?: number): ParseError[] {
      return limit ? this.errors.slice(0, limit) : this.errors;
    }
  
    getMetrics(limit?: number): PerformanceMetrics[] {
      return limit ? this.performanceMetrics.slice(0, limit) : this.performanceMetrics;
    }
  
    getStrategyStats(): Map<string, { count: number; averageTime: number; lastUsed: string }> {
      const stats = new Map();
      for (const [strategy, data] of this.strategyUsage) {
        stats.set(strategy, {
          count: data.count,
          averageTime: data.totalTime / data.count,
          lastUsed: data.lastUsed
        });
      }
      return stats;
    }
  
    getResponseTimePercentiles(): { p50: number; p95: number; p99: number; average: number } {
      if (this.responseTimes.length === 0) {
        return { p50: 0, p95: 0, p99: 0, average: 0 };
      }
  
      const sorted = [...this.responseTimes].sort((a, b) => a - b);
      const len = sorted.length;
      
      return {
        p50: sorted[Math.floor(len * 0.5)],
        p95: sorted[Math.floor(len * 0.95)],
        p99: sorted[Math.floor(len * 0.99)],
        average: this.responseTimes.reduce((sum, time) => sum + time, 0) / len
      };
    }
  
    clear(): void {
      this.errors = [];
      this.performanceMetrics = [];
      this.strategyUsage.clear();
      this.requestCounts.clear();
      this.responseTimes = [];
    }
  
    getRequestCounts(): Map<string, number> {
      return this.requestCounts;
    }
  }
  
  // Global error store instance
  const errorStore = new ErrorStore();
  
  // Startup time for uptime calculation
  const startupTime = Date.now();
  
  /**
   * Enhanced error logging with comprehensive context
   */
  export function logError(error: ParseError): void {
    // Enrich error context
    const enrichedError: ParseError = {
      ...error,
      context: {
        ...error.context,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
        requestId: error.context.requestId || generateRequestId(),
      }
    };
  
    // Store error
    errorStore.addError(enrichedError);
  
    // Create structured log entry
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: getSeverityLogLevel(error.severity),
      service: 'aplycat-resume-analysis',
      component: 'error-monitoring',
      requestId: enrichedError.context.requestId,
      errorType: error.type,
      severity: error.severity,
      message: error.message,
      context: enrichedError.context,
      stackTrace: process.env.NODE_ENV === 'development' ? error.stackTrace : '[redacted]',
      rawResponsePreview: error.rawResponse ? 
        error.rawResponse.substring(0, 300) + (error.rawResponse.length > 300 ? '...[truncated]' : '') : 
        undefined,
      tags: {
        service: 'resume-analysis',
        component: 'json-parser',
        severity: error.severity,
        errorType: error.type,
        environment: process.env.NODE_ENV
      }
    };
  
    // Console logging with appropriate level
    const consoleMethod = getSeverityLogLevel(error.severity);
    console[consoleMethod]('[ERROR_MONITOR]', JSON.stringify(logEntry, null, 2));
  
    // Send to external monitoring services in production
    if (process.env.NODE_ENV === 'production') {
      sendToExternalMonitoring(logEntry).catch(console.error);
    }
  
    // Check if we need to trigger alerts
    checkAndTriggerAlerts(enrichedError);
  }
  
  /**
   * Log successful parsing with comprehensive performance metrics
   */
  export function logParseSuccess(strategy: string, context: ErrorContext, additionalMetrics?: Partial<PerformanceMetrics>): void {
    const performanceMetric: PerformanceMetrics = {
      responseTime: context.processingTime || 0,
      parseStrategy: strategy,
      fileSize: context.fileSize || 0,
      processingSteps: ['file-upload', 'openai-call', 'json-parse', strategy],
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      timestamp: context.timestamp,
      userId: context.userId,
      route: context.route || '/api/analyze-resume',
      ...additionalMetrics
    };
  
    // Store performance metric
    errorStore.addPerformanceMetric(performanceMetric);
  
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'aplycat-resume-analysis',
      component: 'performance-monitor',
      event: 'PARSE_SUCCESS',
      requestId: context.requestId || generateRequestId(),
      strategy,
      context,
      performance: performanceMetric,
      tags: {
        service: 'resume-analysis',
        component: 'json-parser',
        event: 'success',
        strategy,
        environment: process.env.NODE_ENV
      }
    };
  
    console.log('[PARSE_SUCCESS]', JSON.stringify(logEntry));
  
    // Check for performance degradation
    if (performanceMetric.responseTime > 60000) { // 60 seconds
      logError({
        type: 'UNKNOWN_ERROR',
        message: `Slow response time detected: ${(performanceMetric.responseTime / 1000).toFixed(1)}s`,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
        },
        severity: 'medium'
      });
    }
  }
  
  /**
   * Log comprehensive performance metrics
   */
  export function logPerformanceMetrics(metrics: PerformanceMetrics, context: ErrorContext): void {
    const enrichedMetrics: PerformanceMetrics = {
      ...metrics,
      timestamp: context.timestamp,
      userId: context.userId,
      route: context.route || '/api/analyze-resume',
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    };
  
    errorStore.addPerformanceMetric(enrichedMetrics);
  
    const logEntry = {
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'alycat-resume-analysis',
      component: 'performance-monitor',
      requestId: context.requestId || generateRequestId(),
      metrics: enrichedMetrics,
      tags: {
        service: 'resume-analysis',
        component: 'performance',
        strategy: metrics.parseStrategy,
        environment: process.env.NODE_ENV
      }
    };
  
    console.log('[PERFORMANCE]', JSON.stringify(logEntry));
  }
  
  /**
   * Generate user-friendly error messages with context
   */
  export function getUserFriendlyErrorMessage(errorType: string, context?: ErrorContext): string {
    const messageVariants = {
      OPENAI_ERROR: [
        'Our AI is taking a brief catnap 🐱💤 Please try again in a moment.',
        'The AI got distracted by a laser pointer. Retrying should work!',
        'OpenAI is having a moment. Give it another shot in a few seconds.',
        'Our cat-AI is chasing digital mice. Back in a jiffy!',
        'The AI is sharpening its claws. Please retry your request.'
      ],
      JSON_PARSE_ERROR: [
        'The AI got a bit too creative with its response. We recovered what we could! ✨',
        'Our parser worked extra hard to understand the AI\'s artistic formatting.',
        'Successfully decoded the AI\'s creative JSON expression!',
        'The AI wrote poetry instead of JSON, but we translated it for you.',
        'Our JSON decoder had to put on its detective hat, but success!'
      ],
      NETWORK_ERROR: [
        'Network hiccup detected 📡 Please check your connection and try again.',
        'The internet had a brief moment of confusion. Please retry.',
        'Connection wobbled but should be stable now. Try once more!',
        'Network gremlins detected. They\'ve been shooed away, please retry.',
        'Brief connection stumble. We\'re back on track now!'
      ],
      FILE_ERROR: [
        'There was an issue reading your file 📄 Please ensure it\'s a valid PDF under 10MB.',
        'Your file seems to be camera-shy. Try uploading it again.',
        'File format needs some love. Make sure it\'s a PDF and under 10MB.',
        'Your PDF is playing hard to get. Please re-upload it.',
        'File reading hiccup detected. Please try uploading again.'
      ],
      AUTH_ERROR: [
        'Authentication needed 🔐 Please sign in to continue.',
        'Your session took a coffee break. Please log in again.',
        'Security check required. Please authenticate to proceed.',
        'Access credentials needed. Please sign in to continue.',
        'Authentication timeout. Please log in again.'
      ],
      RATE_LIMIT_ERROR: [
        'Whoa there, speed racer! 🏎️ Please wait a moment before trying again.',
        'Rate limit reached. Take a breather and try again in a few seconds.',
        'Too many requests too fast. Slow down, champion!',
        'Easy there, tiger! Give us a moment to catch up.',
        'Request overflow detected. Please wait a moment before retrying.'
      ],
      UNKNOWN_ERROR: [
        'Something unexpected happened, but we\'re on it! 🛠️ Please try again.',
        'Mystery error detected. Our detectives are investigating. Try again?',
        'Unknown territory discovered. Please retry while we map it out.',
        'Unexpected plot twist! Please try again while we figure this out.',
        'Houston, we have a... something. Please retry your request.'
      ]
    };
  
    const messages = messageVariants[errorType as keyof typeof messageVariants] || messageVariants.UNKNOWN_ERROR;
    return messages[Math.floor(Math.random() * messages.length)];
  }
  
  /**
   * Determine if an error should trigger automatic retry
   */
  export function shouldRetry(errorType: string, attemptCount: number, context?: ErrorContext): boolean {
    const maxRetries = getMaxRetries(errorType);
    
    if (attemptCount >= maxRetries) return false;
    
    // Non-retryable error types
    const nonRetryableErrors = ['AUTH_ERROR', 'FILE_ERROR', 'RATE_LIMIT_ERROR'];
    if (nonRetryableErrors.includes(errorType)) return false;
    
    // Special logic for JSON parse errors
    if (errorType === 'JSON_PARSE_ERROR' && context?.strategy === 'manual-rebuild') {
      return false; // Already used fallback, don't retry
    }
    
    // Time-based retry logic
    const retryableErrors = ['NETWORK_ERROR', 'OPENAI_ERROR', 'UNKNOWN_ERROR'];
    return retryableErrors.includes(errorType);
  }
  
  /**
   * Get maximum retry attempts for different error types
   */
  function getMaxRetries(errorType: string): number {
    const retryLimits: Record<string, number> = {
      NETWORK_ERROR: 3,
      OPENAI_ERROR: 2,
      JSON_PARSE_ERROR: 1,
      UNKNOWN_ERROR: 2,
      FILE_ERROR: 0,
      AUTH_ERROR: 0,
      RATE_LIMIT_ERROR: 0
    };
    
    return retryLimits[errorType] || 1;
  }
  
  /**
   * Create comprehensive health check response
   */
  export function createHealthCheckResponse(): SystemHealth {
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();
    const errors = errorStore.getErrors(10);
    const responseTimeStats = errorStore.getResponseTimePercentiles();
    
    // Calculate error rate for the last hour
    const oneHourAgo = new Date(Date.now() - 3600000);
    const recentErrors = errors.filter(err => new Date(err.context.timestamp) > oneHourAgo);
    const errorRate = recentErrors.length;
    
    // Determine overall health status
    const isMemoryHealthy = (memoryUsage.heapUsed / memoryUsage.heapTotal) < 0.9;
    const isResponseTimeHealthy = responseTimeStats.p95 < 60000; // 60 seconds
    const isErrorRateHealthy = errorRate < 10; // Less than 10 errors per hour
    const hasCriticalErrors = recentErrors.some(err => err.severity === 'critical');
    
    const overallStatus: SystemHealth['status'] = 
      hasCriticalErrors || !isErrorRateHealthy ? 'unhealthy' :
      !isMemoryHealthy || !isResponseTimeHealthy ? 'degraded' :
      'healthy';
  
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'alycat-resume-analysis',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime,
      checks: {
        database: checkDatabaseHealth(),
        openai: checkOpenAIHealth(),
        memory: memoryUsage,
        cpu: process.cpuUsage(),
        responseTime: responseTimeStats.average,
        errorRate
      },
      errors: errors.slice(0, 5),
      warnings: generateWarnings(memoryUsage, responseTimeStats, errorRate),
      metrics: {
        totalRequests: errorStore.getMetrics().length + errors.length,
        successfulRequests: errorStore.getMetrics().length,
        failedRequests: errors.length,
        averageResponseTime: responseTimeStats.average
      }
    };
  }
  
  /**
   * Get comprehensive error statistics
   */
  export function getErrorStatistics(): ErrorStatistics {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000);
    const oneDayAgo = new Date(now.getTime() - 86400000);
    const oneWeekAgo = new Date(now.getTime() - 604800000);
    
    const allErrors = errorStore.getErrors();
    const recentHourErrors = allErrors.filter(err => new Date(err.context.timestamp) > oneHourAgo);
    const recentDayErrors = allErrors.filter(err => new Date(err.context.timestamp) > oneDayAgo);
    const recentWeekErrors = allErrors.filter(err => new Date(err.context.timestamp) > oneWeekAgo);
    
    // Calculate uptime percentage
    const uptimeMs = Date.now() - startupTime;
    const totalPossibleUptime = uptimeMs;
    const downtimeFromCriticalErrors = allErrors
      .filter(err => err.severity === 'critical')
      .reduce((total, err) => total + (err.resolvedAt ? 
        new Date(err.resolvedAt).getTime() - new Date(err.context.timestamp).getTime() : 
        300000), 0); // Assume 5 minutes downtime for unresolved critical errors
    
    const uptimePercentage = ((totalPossibleUptime - downtimeFromCriticalErrors) / totalPossibleUptime) * 100;
    
    // Group errors by type and severity
    const byType = allErrors.reduce((acc, err) => {
      acc[err.type] = (acc[err.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const bySeverity = allErrors.reduce((acc, err) => {
      acc[err.severity] = (acc[err.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Generate hourly and daily trends
    const hourlyTrend = generateHourlyTrend(allErrors);
    const dailyTrend = generateDailyTrend(allErrors);
    const typeDistribution = Object.entries(byType).map(([type, count]) => ({
      type,
      count,
      percentage: (count / allErrors.length) * 100
    }));
    
    // Get performance metrics
    const responseTimeStats = errorStore.getResponseTimePercentiles();
    const metrics = errorStore.getMetrics();
    const successRate = metrics.length / (metrics.length + allErrors.length) * 100;
    
    return {
      summary: {
        totalErrors: allErrors.length,
        errorsLastHour: recentHourErrors.length,
        errorsLast24Hours: recentDayErrors.length,
        errorsLastWeek: recentWeekErrors.length,
        lastReset: new Date(startupTime).toISOString(),
        uptimePercentage: Math.max(0, Math.min(100, uptimePercentage))
      },
      byType,
      bySeverity,
      byHour: generateByHourStats(allErrors),
      byDay: generateByDayStats(allErrors),
      recentErrorTypes: recentHourErrors.reduce((acc, err) => {
        acc[err.type] = (acc[err.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      severityDistribution: recentHourErrors.reduce((acc, err) => {
        acc[err.severity] = (acc[err.severity] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      trends: {
        hourlyTrend,
        dailyTrend,
        typeDistribution
      },
      performance: {
        averageResponseTime: responseTimeStats.average,
        p95ResponseTime: responseTimeStats.p95,
        p99ResponseTime: responseTimeStats.p99,
        requestsPerHour: (metrics.length + allErrors.length) / (uptimeMs / 3600000),
        successRate: isNaN(successRate) ? 100 : successRate
      }
    };
  }
  
  /**
   * Reset all error statistics and metrics
   */
  export function resetErrorStatistics(): void {
    errorStore.clear();
    console.log('[ERROR_MONITOR] Statistics reset at:', new Date().toISOString());
  }
  
  /**
   * Get strategy performance statistics
   */
  export function getStrategyStatistics() {
    return {
      usage: Object.fromEntries(errorStore.getStrategyStats()),
      responseTimeStats: errorStore.getResponseTimePercentiles(),
      totalProcessed: errorStore.getMetrics().length
    };
  }
  
  // Helper functions
  
  function getSeverityLogLevel(severity: string): 'error' | 'warn' | 'info' | 'debug' {
    switch (severity) {
      case 'critical':
      case 'high':
        return 'error';
      case 'medium':
        return 'warn';
      case 'low':
        return 'info';
      default:
        return 'debug';
    }
  }
  
  function generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  function checkDatabaseHealth(): 'healthy' | 'degraded' | 'down' {
    // In production, implement actual database connectivity check
    // For now, assume healthy unless we have database-related errors
    const dbErrors = errorStore.getErrors(50).filter(err => 
      err.message.toLowerCase().includes('database') || 
      err.message.toLowerCase().includes('prisma') ||
      err.message.toLowerCase().includes('connection')
    );
    
    if (dbErrors.length > 5) return 'down';
    if (dbErrors.length > 2) return 'degraded';
    return 'healthy';
  }
  
  function checkOpenAIHealth(): 'healthy' | 'degraded' | 'down' {
    const recentOpenAIErrors = errorStore.getErrors(50).filter(err => 
      err.type === 'OPENAI_ERROR' && 
      Date.now() - new Date(err.context.timestamp).getTime() < 300000 // Last 5 minutes
    );
    
    if (recentOpenAIErrors.length > 5) return 'down';
    if (recentOpenAIErrors.length > 2) return 'degraded';
    return 'healthy';
  }
  
  function generateWarnings(memoryUsage: NodeJS.MemoryUsage, responseTimeStats: any, errorRate: number): string[] {
    const warnings: string[] = [];
    
    const memoryUsagePercent = (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      warnings.push(`High memory usage: ${memoryUsagePercent.toFixed(1)}%`);
    }
    
    if (responseTimeStats.p95 > 45000) {
      warnings.push(`Slow response times: P95 is ${(responseTimeStats.p95 / 1000).toFixed(1)}s`);
    }
    
    if (errorRate > 5) {
      warnings.push(`Elevated error rate: ${errorRate} errors in the last hour`);
    }
    
    return warnings;
  }
  
  function generateHourlyTrend(errors: ParseError[]): Array<{ hour: string; count: number }> {
    const last24Hours = Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(Date.now() - i * 3600000);
      return hour.toISOString().slice(0, 13);
    }).reverse();
    
    const errorsByHour = errors.reduce((acc, err) => {
      const hour = new Date(err.context.timestamp).toISOString().slice(0, 13);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return last24Hours.map(hour => ({
      hour: hour.slice(11, 13) + ':00',
      count: errorsByHour[hour] || 0
    }));
  }
  
  function generateDailyTrend(errors: ParseError[]): Array<{ day: string; count: number }> {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(Date.now() - i * 86400000);
      return day.toISOString().slice(0, 10);
    }).reverse();
    
    const errorsByDay = errors.reduce((acc, err) => {
      const day = new Date(err.context.timestamp).toISOString().slice(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return last7Days.map(day => ({
      day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
      count: errorsByDay[day] || 0
    }));
  }
  
  function generateByHourStats(errors: ParseError[]): Record<string, number> {
    return errors.reduce((acc, err) => {
      const hour = new Date(err.context.timestamp).toISOString().slice(0, 13);
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  function generateByDayStats(errors: ParseError[]): Record<string, number> {
    return errors.reduce((acc, err) => {
      const day = new Date(err.context.timestamp).toISOString().slice(0, 10);
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
  
  async function sendToExternalMonitoring(logEntry: any): Promise<void> {
    // Implement integrations with external monitoring services
    // Examples:
    
    // Sentry
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(new Error(logEntry.message), {
    //     tags: logEntry.tags,
    //     extra: logEntry.context,
    //     level: logEntry.severity as any
    //   });
    // }
    
    // DataDog
    // if (process.env.DD_API_KEY) {
    //   DD_LOGS.logger.error(logEntry.message, logEntry);
    // }
    
    // LogRocket
    // if (process.env.LOGROCKET_APP_ID) {
    //   LogRocket.captureException(new Error(logEntry.message));
    // }
    
    // Custom webhook
    if (process.env.MONITORING_WEBHOOK_URL) {
      try {
        await fetch(process.env.MONITORING_WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': process.env.MONITORING_WEBHOOK_AUTH || ''
          },
          body: JSON.stringify({
            service: 'aplycat',
            timestamp: new Date().toISOString(),
            log: logEntry
          })
        });
      } catch (error) {
        console.error('[ERROR_MONITOR] Failed to send to external monitoring:', error);
      }
    }
  }
  
  function checkAndTriggerAlerts(error: ParseError): void {
    // Import and use alerting system if available
    // This prevents circular dependencies
    try {
      const { checkAlertConditions } = require('./alerting');
      const stats = getErrorStatistics();
      const health = createHealthCheckResponse();
      checkAlertConditions(stats, health);
    } catch (err) {
      // Alerting system not available or error in alerting
      console.warn('[ERROR_MONITOR] Could not trigger alerts:', err instanceof Error ? err.message : String(err));
    }
  }
  
  /**
   * Get system resource usage
   */
  export function getSystemResources(): {
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    uptime: number;
    loadAverage?: number[];
    freeMemory?: number;
    totalMemory?: number;
  } {
    return {
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      uptime: process.uptime(),
      loadAverage: typeof (process as any).loadavg === 'function' ? (process as any).loadavg() : undefined,
      freeMemory: typeof (process as any).freemem === 'function' ? (process as any).freemem() : undefined,
      totalMemory: typeof (process as any).totalmem === 'function' ? (process as any).totalmem() : undefined
    };
  }
  
  /**
   * Monitor memory leaks and performance degradation
   */
  export function startPerformanceMonitoring(): void {
    // Check memory usage every 5 minutes
    setInterval(() => {
      const memory = process.memoryUsage();
      const heapUsedMB = memory.heapUsed / 1024 / 1024;
      const heapTotalMB = memory.heapTotal / 1024 / 1024;
      const usagePercent = (memory.heapUsed / memory.heapTotal) * 100;
      
      // Log memory usage
      console.log(`[MEMORY_MONITOR] Heap: ${heapUsedMB.toFixed(1)}MB / ${heapTotalMB.toFixed(1)}MB (${usagePercent.toFixed(1)}%)`);
      
      // Alert on high memory usage
      if (usagePercent > 85) {
        logError({
          type: 'UNKNOWN_ERROR',
          message: `High memory usage detected: ${usagePercent.toFixed(1)}%`,
          context: {
            timestamp: new Date().toISOString(),
            requestId: generateRequestId(),
            memoryUsage: memory
          },
          severity: usagePercent > 95 ? 'critical' : 'high'
        });
      }
      
      // Force garbage collection if available and memory is high
      if (global.gc && usagePercent > 80) {
        console.log('[MEMORY_MONITOR] Forcing garbage collection due to high memory usage');
        global.gc();
      }
    }, 300000); // 5 minutes
    
    // Monitor error rate every minute
    setInterval(() => {
      const stats = getErrorStatistics();
      const errorRate = stats.summary.errorsLastHour;
      
      if (errorRate > 20) { // More than 20 errors per hour
        console.warn(`[ERROR_RATE_MONITOR] High error rate: ${errorRate} errors in the last hour`);
      }
    }, 60000); // 1 minute
  }
  
  /**
   * Get recent errors with optional filtering
   */
  export function getRecentErrors(options: {
    limit?: number;
    severity?: string;
    type?: string;
    since?: Date;
  } = {}): ParseError[] {
    let errors = errorStore.getErrors(options.limit || 100);
    
    if (options.severity) {
      errors = errors.filter(err => err.severity === options.severity);
    }
    
    if (options.type) {
      errors = errors.filter(err => err.type === options.type);
    }
    
    if (options.since) {
      errors = errors.filter(err => new Date(err.context.timestamp) >= options.since!);
    }
    
    return errors;
  }
  
  /**
   * Get performance metrics with optional filtering
   */
  export function getRecentMetrics(options: {
    limit?: number;
    strategy?: string;
    since?: Date;
  } = {}): PerformanceMetrics[] {
    let metrics = errorStore.getMetrics(options.limit || 100);
    
    if (options.strategy) {
      metrics = metrics.filter(metric => metric.parseStrategy === options.strategy);
    }
    
    if (options.since) {
      metrics = metrics.filter(metric => new Date(metric.timestamp) >= options.since!);
    }
    
    return metrics;
  }
  
  /**
   * Export metrics in Prometheus format
   */
  export function exportPrometheusMetrics(): string {
    const stats = getErrorStatistics();
    const health = createHealthCheckResponse();
    const strategyStats = errorStore.getStrategyStats();
    
    const metrics = [
      '# HELP aplycat_requests_total Total number of resume analysis requests',
      '# TYPE aplycat_requests_total counter',
      `aplycat_requests_total{service="resume-analysis"} ${health.metrics?.totalRequests || 0}`,
      '',
      '# HELP aplycat_requests_successful_total Total number of successful requests', 
      '# TYPE aplycat_requests_successful_total counter',
      `aplycat_requests_successful_total{service="resume-analysis"} ${health.metrics?.successfulRequests || 0}`,
      '',
      '# HELP aplycat_requests_failed_total Total number of failed requests',
      '# TYPE aplycat_requests_failed_total counter', 
      `aplycat_requests_failed_total{service="resume-analysis"} ${health.metrics?.failedRequests || 0}`,
      '',
      '# HELP aplycat_errors_total Total number of errors by type',
      '# TYPE aplycat_errors_total counter',
      ...Object.entries(stats.byType).map(([type, count]) => 
        `aplycat_errors_total{type="${type}",service="resume-analysis"} ${count}`
      ),
      '',
      '# HELP aplycat_errors_by_severity Number of errors by severity',
      '# TYPE aplycat_errors_by_severity counter',
      ...Object.entries(stats.bySeverity).map(([severity, count]) => 
        `aplycat_errors_by_severity{severity="${severity}",service="resume-analysis"} ${count}`
      ),
      '',
      '# HELP aplycat_response_time_seconds Response time percentiles in seconds',
      '# TYPE aplycat_response_time_seconds histogram',
      `aplycat_response_time_seconds{quantile="0.5",service="resume-analysis"} ${(stats.performance.averageResponseTime / 1000).toFixed(3)}`,
      `aplycat_response_time_seconds{quantile="0.95",service="resume-analysis"} ${(stats.performance.p95ResponseTime / 1000).toFixed(3)}`,
      `aplycat_response_time_seconds{quantile="0.99",service="resume-analysis"} ${(stats.performance.p99ResponseTime / 1000).toFixed(3)}`,
      '',
      '# HELP aplycat_memory_usage_bytes Memory usage in bytes',
      '# TYPE aplycat_memory_usage_bytes gauge',
      `aplycat_memory_usage_bytes{type="heap_used",service="resume-analysis"} ${health.checks.memory.heapUsed}`,
      `aplycat_memory_usage_bytes{type="heap_total",service="resume-analysis"} ${health.checks.memory.heapTotal}`,
      `aplycat_memory_usage_bytes{type="external",service="resume-analysis"} ${health.checks.memory.external}`,
      `aplycat_memory_usage_bytes{type="rss",service="resume-analysis"} ${health.checks.memory.rss}`,
      '',
      '# HELP aplycat_uptime_seconds Service uptime in seconds',
      '# TYPE aplycat_uptime_seconds gauge',
      `aplycat_uptime_seconds{service="resume-analysis"} ${health.uptime}`,
      '',
      '# HELP aplycat_health_status Service health status (1=healthy, 0.5=degraded, 0=unhealthy)',
      '# TYPE aplycat_health_status gauge',
      `aplycat_health_status{service="resume-analysis"} ${health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0}`,
      '',
      '# HELP aplycat_parse_strategy_usage Parse strategy usage count',
      '# TYPE aplycat_parse_strategy_usage counter',
      ...Array.from(strategyStats.entries()).map(([strategy, stats]) =>
        `aplycat_parse_strategy_usage{strategy="${strategy}",service="resume-analysis"} ${stats.count}`
      ),
      '',
      '# HELP aplycat_parse_strategy_duration_seconds Average parse strategy duration',
      '# TYPE aplycat_parse_strategy_duration_seconds gauge',
      ...Array.from(strategyStats.entries()).map(([strategy, stats]) =>
        `aplycat_parse_strategy_duration_seconds{strategy="${strategy}",service="resume-analysis"} ${(stats.averageTime / 1000).toFixed(3)}`
      ),
      '',
      '# HELP aplycat_uptime_percentage Service uptime percentage',
      '# TYPE aplycat_uptime_percentage gauge',
      `aplycat_uptime_percentage{service="resume-analysis"} ${(stats.summary.uptimePercentage / 100).toFixed(4)}`,
      ''
    ];
    
    return metrics.join('\n');
  }
  
  /**
   * Create a detailed system report
   */
  export function generateSystemReport(): {
    timestamp: string;
    summary: {
      status: string;
      uptime: string;
      totalRequests: number;
      successRate: number;
      averageResponseTime: string;
    };
    errors: {
      total: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
      recent: ParseError[];
    };
    performance: {
      responseTimePercentiles: any;
      memoryUsage: NodeJS.MemoryUsage;
      cpuUsage: NodeJS.CpuUsage;
      strategyStats: any;
    };
    health: SystemHealth;
    recommendations: string[];
  } {
    const stats = getErrorStatistics();
    const health = createHealthCheckResponse();
    const responseTimeStats = errorStore.getResponseTimePercentiles();
    const strategyStats = Object.fromEntries(errorStore.getStrategyStats());
    
    // Generate recommendations based on current state
    const recommendations: string[] = [];
    
    if (stats.performance.successRate < 95) {
      recommendations.push('Success rate is below 95%. Consider investigating recent errors and improving error handling.');
    }
    
    if (stats.performance.p95ResponseTime > 45000) {
      recommendations.push('95th percentile response time is over 45 seconds. Consider optimizing slow operations.');
    }
    
    const memoryUsagePercent = (health.checks.memory.heapUsed / health.checks.memory.heapTotal) * 100;
    if (memoryUsagePercent > 80) {
      recommendations.push('Memory usage is above 80%. Monitor for potential memory leaks.');
    }
    
    if (stats.summary.errorsLastHour > 10) {
      recommendations.push('High error rate detected. Review recent errors and consider implementing additional safeguards.');
    }
    
    const mostUsedStrategy = Object.entries(strategyStats).reduce((a, b) => 
      strategyStats[a[0]]?.count > strategyStats[b[0]]?.count ? a : b
    );
    
    if (mostUsedStrategy[0] !== 'direct') {
      recommendations.push(`Most requests are using ${mostUsedStrategy[0]} strategy instead of direct parsing. Consider improving OpenAI response quality.`);
    }
    
    return {
      timestamp: new Date().toISOString(),
      summary: {
        status: health.status,
        uptime: formatUptime(health.uptime),
        totalRequests: health.metrics?.totalRequests || 0,
        successRate: stats.performance.successRate,
        averageResponseTime: `${(stats.performance.averageResponseTime / 1000).toFixed(1)}s`
      },
      errors: {
        total: stats.summary.totalErrors,
        byType: stats.byType,
        bySeverity: stats.bySeverity,
        recent: getRecentErrors({ limit: 5 })
      },
      performance: {
        responseTimePercentiles: {
          p50: `${(responseTimeStats.p50 / 1000).toFixed(1)}s`,
          p95: `${(responseTimeStats.p95 / 1000).toFixed(1)}s`,
          p99: `${(responseTimeStats.p99 / 1000).toFixed(1)}s`,
          average: `${(responseTimeStats.average / 1000).toFixed(1)}s`
        },
        memoryUsage: health.checks.memory,
        cpuUsage: health.checks.cpu || process.cpuUsage(),
        strategyStats
      },
      health,
      recommendations
    };
  }
  
  /**
   * Format uptime in human-readable format
   */
  function formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  }
  
  /**
   * Initialize monitoring system
   */
  export function initializeMonitoring(): void {
    console.log('[ERROR_MONITOR] Initializing monitoring system...');
    
    // Start performance monitoring
    startPerformanceMonitoring();
    
    // Log startup
    console.log('[ERROR_MONITOR] Monitoring system initialized successfully');
    console.log(`[ERROR_MONITOR] Service: aplycat-resume-analysis`);
    console.log(`[ERROR_MONITOR] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[ERROR_MONITOR] Node Version: ${process.version}`);
    console.log(`[ERROR_MONITOR] PID: ${process.pid}`);
    
    // Set up graceful shutdown
    process.on('SIGTERM', () => {
      console.log('[ERROR_MONITOR] SIGTERM received, generating final report...');
      const report = generateSystemReport();
      console.log('[ERROR_MONITOR] Final system report:', JSON.stringify(report, null, 2));
    });
    
    process.on('SIGINT', () => {
      console.log('[ERROR_MONITOR] SIGINT received, generating final report...');
      const report = generateSystemReport();
      console.log('[ERROR_MONITOR] Final system report:', JSON.stringify(report, null, 2));
      process.exit(0);
    });
  }