/**
 * UploadThing Performance Monitoring and Error Handling
 * 
 * Provides monitoring, analytics, and error handling for UploadThing operations
 */

import { db, analyticsHelpers } from './db';

export interface UploadMetrics {
  fileSize: number;
  uploadDuration: number;
  fileName: string;
  userId: string;
  success: boolean;
  errorMessage?: string;
  uploadMethod: 'uploadthing' | 'base64_fallback';
}

export interface UploadThingStats {
  totalUploads: number;
  successfulUploads: number;
  failedUploads: number;
  averageUploadTime: number;
  averageFileSize: number;
  totalDataTransferred: number;
  errorRate: number;
}

/**
 * Track upload performance metrics
 */
export async function trackUploadMetrics(metrics: UploadMetrics): Promise<void> {
  try {
    // Store detailed metrics in usage events
    await analyticsHelpers.trackEvent(
      metrics.success ? 'RESUME_UPLOAD' : 'RESUME_UPLOAD',
      metrics.userId,
      {
        uploadMethod: metrics.uploadMethod,
        fileSize: metrics.fileSize,
        uploadDuration: metrics.uploadDuration,
        fileName: metrics.fileName,
        success: metrics.success,
        errorMessage: metrics.errorMessage,
        timestamp: new Date().toISOString(),
      }
    );

    // Log performance data for monitoring
    if (metrics.success) {
      console.log(`[UPLOAD_METRICS] Success: ${metrics.fileName} (${formatFileSize(metrics.fileSize)}) in ${metrics.uploadDuration}ms`);
    } else {
      console.error(`[UPLOAD_METRICS] Failed: ${metrics.fileName} - ${metrics.errorMessage}`);
    }

    // Alert on slow uploads (> 30 seconds)
    if (metrics.uploadDuration > 30000) {
      console.warn(`[UPLOAD_METRICS] Slow upload detected: ${metrics.uploadDuration}ms for ${formatFileSize(metrics.fileSize)}`);
    }

    // Alert on large files (> 5MB)
    if (metrics.fileSize > 5 * 1024 * 1024) {
      console.warn(`[UPLOAD_METRICS] Large file uploaded: ${formatFileSize(metrics.fileSize)}`);
    }

  } catch (error) {
    console.error('[UPLOAD_METRICS] Failed to track metrics:', error);
    // Don't throw error - metrics tracking shouldn't break user flow
  }
}

/**
 * Get upload statistics for a specific time period
 */
export async function getUploadStats(days: number = 7): Promise<UploadThingStats> {
  try {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const uploadEvents = await db.usageEvent.findMany({
      where: {
        eventType: 'RESUME_UPLOAD',
        createdAt: { gte: since },
      },
      select: {
        metadata: true,
        createdAt: true,
      },
    });

    let totalUploads = 0;
    let successfulUploads = 0;
    let failedUploads = 0;
    let totalUploadTime = 0;
    let totalFileSize = 0;

    uploadEvents.forEach(event => {
      const metadata = event.metadata as any;
      if (!metadata) return;

      totalUploads++;
      
      if (metadata.success) {
        successfulUploads++;
      } else {
        failedUploads++;
      }

      if (metadata.uploadDuration) {
        totalUploadTime += metadata.uploadDuration;
      }

      if (metadata.fileSize) {
        totalFileSize += metadata.fileSize;
      }
    });

    const stats: UploadThingStats = {
      totalUploads,
      successfulUploads,
      failedUploads,
      averageUploadTime: totalUploads > 0 ? totalUploadTime / totalUploads : 0,
      averageFileSize: totalUploads > 0 ? totalFileSize / totalUploads : 0,
      totalDataTransferred: totalFileSize,
      errorRate: totalUploads > 0 ? (failedUploads / totalUploads) * 100 : 0,
    };

    return stats;
  } catch (error) {
    console.error('[UPLOAD_STATS] Error getting upload statistics:', error);
    return {
      totalUploads: 0,
      successfulUploads: 0,
      failedUploads: 0,
      averageUploadTime: 0,
      averageFileSize: 0,
      totalDataTransferred: 0,
      errorRate: 0,
    };
  }
}

/**
 * Enhanced error handling for UploadThing operations
 */
export class UploadThingError extends Error {
  constructor(
    message: string,
    public code: string,
    public originalError?: Error,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'UploadThingError';
  }

