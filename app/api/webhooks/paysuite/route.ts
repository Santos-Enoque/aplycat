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
    
    // Log key information for monitoring
    console.log('[PAYSUITE_WEBHOOK] Webhook received from:', headersList.get('user-agent') || 'Unknown');
    
    // Try different possible signature header names
    const signature = headersList.get('x-webhook-signature') || 
                     headersList.get('x-signature') || 
                     headersList.get('signature') ||
                     headersList.get('x-paysuite-signature') ||
                     headersList.get('authorization');

    console.log('[PAYSUITE_WEBHOOK] Found signature header:', !!signature);
    console.log('[PAYSUITE_WEBHOOK] Request body length:', body.length);

    if (!signature) {
      console.warn('[PAYSUITE_WEBHOOK] No PaySuite signature found in headers');
      console.warn('[PAYSUITE_WEBHOOK] Available headers:', Array.from(headersList.keys()));
    }

    // Parse the webhook payload (PaySuite format)
    let event;
    try {
      event = JSON.parse(body);
      console.log('[PAYSUITE_WEBHOOK] Parsed webhook payload:', event);
    } catch (parseError) {
      console.error('[PAYSUITE_WEBHOOK] Failed to parse webhook body:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validate signature if we have one
    if (signature) {
      try {
        paymentService.validatePaySuiteWebhook(body, signature);
        console.log('[PAYSUITE_WEBHOOK] Signature validation passed');
      } catch (sigError) {
        console.error('[PAYSUITE_WEBHOOK] Signature validation failed:', sigError);
        return NextResponse.json(
          { error: 'Invalid webhook signature' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[PAYSUITE_WEBHOOK] No signature provided - webhook security disabled');
    }

    console.log('[PAYSUITE_WEBHOOK] Received event:', {
      type: event.event,
      paymentId: event.data?.id,
      transactionId: event.data?.transaction?.id,
    });

    // Generate idempotency key from payment ID and transaction ID
    const idempotencyKey = `${event.data?.id}_${event.data?.transaction?.id || Date.now()}`;
    
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
        eventType: event.event || 'unknown',
        processed: false,
        receivedAt: new Date(),
        data: event,
      }
    });

    // Convert to the format expected by the payment service
    const paymentServiceEvent = {
      event: event.event,
      data: {
        id: event.data?.id,
        amount: parseFloat(event.data?.amount || '0'),
        reference: event.data?.reference,
        transaction: event.data?.transaction ? {
          id: event.data.transaction.id?.toString(),
          method: event.data.transaction.method,
          paid_at: event.data.transaction.paid_at,
        } : undefined,
      },
      created_at: Date.now(),
      request_id: idempotencyKey,
    };

    console.log('[PAYSUITE_WEBHOOK] Converted event for processing:', paymentServiceEvent);

    // Process the webhook
    const result = await paymentService.handlePaySuiteWebhook(paymentServiceEvent);

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