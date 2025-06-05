import { NextResponse } from 'next/server';
import { resetErrorStatistics } from '@/lib/error-monitoring';

export async function POST(request: Request) {
  try {
    // Basic auth check for admin operations
    const authHeader = request.headers.get('authorization');
    const expectedAuth = process.env.ADMIN_AUTH_TOKEN;
    
    if (!expectedAuth || authHeader !== `Bearer ${expectedAuth}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    resetErrorStatistics();
    
    return NextResponse.json({
      success: true,
      message: 'Error statistics reset successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to reset statistics' },
      { status: 500 }
    );
  }
}