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
import crypto from 'crypto';
import { mpesaService } from '@/lib/mpesa-service';

// Payment provider types
export type PaymentProvider = 'stripe' | 'paysuite' | 'mpesa';
export type PaymentMethod = 'credit_card' | 'mobile_money';

interface PaySuitePaymentRequest {
  amount: string;
  reference: string;
  description: string;
  return_url: string;
  callback_url: string;
  method: 'mobile_money'; // PaySuite API method type
}

interface PaySuitePaymentResponse {
  status: 'success' | 'error';
  data?: {
    id: string;
    amount: number;
    reference: string;
    status: 'pending' | 'paid' | 'failed';
    checkout_url: string;
  };
  message?: string;
}

interface PaySuiteWebhookEvent {
  event: 'payment.success' | 'payment.failed';
  data: {
    id: string;
    amount: number;
    reference: string;
    transaction?: {
      id: string;
      method: string;
      paid_at: string;
    };
    error?: string;
  };
  created_at: number;
  request_id: string;
}

export interface CreateCheckoutParams {
  userId: string;
  packageType: CreditPackageType;
  userEmail: string;
  paymentMethod?: PaymentMethod;
  returnUrl?: string;
  pricing?: {
    amount: number;
    currency: string;
    country: any;
  };
}

export interface ProcessPaymentParams {
  sessionId: string;
  userId: string;
  packageType: CreditPackageType;
  amount: number;
  credits: number;
  provider?: PaymentProvider;
  reference?: string;
  transactionId?: string;
}

class PaymentService {
  private paysuiteApiUrl: string;
  private paysuiteToken: string;
  private paysuiteWebhookSecret: string;

  constructor() {
    this.paysuiteApiUrl = process.env.PAYSUITE_API_URL || 'https://paysuite.tech/api/v1';
    this.paysuiteToken = process.env.PAYSUITE_API_TOKEN || '';
    this.paysuiteWebhookSecret = process.env.PAYSUITE_WEBHOOK_SECRET || '';
  }

