// lib/services/payment-service.ts
import { db } from '@/lib/db';
import { stripeClient } from '@/lib/stripe/client';
import { STRIPE_CONFIG, STRIPE_WEBHOOK_EVENTS } from '@/lib/stripe/config';
import type { 
  CreditPackageType
} from '@/lib/stripe/config';
import { CreditTransactionType } from '@prisma/client';
import type Stripe from 'stripe';
import { mpesaService } from '@/lib/mpesa-service';

// Payment provider types
export type PaymentProvider = 'stripe' | 'mpesa';
export type PaymentMethod = 'credit_card' | 'mobile_money';

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
  currency: string;
  credits: number;
  provider?: PaymentProvider;
  reference?: string;
  transactionId?: string;
}

class PaymentService {

  constructor() {
  }

  async createCheckout(params: CreateCheckoutParams) {
    const { userId, packageType, userEmail, paymentMethod = 'credit_card' } = params;

    try {
      console.log('[PAYMENT_SERVICE] Creating checkout:', params);

      const user = await db.user.findUnique({
        where: { clerkId: userId },
        select: { id: true, email: true, firstName: true, lastName: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      const packageDetails = stripeClient.getCreditPackage(packageType);

      let checkoutResult;

      console.log('[PAYMENT_SERVICE] Routing payment method:', paymentMethod);
      
      if (paymentMethod === 'credit_card') {
        console.log('[PAYMENT_SERVICE] Creating Stripe checkout');
        checkoutResult = await this.createStripeCheckout(params, user, packageDetails);
      } else if (paymentMethod === 'mobile_money') {
        console.log('[PAYMENT_SERVICE] Creating MPesa checkout');
        checkoutResult = await this.createMpesaCheckout(params, user, packageDetails);
      } else {
        throw new Error(`Unsupported payment method: ${paymentMethod}`);
      }

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

  private async createStripeCheckout(params: CreateCheckoutParams, user: any, packageDetails: any) {
    const { userId, packageType, userEmail, returnUrl, pricing } = params;

    let mznPricing: { amount: number; currency: string };
    
    if (pricing && pricing.currency === 'MZN') {
      mznPricing = { amount: pricing.amount, currency: 'MZN' };
    } else {
      mznPricing = { amount: packageDetails.price, currency: 'MZN' };
    }

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
      mznPricing
    );

    return {
      checkoutId: checkout.id,
      checkoutUrl: checkout.url,
      provider: 'stripe' as PaymentProvider,
    };
  }

  private async createMpesaCheckout(
    params: CreateCheckoutParams, 
    user: any, 
    packageDetails: any
  ) {
    const { userId, packageType } = params;

    console.log('[PAYMENT_SERVICE] Creating MPesa checkout for user:', userId);
    
    const savedPhoneNumber = await mpesaService.getUserPhoneNumber(userId);
    
    if (!savedPhoneNumber) {
      throw new Error('Phone number required for MPesa payment. Please provide your phone number.');
    }

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
      checkoutUrl: '',
      provider: 'mpesa' as PaymentProvider,
      paymentMethod: 'mobile_money' as PaymentMethod,
      packageDetails,
      requiresUserAction: paymentResult.requiresUserAction,
      conversationId: paymentResult.conversationId,
      message: paymentResult.message
    };
  }

  async processPayment(params: ProcessPaymentParams) {
    const { sessionId, userId, packageType, amount, currency, credits, provider = 'stripe', reference, transactionId } = params;

    try {
      console.log('[PAYMENT_SERVICE] Processing payment:', params);

      const result = await db.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { clerkId: userId },
          select: { id: true, credits: true, email: true },
        });

        if (!user) {
          throw new Error('User not found during payment processing');
        }

        const updatedUser = await tx.user.update({
          where: { id: user.id },
          data: { 
            credits: { increment: credits },
          },
        });

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
              currency,
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

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    try {
      console.log('[PAYMENT_SERVICE] Processing checkout completion:', session.id);

      const metadata = session.metadata;
      if (!metadata) {
        throw new Error('No metadata found in checkout session');
      }

      const { userId, packageType, credits } = metadata;
      
      if (!userId || !packageType || !credits) {
        throw new Error('Missing required metadata in checkout session');
      }

      const creditsNumber = parseInt(credits);
      const amount = session.amount_total ? session.amount_total / 100 : 0;
      const currency = session.currency || 'mzn';

      await this.processPayment({
        sessionId: session.id,
        userId,
        packageType: packageType as CreditPackageType,
        amount,
        currency,
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

  async getPaymentHistory(userId?: string) {
    try {
      const userWhere = userId ? { clerkId: userId } : undefined;
      
      if (userWhere) {
        const user = await db.user.findUnique({ where: userWhere, select: { id: true } });
        if (!user) throw new Error('User not found');
      }

      const stripeTransactions = await db.usageEvent.findMany({
        where: {
          user: userWhere,
          eventType: 'CREDIT_PURCHASE',
          metadata: {
            path: ['provider'],
            equals: 'stripe'
          }
        },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const mpesaPayments = await db.mpesaPayment.findMany({
        where: { user: userWhere ? { clerkId: userId } : undefined },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      const allTransactions = [
        ...stripeTransactions.map(event => {
          const meta = event.metadata as any;
          return {
            id: event.id,
            type: 'credit_purchase',
            provider: 'stripe' as PaymentProvider,
            description: event.description,
            amount: meta.amount,
            currency: meta.currency?.toUpperCase() || 'MZN',
            status: 'completed',
            createdAt: event.createdAt,
            completedAt: event.createdAt,
            user: event.user,
          };
        }),
        
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
          completedAt: null,
          errorMessage: payment.mpesaResponseDescription,
          user: payment.user,
        }))
      ];

      return allTransactions
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 50);

    } catch (error) {
      console.error('[PAYMENT_SERVICE] Failed to get payment history:', error);
      throw error;
    }
  }

  getCreditPackages() {
    return stripeClient.getAllCreditPackages();
  }

  getAvailablePaymentMethods(packageType?: CreditPackageType): PaymentMethod[] {
    const methods: PaymentMethod[] = ['credit_card'];
    
    if (process.env.MPESA_API_KEY) {
      methods.push('mobile_money');
    }
    
    return methods;
  }

  getPricing(countryCode: string | null) {
    if (countryCode === 'MZ') {
        return {
            pro: { amount: 200, currency: 'MZN' },
            trial: { amount: 100, currency: 'MZN' }
        };
    }
    const proPackage = STRIPE_CONFIG.creditPackages.pro;
    const trialPackage = STRIPE_CONFIG.trialConfig;

    return {
        pro: { amount: proPackage.price, currency: 'USD' },
        trial: { amount: trialPackage.price, currency: 'USD' }
    };
  }

  validateWebhookSignature(payload: string, signature: string, provider: PaymentProvider = 'stripe'): Stripe.Event {
    try {
      if (provider === 'stripe') {
        return stripeClient.verifyWebhookSignature(payload, signature);
      } else {
        throw new Error(`Unsupported payment provider: ${provider}`);
      }
    } catch (error) {
      console.error(`[PAYMENT_SERVICE] ${provider} webhook signature validation failed:`, error);
      throw error;
    }
  }
}

export const paymentService = new PaymentService();