// lib/services/payment-service.ts
import { db } from '@/lib/db';
import { stripeClient } from '@/lib/stripe/client';
import { STRIPE_CONFIG, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe/config';
import type { 
  CreditPackageType, 
  StripeWebhookPayload 
} from '@/lib/stripe/config';
import { CreditTransactionType } from '@prisma/client';
import type Stripe from 'stripe';

export interface CreateCheckoutParams {
  userId: string;
  packageType: CreditPackageType;
  userEmail: string;
  returnUrl?: string;
}

export interface ProcessPaymentParams {
  sessionId: string;
  userId: string;
  packageType: CreditPackageType;
  amount: number;
  credits: number;
}

class PaymentService {
  /**
   * Create a checkout session for credit purchase
   */
  async createCheckout(params: CreateCheckoutParams) {
    const { userId, packageType, userEmail, returnUrl } = params;

    try {
      console.log('[PAYMENT_SERVICE] Creating checkout:', params);

      // Get user to verify they exist
      const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Get package details
      const packageDetails = stripeClient.getCreditPackage(packageType);

      // Create checkout with Stripe
      const checkout = await stripeClient.createCheckout(
        packageType,
        userEmail,
        {
          userId,
          packageType,
          credits: packageDetails.credits,
          userName: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.firstName || user.email,
        },
        returnUrl
      );

      // Log the checkout creation
      await db.usageEvent.create({
        data: {
          userId: user.id, // Use the internal database user ID
          eventType: 'CREDIT_PURCHASE',
          description: `Initiated checkout for ${packageDetails.name}`,
          metadata: {
            checkoutId: checkout.id,
            packageType,
            credits: packageDetails.credits,
            amount: packageDetails.price,
          },
        },
      });

      console.log('[PAYMENT_SERVICE] Checkout created successfully:', {
        checkoutId: checkout.id,
        url: checkout.url,
        packageType,
      });

      return {
        checkoutId: checkout.id,
        checkoutUrl: checkout.url,
        packageDetails,
      };
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Checkout creation failed:', error);
      
      // Log error (only if user was found)
      try {
        const user = await db.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        
        if (user) {
          await db.usageEvent.create({
            data: {
              userId: user.id, // Use the internal database user ID
              eventType: 'CREDIT_PURCHASE',
              description: `Checkout creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error',
                packageType,
              },
            },
          });
        }
      } catch (logError) {
        console.error('Failed to log error event:', logError);
      }

      throw error;
    }
  }

  /**
   * Process successful payment and add credits
   */
  async processPayment(params: ProcessPaymentParams) {
    const { sessionId, userId, packageType, amount, credits } = params;

    try {
      console.log('[PAYMENT_SERVICE] Processing payment:', params);

      // Use transaction to ensure atomicity
      const result = await db.$transaction(async (tx) => {
        // Get current user
        const user = await tx.user.findUnique({
          where: { clerkId: userId },
          select: { id: true, credits: true, email: true },
        });

        if (!user) {
          throw new Error('User not found during payment processing');
        }

        // Add credits to user account
        const updatedUser = await tx.user.update({
          where: { id: user.id }, // Use internal database user ID
          data: { 
            credits: { increment: credits },
          },
        });

        // Create credit transaction record
        const transaction = await tx.creditTransaction.create({
          data: {
            userId: user.id, // Use internal database user ID
            type: CreditTransactionType.PURCHASE,
            amount: credits,
            description: packageType === 'trial' 
              ? `Purchased ${STRIPE_CONFIG.trialConfig.name} - ${credits} credits`
              : `Purchased ${STRIPE_CONFIG.creditPackages[packageType].name} - ${credits} credits`,
          },
        });

        // Log successful purchase event
        await tx.usageEvent.create({
          data: {
            userId: user.id, // Use internal database user ID
            eventType: 'CREDIT_PURCHASE',
            description: `Successfully purchased ${credits} credits`,
            metadata: {
              sessionId,
              packageType,
              credits,
              amount,
              previousCredits: user.credits,
              newCredits: updatedUser.credits,
              transactionId: transaction.id,
            },
          },
        });

        return {
          user: updatedUser,
          transaction,
          creditsAdded: credits,
          totalCredits: updatedUser.credits,
        };
      });

      console.log('[PAYMENT_SERVICE] Payment processed successfully:', {
        userId,
        creditsAdded: credits,
        totalCredits: result.totalCredits,
        sessionId,
      });

      return result;
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Payment processing failed:', error);
      
      // Log error (only if user can be found)
      try {
        const user = await db.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        
        if (user) {
          await db.usageEvent.create({
            data: {
              userId: user.id, // Use internal database user ID
              eventType: 'CREDIT_PURCHASE',
              description: `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId,
                packageType,
              },
            },
          });
        }
      } catch (logError) {
        console.error('Failed to log error event:', logError);
      }

      throw error;
    }
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhook(event: Stripe.Event) {
    try {
      console.log('[PAYMENT_SERVICE] Processing webhook:', event.type);

      switch (event.type) {
        case STRIPE_WEBHOOK_EVENTS.CHECKOUT_SESSION_COMPLETED:
          await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
          break;
        case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_SUCCEEDED:
          console.log('[PAYMENT_SERVICE] Payment intent succeeded:', event.data.object);
          break;
        case STRIPE_WEBHOOK_EVENTS.PAYMENT_INTENT_PAYMENT_FAILED:
          console.log('[PAYMENT_SERVICE] Payment intent failed:', event.data.object);
          break;
        default:
          console.log('[PAYMENT_SERVICE] Unhandled webhook event:', event.type);
      }

      return { received: true };
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle successful checkout completion
   */
  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      console.log('[PAYMENT_SERVICE] Processing checkout completion:', session.id);

      // Get metadata from session
      const metadata = session.metadata;
      if (!metadata) {
        throw new Error('No metadata found in checkout session');
      }

      const { userId, packageType, credits, userName } = metadata;
      
      if (!userId || !packageType || !credits) {
        throw new Error('Missing required metadata in checkout session');
      }

      // Convert credits back to number
      const creditsNumber = parseInt(credits);
      const amount = session.amount_total ? session.amount_total / 100 : 0; // Convert from cents

      // Process the payment
      await this.processPayment({
        sessionId: session.id,
        userId,
        packageType: packageType as CreditPackageType,
        amount,
        credits: creditsNumber,
      });

      console.log('[PAYMENT_SERVICE] Checkout completed successfully:', {
        sessionId: session.id,
        userId,
        packageType,
        credits: creditsNumber,
      });

    } catch (error) {
      console.error('[PAYMENT_SERVICE] Checkout completion failed:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string) {
    try {
      const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { id: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const transactions = await db.creditTransaction.findMany({
        where: { 
          userId: user.id,
          type: CreditTransactionType.PURCHASE,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return transactions.map(transaction => ({
        id: transaction.id,
        amount: transaction.amount,
        description: transaction.description,
        createdAt: transaction.createdAt,
        type: transaction.type,
      }));
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Failed to get payment history:', error);
      throw error;
    }
  }

  /**
   * Get available credit packages
   */
  getCreditPackages() {
    return stripeClient.getAllCreditPackages();
  }

  /**
   * Validate webhook signature
   */
  validateWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return stripeClient.verifyWebhookSignature(payload, signature);
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Webhook signature validation failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();