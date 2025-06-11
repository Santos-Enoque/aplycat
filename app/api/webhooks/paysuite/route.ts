// app/api/webhooks/paysuite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { paymentService } from '@/lib/services/payment-service';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    // Get the request body as text
    const body = await request.text();
    
    // Get the PaySuite signature from headers
    const headersList = await headers();
    const signature = headersList.get('x-webhook-signature');

    if (!signature) {
      console.error('[PAYSUITE_WEBHOOK] No PaySuite signature found');
      return NextResponse.json(
        { error: 'No PaySuite signature found' },
        { status: 400 }
      );
    }

    // Verify and parse the webhook
    const event = paymentService.validatePaySuiteWebhook(body, signature);

    console.log('[PAYSUITE_WEBHOOK] Received event:', {
      type: event.event,
      paymentId: event.data.id,
      requestId: event.request_id,
    });

    // Check if we've already processed this webhook (idempotency)
    const idempotencyKey = event.request_id;
    
    const existingWebhook = await db.webhookEvent.findFirst({
      where: { 
        provider: 'paysuite',
        eventId: idempotencyKey,
      }
    });

    if (existingWebhook) {
      console.log(`[PAYSUITE_WEBHOOK] Event already processed: ${idempotencyKey}`);
      return NextResponse.json({ received: true, status: 'already_processed' });
    }

    // Store webhook event for idempotency
    await db.webhookEvent.create({
      data: {
        provider: 'paysuite',
        eventId: idempotencyKey,
        eventType: event.event,
        processed: false,
        receivedAt: new Date(),
        data: JSON.parse(JSON.stringify(event)),
      }
    });

    // Process the webhook
    const result = await paymentService.handlePaySuiteWebhook(event);

    // Mark webhook as processed
    await db.webhookEvent.update({
      where: { 
        provider_eventId: {
          provider: 'paysuite',
          eventId: idempotencyKey,
        }
      },
      data: {
        processed: true,
        processedAt: new Date(),
      }
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[PAYSUITE_WEBHOOK] Webhook processing failed:', error);
    
    if (error instanceof Error && error.message.includes('Invalid PaySuite webhook signature')) {
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