import Stripe from 'stripe';
import { STRIPE_CONFIG, type CreditPackageType, type StripeCheckoutMetadata } from './config';

class StripeClient {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(STRIPE_CONFIG.apiKey, {
      apiVersion: '2025-05-28.basil',
    });
  }

  /**
   * Get credit package details
   */
  getCreditPackage(packageType: CreditPackageType) {
    return STRIPE_CONFIG.creditPackages[packageType];
  }

  /**
   * Get Stripe Price ID for a package type
   */
  getPriceId(packageType: CreditPackageType): string {
    return STRIPE_CONFIG.creditPackages[packageType].priceId;
  }

  /**
   * Create a Stripe checkout session
   */
  async createCheckout(
    packageType: CreditPackageType,
    userEmail: string,
    customData: {
      userId: string;
      packageType: CreditPackageType;
      credits: number;
      userName: string;
    },
    returnUrl?: string
  ) {
    try {
      const packageDetails = this.getCreditPackage(packageType);
      const priceId = this.getPriceId(packageType);

      // Prepare metadata (Stripe requires string values)
      const metadata: StripeCheckoutMetadata = {
        userId: customData.userId,
        packageType: customData.packageType,
        credits: customData.credits.toString(),
        userName: customData.userName,
      };

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: returnUrl ? `${returnUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}` : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard?payment=cancelled`,
        customer_email: userEmail,
        metadata,
        // Additional options
        allow_promotion_codes: true,
        billing_address_collection: 'auto',
      });

      console.log('[STRIPE_CLIENT] Checkout session created:', {
        sessionId: session.id,
        url: session.url,
        packageType,
        credits: customData.credits,
      });

      return {
        id: session.id,
        url: session.url!,
        packageDetails,
      };
    } catch (error) {
      console.error('[STRIPE_CLIENT] Checkout creation failed:', error);
      throw new Error(`Failed to create Stripe checkout: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Retrieve a checkout session
   */
  async retrieveCheckoutSession(sessionId: string) {
    try {
      const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
        expand: ['line_items', 'payment_intent'],
      });
      return session;
    } catch (error) {
      console.error('[STRIPE_CLIENT] Failed to retrieve checkout session:', error);
      throw error;
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      return this.stripe.webhooks.constructEvent(
        payload,
        signature,
        STRIPE_CONFIG.webhookSecret
      );
    } catch (error) {
      console.error('[STRIPE_CLIENT] Webhook signature verification failed:', error);
      throw new Error('Invalid webhook signature');
    }
  }

  /**
   * Get all credit packages
   */
  getAllCreditPackages() {
    return Object.entries(STRIPE_CONFIG.creditPackages).map(([key, pkg]) => ({
      id: key,
      ...pkg,
      pricePerCredit: (pkg.price / pkg.credits).toFixed(2),
    }));
  }
}

// Export singleton instance
export const stripeClient = new StripeClient(); 