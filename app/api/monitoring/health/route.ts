// app/api/monitoring/health/route.ts
import { NextResponse } from 'next/server';
import { createHealthCheckResponse } from '@/lib/error-monitoring';

export async function GET() {
  try {
    const health = createHealthCheckResponse();
    
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    return NextResponse.json(health, { status: statusCode });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Health check failed',
        service: 'aplycat-resume-analysis'
      },
      { status: 500 }
    );
  }
}

// Simple ping endpoint for uptime monitoring
export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}