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
    if (packageType === 'trial') {
      return STRIPE_CONFIG.trialConfig;
    }
    return STRIPE_CONFIG.creditPackages[packageType];
  }

  /**
   * Get Stripe Price ID for a package type (optional)
   */
  getPriceId(packageType: CreditPackageType): string | null {
    if (packageType === 'trial') {
      return STRIPE_CONFIG.trialConfig.priceId || null;
    }
    return STRIPE_CONFIG.creditPackages[packageType].priceId || null;
  }

  /**
   * Create a Stripe checkout session with dynamic pricing
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
    returnUrl?: string,
    priceOverride?: { amount: number; currency: string }
  ) {
    try {
      const packageDetails = this.getCreditPackage(packageType);

      // Prepare metadata (Stripe requires string values)
      const metadata: StripeCheckoutMetadata = {
        userId: customData.userId,
        packageType: customData.packageType,
        credits: customData.credits.toString(),
        userName: customData.userName,
      };

      // Use dynamic pricing if override provided, otherwise fall back to fixed price ID
      const priceId = this.getPriceId(packageType);
      const lineItems = priceOverride ? [
        {
          price_data: {
            currency: priceOverride.currency.toLowerCase(),
            product_data: {
              name: packageDetails.name,
              description: packageDetails.description,
              metadata: {
                credits: customData.credits.toString(),
                packageType: customData.packageType,
              },
            },
            unit_amount: Math.round(priceOverride.amount * 100), // Convert to cents
          },
          quantity: 1,
        },
      ] : priceId ? [
        {
          price: priceId,
          quantity: 1,
        },
      ] : [
        {
          price_data: {
            currency: 'mzn',
            product_data: {
              name: packageDetails.name,
              description: packageDetails.description,
              metadata: {
                credits: customData.credits.toString(),
                packageType: customData.packageType,
              },
            },
            unit_amount: Math.round(packageDetails.price * 100), // Convert to cents
          },
          quantity: 1,
        },
      ];

      // Create checkout session
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${returnUrl}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${returnUrl}?payment=cancelled`,
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