  static fromError(error: any): UploadThingError {
    // Handle different types of errors
    if (error.code === 'UNAUTHORIZED') {
      return new UploadThingError(
        'Authentication failed. Please log in and try again.',
        'AUTH_ERROR',
        error,
        false
      );
    }

    if (error.code === 'FILE_TOO_LARGE') {
      return new UploadThingError(
        'File is too large. Please use a file smaller than 8MB.',
        'FILE_SIZE_ERROR',
        error,
        false
      );
    }

    if (error.code === 'INVALID_FILE_TYPE') {
      return new UploadThingError(
        'Invalid file type. Please upload a PDF, DOC, or DOCX file.',
        'FILE_TYPE_ERROR',
        error,
        false
      );
    }

    if (error.code === 'NETWORK_ERROR' || error.message?.includes('network')) {
      return new UploadThingError(
        'Network error occurred. Please check your connection and try again.',
        'NETWORK_ERROR',
        error,
        true
      );
    }

    if (error.code === 'TIMEOUT' || error.message?.includes('timeout')) {
      return new UploadThingError(
        'Upload timed out. Please try again with a smaller file.',
        'TIMEOUT_ERROR',
        error,
        true
      );
    }

    // Generic server error
    return new UploadThingError(
      'Upload failed due to a server error. Please try again.',
      'SERVER_ERROR',
      error,
      true
    );
  }
}

/**
 * Retry logic for failed uploads
 */
export async function retryUpload<T>(
  uploadFunction: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[RETRY] Attempt ${attempt}/${maxRetries}`);
      return await uploadFunction();
    } catch (error) {
      lastError = error as Error;
      
      const uploadError = UploadThingError.fromError(error);
      
      // Don't retry non-retryable errors
      if (!uploadError.retryable) {
        throw uploadError;
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt - 1) + Math.random() * 1000;
      console.log(`[RETRY] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw UploadThingError.fromError(lastError!);
}

/**
 * Monitor upload performance and alert on issues
 */
export function monitorUploadPerformance(
  startTime: number,
  fileSize: number,
  fileName: string
): void {
  const duration = Date.now() - startTime;
  const sizeInMB = fileSize / (1024 * 1024);
  const speedMbps = (sizeInMB / (duration / 1000)) * 8; // Megabits per second

  console.log(`[PERFORMANCE] Upload speed: ${speedMbps.toFixed(2)} Mbps for ${fileName}`);

  // Alert on very slow uploads (< 1 Mbps)
  if (speedMbps < 1) {
    console.warn(`[PERFORMANCE] Slow upload speed detected: ${speedMbps.toFixed(2)} Mbps`);
  }

  // Alert on very fast uploads that might indicate caching
  if (speedMbps > 100) {
    console.info(`[PERFORMANCE] Very fast upload (likely cached): ${speedMbps.toFixed(2)} Mbps`);
  }
}

/**
 * Format file size for human-readable display
 */
function formatFileSize(bytes: number): string {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Generate upload performance report
 */
export async function generateUploadReport(days: number = 7): Promise<string> {
  const stats = await getUploadStats(days);
  
  const report = `
📊 UploadThing Performance Report (Last ${days} days)
================================================

📈 Overall Stats:
  • Total uploads: ${stats.totalUploads}
  • Successful: ${stats.successfulUploads} (${((stats.successfulUploads / stats.totalUploads) * 100).toFixed(1)}%)
  • Failed: ${stats.failedUploads} (${stats.errorRate.toFixed(1)}%)

⚡ Performance:
  • Average upload time: ${(stats.averageUploadTime / 1000).toFixed(1)}s
  • Average file size: ${formatFileSize(stats.averageFileSize)}
  • Total data transferred: ${formatFileSize(stats.totalDataTransferred)}

🎯 Health Indicators:
  • Error rate: ${stats.errorRate.toFixed(1)}% ${stats.errorRate > 5 ? '⚠️ HIGH' : '✅ Good'}
  • Upload speed: ${stats.averageFileSize > 0 ? ((stats.averageFileSize / (1024 * 1024)) / (stats.averageUploadTime / 1000) * 8).toFixed(1) : 'N/A'} Mbps

💡 Recommendations:
${stats.errorRate > 10 ? '  • High error rate detected - investigate UploadThing service health' : ''}
${stats.averageUploadTime > 15000 ? '  • Slow uploads detected - consider file size limits or CDN optimization' : ''}
${stats.totalUploads === 0 ? '  • No uploads recorded - verify tracking implementation' : ''}
  `;

  return report;
}

export { formatFileSize };