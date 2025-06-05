
// app/api/monitoring/stats/route.ts
import { NextResponse } from 'next/server';
import { getErrorStatistics } from '@/lib/error-monitoring';

export async function GET() {
  try {
    const stats = getErrorStatistics();
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      statistics: stats
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to retrieve statistics' },
      { status: 500 }
    );
  }
}
