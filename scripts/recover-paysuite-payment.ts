#!/usr/bin/env tsx

/**
 * PaySuite Payment Recovery Script
 * 
 * This script manually processes a successful PaySuite payment that didn't trigger
 * a webhook notification. Use this when a payment was successful but credits weren't added.
 */

import { db } from '../lib/db';
import { paymentService } from '../lib/services/payment-service';
import { CreditTransactionType } from '@prisma/client';

interface RecoveryParams {
  paymentId: string;          // PaySuite payment ID
  userId?: string;            // Clerk User ID (optional, will lookup from payment)
  transactionId?: string;     // PaySuite transaction ID (if available)
  skipIfCompleted?: boolean;  // Skip if already processed (default: true)
}

async function recoverPaySuitePayment(params: RecoveryParams) {
  const { paymentId, userId, transactionId, skipIfCompleted = true } = params;

  try {
    console.log(`🔍 Looking up PaySuite payment: ${paymentId}`);

    // Find the payment record
    const payment = await db.paysuitePayment.findUnique({
      where: { id: paymentId },
      include: { user: true }
    });

    if (!payment) {
      throw new Error(`PaySuite payment not found: ${paymentId}`);
    }

    console.log(`📋 Payment found:`, {
      id: payment.id,
      clerkUserId: payment.clerkUserId,
      packageType: payment.packageType,
      credits: payment.credits,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      reference: payment.reference,
      createdAt: payment.createdAt,
    });

    // Check if already processed
    if (payment.status === 'completed') {
      if (skipIfCompleted) {
        console.log(`✅ Payment already processed: ${paymentId}`);
        return { success: true, message: 'Payment already processed', skipped: true };
      } else {
        console.log(`⚠️ Payment already processed but proceeding anyway: ${paymentId}`);
      }
    }

    // Validate user ID if provided
    if (userId && userId !== payment.clerkUserId) {
      throw new Error(`User ID mismatch. Expected: ${payment.clerkUserId}, Provided: ${userId}`);
    }

    console.log(`💳 Processing payment for user: ${payment.user.email} (${payment.clerkUserId})`);
    console.log(`📦 Package: ${payment.packageType} (${payment.credits} credits for ${payment.amount} ${payment.currency})`);

    // Create a mock PaySuite webhook event for processing
    const mockEvent = {
      event: 'payment.success' as const,
      data: {
        id: payment.id,
        amount: payment.amount,
        reference: payment.reference,
        transaction: transactionId ? {
          id: transactionId,
          method: payment.paymentMethod,
          paid_at: new Date().toISOString(),
        } : undefined,
      },
      created_at: Date.now(),
      request_id: `recovery_${Date.now()}`,
    };

    // Process the payment using the existing webhook handler
    console.log(`🔄 Processing payment...`);
    const result = await paymentService.handlePaySuiteWebhook(mockEvent);

    console.log(`✅ Payment recovery completed:`, result);

    // Get updated user credits
    const updatedUser = await db.user.findUnique({
      where: { clerkId: payment.clerkUserId },
      select: { credits: true }
    });

    console.log(`💰 User credits after recovery: ${updatedUser?.credits || 'N/A'}`);

    return {
      success: true,
      message: 'Payment recovered successfully',
      paymentId: payment.id,
      userId: payment.clerkUserId,
      creditsAdded: payment.credits,
      newBalance: updatedUser?.credits,
    };

  } catch (error) {
    console.error(`❌ Payment recovery failed:`, error);
    throw error;
  }
}

/**
 * List all pending PaySuite payments
 */
async function listPendingPayments() {
  console.log(`🔍 Searching for pending PaySuite payments...`);

  const pendingPayments = await db.paysuitePayment.findMany({
    where: { status: 'pending' },
    include: { user: true },
    orderBy: { createdAt: 'desc' },
  });

  if (pendingPayments.length === 0) {
    console.log(`✅ No pending PaySuite payments found.`);
    return [];
  }

  console.log(`📋 Found ${pendingPayments.length} pending payment(s):`);
  pendingPayments.forEach((payment, index) => {
    console.log(`\n${index + 1}. Payment ID: ${payment.id}`);
    console.log(`   User: ${payment.user.email} (${payment.clerkUserId})`);
    console.log(`   Package: ${payment.packageType}`);
    console.log(`   Credits: ${payment.credits}`);
    console.log(`   Amount: ${payment.amount} ${payment.currency}`);
    console.log(`   Reference: ${payment.reference}`);
    console.log(`   Created: ${payment.createdAt}`);
  });

  return pendingPayments;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'list':
        await listPendingPayments();
        break;

      case 'recover':
        const paymentId = args[1];
        const transactionId = args[2];

        if (!paymentId) {
          console.error('❌ Usage: npm run recover-payment recover <payment_id> [transaction_id]');
          process.exit(1);
        }

        await recoverPaySuitePayment({
          paymentId,
          transactionId,
        });
        break;

      default:
        console.log(`
🚀 PaySuite Payment Recovery Tool

Usage:
  npm run recover-payment list                    # List all pending payments
  npm run recover-payment recover <payment_id>    # Recover a specific payment
  npm run recover-payment recover <payment_id> <transaction_id>  # Recover with transaction ID

Examples:
  npm run recover-payment list
  npm run recover-payment recover pay_123456789
  npm run recover-payment recover pay_123456789 txn_987654321
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await db.$disconnect();
  }
}

if (require.main === module) {
  main();
}

export { recoverPaySuitePayment, listPendingPayments }; 