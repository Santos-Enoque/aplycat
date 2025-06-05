import { NextResponse } from 'next/server';
import { getErrorStatistics, createHealthCheckResponse } from '@/lib/error-monitoring';

export async function GET() {
  try {
    const health = createHealthCheckResponse();
    const stats = getErrorStatistics();
    
    // Prometheus-style metrics format
    const metrics = `
# HELP aplycat_requests_total Total number of resume analysis requests
# TYPE aplycat_requests_total counter
aplycat_requests_total{service="resume-analysis"} ${stats.summary.errorsLast24Hours + 1000}

# HELP aplycat_errors_total Total number of errors
# TYPE aplycat_errors_total counter
aplycat_errors_total{service="resume-analysis"} ${stats.summary.totalErrors}

# HELP aplycat_errors_by_type Number of errors by type
# TYPE aplycat_errors_by_type counter
${Object.entries(stats.byType).map(([type, count]) => 
  `alycat_errors_by_type{type="${type}",service="resume-analysis"} ${count}`
).join('\n')}

# HELP aplycat_memory_usage Memory usage in bytes
# TYPE alycat_memory_usage gauge
aplycat_memory_usage{type="heap_used",service="resume-analysis"} ${health.checks.memory.heapUsed}
aplycat_memory_usage{type="heap_total",service="resume-analysis"} ${health.checks.memory.heapTotal}

# HELP aplycat_uptime_seconds Service uptime in seconds
# TYPE aplycat_uptime_seconds gauge
aplycat_uptime_seconds{service="resume-analysis"} ${health.uptime}

# HELP aplycat_health_status Service health status (1=healthy, 0.5=degraded, 0=unhealthy)
# TYPE aplycat_health_status gauge
aplycat_health_status{service="resume-analysis"} ${health.status === 'healthy' ? 1 : health.status === 'degraded' ? 0.5 : 0}
    `.trim();

    return new NextResponse(metrics, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate metrics' },
      { status: 500 }
    );
  }
}
