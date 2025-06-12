// app/api/webhooks/paysuite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/lib/services/payment-service';

export async function POST(request: NextRequest) {
  const signature = request.headers.get('x-paysuite-signature');

  if (!signature) {
    return NextResponse.json(
      { success: false, error: 'Missing PaySuite signature' },
      { status: 400 }
    );
  }

  const body = await request.text();

  try {
    // Validate and parse the event using the payment service
    const event = paymentService.validatePaySuiteWebhook(body, signature);

    // Let the payment service handle the event logic
    await paymentService.handlePaySuiteWebhook(event);

    return NextResponse.json({ success: true, received: true });
  } catch (error) {
    console.error('Error processing PaySuite webhook:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown webhook error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 400 }
    );
  }
}