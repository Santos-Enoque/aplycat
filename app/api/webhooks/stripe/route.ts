import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { paymentService } from '@/lib/services/payment-service';
import Stripe from 'stripe';

export async function POST(request: NextRequest) {
  try {
    // Get the request body as text
    const body = await request.text();
    
    // Get the Stripe signature from headers
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[STRIPE_WEBHOOK] No Stripe signature found');
      return NextResponse.json(
        { error: 'No Stripe signature found' },
        { status: 400 }
      );
    }

    // Verify and parse the webhook
    const event = paymentService.validateWebhookSignature(body, signature, 'stripe') as Stripe.Event;

    console.log('[STRIPE_WEBHOOK] Received event:', {
      type: event.type,
      id: event.id,
      livemode: event.livemode,
    });

    // Process the webhook
    const result = await paymentService.handleWebhook(event);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[STRIPE_WEBHOOK] Webhook processing failed:', error);
    
    if (error instanceof Error && error.message.includes('Invalid webhook signature')) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
} 