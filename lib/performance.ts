// Performance monitoring and optimization utilities

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();
  private timerTags: Map<string, string> = new Map();

  // Start timing an operation
  startTimer(name: string, tags?: Record<string, string>): void {
    this.timers.set(name, performance.now());
    if (tags) {
      this.timerTags.set(name, JSON.stringify(tags));
    }
  }

  // End timing and record metric
  endTimer(name: string): number {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`Timer ${name} not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    const tagsString = this.timerTags.get(name);
    const tags = tagsString ? JSON.parse(tagsString) : undefined;

    this.recordMetric(name, duration, tags);
    this.timers.delete(name);
    this.timerTags.delete(name);

    return duration;
  }

  // Record a metric directly
  recordMetric(name: string, value: number, tags?: Record<string, string>): void {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      tags,
    });

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development' && value > 1000) {
      console.warn(`🐌 Slow operation detected: ${name} took ${value.toFixed(2)}ms`);
    }
  }

  // Get metrics for a specific name
  getMetrics(name?: string): PerformanceMetric[] {
    if (name) {
      return this.metrics.filter(m => m.name === name);
    }
    return [...this.metrics];
  }

  // Get average performance for an operation
  getAverageTime(name: string): number {
    const metrics = this.getMetrics(name);
    if (metrics.length === 0) return 0;
    
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  // Clear all metrics
  clear(): void {
    this.metrics = [];
    this.timers.clear();
    this.timerTags.clear();
  }

  // Get performance summary
  getSummary(): Record<string, { count: number; avg: number; min: number; max: number }> {
    const summary: Record<string, { count: number; avg: number; min: number; max: number }> = {};
    
    const groupedMetrics = this.metrics.reduce((acc, metric) => {
      if (!acc[metric.name]) acc[metric.name] = [];
      acc[metric.name].push(metric.value);
      return acc;
    }, {} as Record<string, number[]>);

    Object.entries(groupedMetrics).forEach(([name, values]) => {
      summary[name] = {
        count: values.length,
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
      };
    });

    return summary;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Helper function to measure async operations
export async function measureAsync<T>(
  name: string, 
  operation: () => Promise<T>,
  tags?: Record<string, string>
): Promise<T> {
  performanceMonitor.startTimer(name, tags);
  try {
    const result = await operation();
    performanceMonitor.endTimer(name);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(name);
    throw error;
  }
}

// Helper function to measure sync operations
export function measure<T>(
  name: string, 
  operation: () => T,
  tags?: Record<string, string>
): T {
  performanceMonitor.startTimer(name, tags);
  try {
    const result = operation();
    performanceMonitor.endTimer(name);
    return result;
  } catch (error) {
    performanceMonitor.endTimer(name);
    throw error;
  }
}

// Database operation wrapper
export function withDbMetrics<T extends any[], R>(
  operation: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return measureAsync(`db.${operation}`, () => fn(...args), {
      operation,
      type: 'database'
    });
  };
}

// API route wrapper
export function withApiMetrics<T extends any[], R>(
  endpoint: string,
  fn: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R> => {
    return measureAsync(`api.${endpoint}`, () => fn(...args), {
      endpoint,
      type: 'api'
    });
  };
}

// Component render time measurement
export function usePerformanceTracker(componentName: string) {
  if (typeof window !== 'undefined') {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      performanceMonitor.recordMetric(`component.${componentName}`, endTime - startTime, {
        type: 'component',
        component: componentName
      });
    };
  }
  
  return () => {}; // No-op for SSR
}

// Web Vitals tracking
export function trackWebVitals() {
  if (typeof window !== 'undefined') {
    // Track Core Web Vitals
    import('web-vitals').then(({ onCLS, onINP, onFCP, onLCP, onTTFB }) => {
      onCLS((metric) => performanceMonitor.recordMetric('web-vitals.cls', metric.value, { type: 'web-vitals' }));
      onINP((metric) => performanceMonitor.recordMetric('web-vitals.inp', metric.value, { type: 'web-vitals' }));
      onFCP((metric) => performanceMonitor.recordMetric('web-vitals.fcp', metric.value, { type: 'web-vitals' }));
      onLCP((metric) => performanceMonitor.recordMetric('web-vitals.lcp', metric.value, { type: 'web-vitals' }));
      onTTFB((metric) => performanceMonitor.recordMetric('web-vitals.ttfb', metric.value, { type: 'web-vitals' }));
    }).catch(() => {
      // Fallback if web-vitals is not available
      console.warn('Web Vitals library not available');
    });
  }
}

// Performance budget checker
export function checkPerformanceBudget() {
  const summary = performanceMonitor.getSummary();
  const budgets = {
    'api.analyze-resume': 5000, // 5 seconds max for analysis
    'api.improve-resume': 8000, // 8 seconds max for improvement
    'db.user': 500, // 500ms max for user queries
    'component.dashboard': 100, // 100ms max for dashboard render
  };

  const violations: string[] = [];
  
  Object.entries(budgets).forEach(([operation, budget]) => {
    const metrics = summary[operation];
    if (metrics && metrics.avg > budget) {
      violations.push(`${operation}: ${metrics.avg.toFixed(2)}ms (budget: ${budget}ms)`);
    }
  });

  if (violations.length > 0) {
    console.warn('🚨 Performance budget violations:', violations);
  }

  return violations;
}

// Export for debugging in development
if (process.env.NODE_ENV === 'development') {
  (globalThis as any).performanceMonitor = performanceMonitor;
} 