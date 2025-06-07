// app/api/payments/packages/route.ts
import { NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment-service';

export async function GET() {
  try {
    const packages = paymentService.getCreditPackages();
    
    return NextResponse.json({
      success: true,
      packages,
    });
  } catch (error) {
    console.error('[GET_PACKAGES] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get credit packages' },
      { status: 500 }
    );
  }
}