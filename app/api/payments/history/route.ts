// app/api/payments/history/route.ts
import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { paymentService } from '@/lib/services/payment-service';

export async function GET() {
  try {
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const transactions = await paymentService.getPaymentHistory(user.id);
    
    return NextResponse.json({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('[PAYMENT_HISTORY] Error:', error);
    
    return NextResponse.json(
      { error: 'Failed to get payment history' },
      { status: 500 }
    );
  }
}