  /**
   * Create a checkout session for credit purchase (enhanced with payment method support)
   */
  async createCheckout(params: CreateCheckoutParams) {
    const { userId, packageType, userEmail, paymentMethod = 'credit_card', returnUrl } = params;

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

      let checkoutResult;

          // Route to appropriate payment provider
      console.log('[PAYMENT_SERVICE] Routing payment method:', paymentMethod);
      
    if (paymentMethod === 'credit_card') {
      console.log('[PAYMENT_SERVICE] Creating Stripe checkout');
      checkoutResult = await this.createStripeCheckout(params, user, packageDetails);
    } else if (paymentMethod === 'mobile_money') {
      // Check if user prefers MPesa or PaySuite (default to MPesa for Mozambique)
      const preferMpesa = process.env.PREFER_MPESA === 'true' || process.env.NODE_ENV === 'production';
      
      if (preferMpesa && process.env.MPESA_API_KEY) {
        console.log('[PAYMENT_SERVICE] Creating MPesa checkout');
        try {
          checkoutResult = await this.createMpesaCheckout(params, user, packageDetails);
        } catch (mpesaError) {
          console.error('[PAYMENT_SERVICE] MPesa checkout failed, falling back to PaySuite:', mpesaError);
          // Fall back to PaySuite if MPesa fails
          checkoutResult = await this.createPaySuiteCheckout(params, user, packageDetails, paymentMethod);
        }
      } else {
        console.log('[PAYMENT_SERVICE] Creating PaySuite checkout');
        try {
          checkoutResult = await this.createPaySuiteCheckout(params, user, packageDetails, paymentMethod);
        } catch (paysuiteError) {
          console.error('[PAYMENT_SERVICE] PaySuite checkout failed:', paysuiteError);
          throw paysuiteError; // Don't fall back to Stripe, show the actual error
        }
      }
    } else {
      throw new Error(`Unsupported payment method: ${paymentMethod}`);
    }

      // Log the checkout creation
      await db.usageEvent.create({
        data: {
          userId: user.id,
          eventType: 'CREDIT_PURCHASE',
          description: `Initiated ${paymentMethod} checkout for ${packageDetails.name}`,
          metadata: {
            checkoutId: checkoutResult.checkoutId,
            packageType,
            credits: packageDetails.credits,
            amount: packageDetails.price,
            paymentMethod,
            provider: checkoutResult.provider,
          },
        },
      });

      console.log('[PAYMENT_SERVICE] Checkout created successfully:', {
        checkoutId: checkoutResult.checkoutId,
        url: checkoutResult.checkoutUrl,
        packageType,
        paymentMethod,
        provider: checkoutResult.provider,
      });

      return {
        checkoutId: checkoutResult.checkoutId,
        checkoutUrl: checkoutResult.checkoutUrl,
        packageDetails,
        provider: checkoutResult.provider,
        paymentMethod,
      };
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Checkout creation failed:', error);
      
      // Log error
      try {
        const user = await db.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        
        if (user) {
          await db.usageEvent.create({
            data: {
              userId: user.id,
              eventType: 'CREDIT_PURCHASE',
              description: `Checkout creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error',
                packageType,
                paymentMethod,
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
   * Create Stripe checkout (existing functionality)
   */
  private async createStripeCheckout(params: CreateCheckoutParams, user: any, packageDetails: any) {
    const { userId, packageType, userEmail, returnUrl, pricing } = params;

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
      returnUrl,
      pricing ? { amount: pricing.amount, currency: pricing.currency } : undefined
    );

    return {
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
      provider: 'stripe' as PaymentProvider,
    };
  }

  /**
   * Validate transaction limits for PaySuite mobile money
   */
  private validateTransactionLimits(amountMzn: number, paymentMethod: PaymentMethod): void {
    // No limits for mobile money (Emola) - removing previous limitation
    // PaySuite supports transactions without specific limits for Emola
  }

  /**
   * Create MPesa checkout
   */
  private async createMpesaCheckout(
    params: CreateCheckoutParams, 
    user: any, 
    packageDetails: any
  ) {
    const { userId, packageType, pricing } = params;

    console.log('[PAYMENT_SERVICE] Creating MPesa checkout for user:', userId);
    
    // Use regional pricing if provided, otherwise convert USD to MZN
    let amountMzn: number;
    if (pricing && pricing.currency === 'MZN') {
      amountMzn = pricing.amount;
    } else {
      // Convert USD to MZN (fallback for legacy)
      const exchangeRate = await this.getUsdToMznRate();
      const usdAmount = pricing ? pricing.amount : packageDetails.price;
      amountMzn = Math.round(usdAmount * exchangeRate * 100) / 100;
    }

    // Get user's saved phone number
    const savedPhoneNumber = await mpesaService.getUserPhoneNumber(userId);
    
    if (!savedPhoneNumber) {
      throw new Error('Phone number required for MPesa payment. Please provide your phone number.');
    }

    // Create MPesa payment using package system
    const paymentResult = await mpesaService.createPayment({
      userId: user.id,
      packageType: packageType,
      phoneNumber: savedPhoneNumber
    });

    if (!paymentResult.success) {
      throw new Error(paymentResult.message);
    }

    return {
      checkoutId: paymentResult.paymentId,
      checkoutUrl: '', // MPesa doesn't use checkout URLs
      provider: 'mpesa' as PaymentProvider,
      paymentMethod: 'mobile_money' as PaymentMethod,
      packageDetails,
      requiresUserAction: paymentResult.requiresUserAction,
      conversationId: paymentResult.conversationId,
      message: paymentResult.message
    };
  }

  /**
   * Create PaySuite checkout (new functionality)
   */
  private async createPaySuiteCheckout(
    params: CreateCheckoutParams, 
    user: any, 
    packageDetails: any, 
    paymentMethod: PaymentMethod
  ) {
    const { userId, packageType, returnUrl, pricing } = params;

    console.log('[PAYMENT_SERVICE] PaySuite token configured:', !!this.paysuiteToken);
    console.log('[PAYMENT_SERVICE] Payment method received:', paymentMethod);
    
    if (!this.paysuiteToken) {
      console.error('[PAYMENT_SERVICE] PaySuite API token not configured - falling back to Stripe');
      throw new Error('PaySuite API token not configured');
    }

    // Use regional pricing if provided, otherwise convert USD to MZN
    let amountMzn: number;
    if (pricing && pricing.currency === 'MZN') {
      amountMzn = pricing.amount;
    } else {
      // Convert USD to MZN (fallback for legacy)
      const exchangeRate = await this.getUsdToMznRate();
      const usdAmount = pricing ? pricing.amount : packageDetails.price;
      amountMzn = Math.round(usdAmount * exchangeRate * 100) / 100;
    }

    // Check PaySuite transaction limits for mobile money
    this.validateTransactionLimits(amountMzn, paymentMethod);

    // Generate unique reference
    const reference = `APLYCAT_${packageType.toUpperCase()}_${userId.slice(-8)}_${Date.now()}`;

    const paymentData: PaySuitePaymentRequest = {
      amount: amountMzn.toString(),
      reference,
      description: `${packageDetails.name} - ${packageDetails.credits} AI Credits - ${params.userEmail}`,
      return_url: `${returnUrl}?payment=success&provider=paysuite`,
      callback_url: `${process.env.WEBHOOK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/paysuite`,
      method: 'mobile_money', // PaySuite mobile money (Emola)
    };

    console.log('[PAYMENT_SERVICE] Sending PaySuite payment request:', {
      ...paymentData,
      callback_url: paymentData.callback_url,
    });

    const response = await fetch(`${this.paysuiteApiUrl}/payments`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.paysuiteToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(paymentData),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `PaySuite API error: ${response.status}`);
    }

    const result: PaySuitePaymentResponse = await response.json();

    if (result.status !== 'success' || !result.data) {
      throw new Error(result.message || 'PaySuite payment creation failed');
    }

    // Store payment record for webhook processing
    await this.storePaySuitePayment({
      paysuiteId: result.data.id,
      userId: user.id,
      clerkUserId: userId,
      packageType,
      credits: packageDetails.credits,
      amount: amountMzn,
      reference,
      status: 'pending',
      paymentMethod,
    });

    return {
      checkoutId: result.data.id,
      checkoutUrl: result.data.checkout_url,
      provider: 'paysuite' as PaymentProvider,
    };
  }

  /**
   * Store PaySuite payment record
   */
  private async storePaySuitePayment(data: {
    paysuiteId: string;
    userId: string;
    clerkUserId: string;
    packageType: string;
    credits: number;
    amount: number;
    reference: string;
    status: string;
    paymentMethod: PaymentMethod;
  }) {
    await db.paysuitePayment.create({
      data: {
        id: data.paysuiteId,
        userId: data.userId,
        clerkUserId: data.clerkUserId,
        packageType: data.packageType,
        credits: data.credits,
        amount: data.amount,
        currency: 'MZN',
        status: data.status,
        reference: data.reference,
        paymentMethod: data.paymentMethod,
        metadata: {
          reference: data.reference,
        },
      },
    });
  }

  /**
   * Get USD to MZN exchange rate
   */
  private async getUsdToMznRate(): Promise<number> {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await response.json();
      return data.rates.MZN || 64; // Fallback rate
    } catch (error) {
      console.warn('Failed to fetch exchange rate, using fallback');
      return 64; // Fallback MZN rate
    }
  }

  /**
   * Process successful payment and add credits (enhanced for multi-provider)
   */
  async processPayment(params: ProcessPaymentParams) {
    const { sessionId, userId, packageType, amount, credits, provider = 'stripe', reference, transactionId } = params;

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
          where: { id: user.id },
          data: { 
            credits: { increment: credits },
          },
        });

        // Create credit transaction record
        const transaction = await tx.creditTransaction.create({
          data: {
            userId: user.id,
            type: CreditTransactionType.PURCHASE,
            amount: credits,
            description: `${provider.toUpperCase()} ${packageType === 'trial' 
              ? `${STRIPE_CONFIG.trialConfig.name}`
              : `${STRIPE_CONFIG.creditPackages[packageType].name}`} - ${credits} credits`,
          },
        });

        // Log successful purchase event
        await tx.usageEvent.create({
          data: {
            userId: user.id,
            eventType: 'CREDIT_PURCHASE',
            description: `Successfully purchased ${credits} credits via ${provider.toUpperCase()}`,
            metadata: {
              sessionId,
              packageType,
              credits,
              amount,
              provider,
              reference,
              transactionId,
              previousCredits: user.credits,
              newCredits: updatedUser.credits,
              creditTransactionId: transaction.id,
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
        provider,
      });

      return result;
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Payment processing failed:', error);
      
      // Log error
      try {
        const user = await db.user.findUnique({
          where: { clerkId: userId },
          select: { id: true },
        });
        
        if (user) {
          await db.usageEvent.create({
            data: {
              userId: user.id,
              eventType: 'CREDIT_PURCHASE',
              description: `Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              metadata: {
                error: error instanceof Error ? error.message : 'Unknown error',
                sessionId,
                packageType,
                provider,
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
   * Handle Stripe webhook events (existing functionality)
   */
  async handleWebhook(event: Stripe.Event) {
    try {
      console.log('[PAYMENT_SERVICE] Processing Stripe webhook:', event.type);

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
          console.log('[PAYMENT_SERVICE] Unhandled Stripe webhook event:', event.type);
      }

      return { received: true };
    } catch (error) {
      console.error('[PAYMENT_SERVICE] Stripe webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle PaySuite webhook events (new functionality)
   */
  async handlePaySuiteWebhook(event: PaySuiteWebhookEvent): Promise<{ success: boolean; message: string }> {
    console.log('[PAYMENT_SERVICE] Processing PaySuite webhook:', event.event);

    try {
      switch (event.event) {
        case 'payment.success':
          await this.handlePaySuitePaymentSuccess(event.data);
          break;
        case 'payment.failed':
          await this.handlePaySuitePaymentFailed(event.data);
          break;
        default:
          console.log(`[PAYMENT_SERVICE] Unhandled PaySuite webhook event: ${event.event}`);
      }

      return { success: true, message: 'PaySuite webhook processed successfully' };
    } catch (error) {
      console.error('[PAYMENT_SERVICE] PaySuite webhook processing failed:', error);
      throw error;
    }
  }

  /**
   * Handle PaySuite payment success
   */
  private async handlePaySuitePaymentSuccess(data: PaySuiteWebhookEvent['data']) {
    const payment = await db.paysuitePayment.findFirst({
      where: { id: data.id },
    });

    if (!payment) {
      throw new Error(`PaySuite payment not found: ${data.id}`);
    }

    if (payment.status === 'completed') {
      console.log(`[PAYMENT_SERVICE] PaySuite payment already processed: ${data.id}`);
      return;
    }

    // Update payment status
    await db.paysuitePayment.update({
      where: { id: payment.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          ...payment.metadata as any,
          transaction: data.transaction,
          processedAt: new Date().toISOString(),
        },
      },
    });

    // Process the payment and add credits
    await this.processPayment({
      sessionId: payment.id,
      userId: payment.clerkUserId,
      packageType: payment.packageType as CreditPackageType,
      amount: payment.amount,
      credits: payment.credits,
      provider: 'paysuite',
      reference: payment.reference,
      transactionId: data.transaction?.id,
    });

    console.log(`[PAYMENT_SERVICE] Successfully processed PaySuite payment ${data.id} for user ${payment.clerkUserId}: +${payment.credits} credits`);
  }

  /**
   * Handle PaySuite payment failure
   */
  private async handlePaySuitePaymentFailed(data: PaySuiteWebhookEvent['data']) {
    const payment = await db.paysuitePayment.findFirst({
      where: { id: data.id }
    });

    if (!payment) {
      console.warn(`[PAYMENT_SERVICE] PaySuite payment not found for failed payment: ${data.id}`);
      return;
    }

    // Update payment status
    await db.paysuitePayment.update({
      where: { id: payment.id },
      data: {
        status: 'failed',
        metadata: {
          ...payment.metadata as any,
          error: data.error,
          failedAt: new Date().toISOString(),
        },
      },
    });

    console.log(`[PAYMENT_SERVICE] PaySuite payment failed: ${data.id}, error: ${data.error}`);
  }

  /**
   * Handle successful checkout completion (existing functionality)
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
        provider: 'stripe',
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
   * Validate PaySuite webhook signature
   */
  validatePaySuiteWebhook(body: string, signature: string): PaySuiteWebhookEvent {
    if (!this.paysuiteWebhookSecret) {
      throw new Error('PaySuite webhook secret not configured');
    }

    const calculatedSignature = crypto
      .createHmac('sha256', this.paysuiteWebhookSecret)
      .update(body)
      .digest('hex');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(calculatedSignature))) {
      throw new Error('Invalid PaySuite webhook signature');
    }

    return JSON.parse(body) as PaySuiteWebhookEvent;
  }

  /**
   * Get payment history for a user (enhanced with all providers)
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

      // Get Stripe credit transactions (exclude M-Pesa and PaySuite to avoid duplicates)
      const creditTransactions = await db.creditTransaction.findMany({
        where: { 
          userId: user.id,
          type: CreditTransactionType.PURCHASE,
          // Only include Stripe transactions (exclude M-Pesa and PaySuite duplicates)
          AND: [
            { NOT: { description: { contains: "MPESA", mode: 'insensitive' } } },
            { NOT: { description: { contains: "PAYSUITE", mode: 'insensitive' } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Get PaySuite payments
      const paysuitePayments = await db.paysuitePayment.findMany({
        where: { clerkUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Get MPesa payments
      const mpesaPayments = await db.mpesaPayment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      // Combine all transactions
      const allTransactions = [
        // Stripe transactions
        ...creditTransactions.map(tx => ({
          id: tx.id,
          type: 'credit_purchase',
          provider: 'stripe' as PaymentProvider,
          amount: Math.abs(tx.amount),
          description: tx.description,
          status: 'completed',
          createdAt: tx.createdAt,
          completedAt: tx.createdAt,
        })),
        
        // PaySuite transactions
        ...paysuitePayments.map(payment => ({
          id: payment.id,
          type: 'credit_purchase',
          provider: 'paysuite' as PaymentProvider,
          packageType: payment.packageType,
          credits: payment.credits,
          amount: payment.amount,
          currency: payment.currency,
          status: payment.status,
          paymentMethod: payment.paymentMethod,
          reference: payment.reference,
          createdAt: payment.createdAt,
          completedAt: payment.completedAt,
        })),

        // MPesa transactions
        ...mpesaPayments.map(payment => ({
          id: payment.id,
          type: 'credit_purchase',
          provider: 'mpesa' as PaymentProvider,
          packageType: payment.packageType,
          credits: payment.credits,
          amount: payment.amount,
          currency: 'MZN',
          status: payment.status.toLowerCase(),
          paymentMethod: 'mpesa',
          phoneNumber: payment.customerMsisdn,
          reference: payment.transactionReference,
          mpesaTransactionId: payment.mpesaTransactionId,
          conversationId: payment.mpesaConversationId,
          createdAt: payment.createdAt,
          completedAt: null, // MPesa doesn't have separate completedAt field
          errorMessage: payment.mpesaResponseDescription,
        }))
      ];

      // Sort by creation date and return
      return allTransactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

    } catch (error) {
      console.error('[PAYMENT_SERVICE] Failed to get payment history:', error);
      throw error;
    }
  }

  /**
   * Get available credit packages (existing functionality)
   */
  getCreditPackages() {
    return stripeClient.getAllCreditPackages();
  }

  /**
   * Get available payment methods for a package
   */
  getAvailablePaymentMethods(packageType?: CreditPackageType): PaymentMethod[] {
    const allMethods: PaymentMethod[] = ['credit_card', 'mobile_money'];
    
    if (!packageType) {
      return allMethods;
    }

    // Get package details to check amount limits
    const packageDetails = stripeClient.getCreditPackage(packageType);
    
    // Estimate MZN amount (using fallback rate for quick check)
    const estimatedMzn = packageDetails.price * 63.25;
    
    // All payment methods are available (no transaction limits)
    const availableMethods = allMethods;

    return availableMethods;
  }

  /**
   * Validate webhook signature (existing functionality, enhanced)
   */
  validateWebhookSignature(payload: string, signature: string, provider: PaymentProvider = 'stripe'): Stripe.Event | PaySuiteWebhookEvent {
    try {
      if (provider === 'stripe') {
        return stripeClient.verifyWebhookSignature(payload, signature);
      } else if (provider === 'paysuite') {
        return this.validatePaySuiteWebhook(payload, signature);
      } else {
        throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[PAYMENT_SERVICE] ${provider} webhook signature validation failed:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentService();