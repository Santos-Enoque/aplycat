// lib/stripe/config.ts
export const STRIPE_CONFIG = {
  apiKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // Credit packages (same as LemonSqueezy but for Stripe)
  creditPackages: {
    starter: {
      credits: 5,
      price: 0.16, // ~10 MZN (0.16 USD * 63.25 MZN/USD ≈ 10.12 MZN) - TEST PRICE
      name: '🥉 Starter Pack (TEST)',
      description: 'Perfect for getting started - TEST MODE',
      priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    },
    professional: {
      credits: 30,
      price: 12.49,
      name: '🥈 Professional Pack',
      description: 'Most popular choice',
      priceId: process.env.STRIPE_PROFESSIONAL_PRICE_ID!,
    },
    premium: {
      credits: 70,
      price: 24.99,
      name: '🥇 Premium Pack',
      description: 'Best value for power users',
      priceId: process.env.STRIPE_PREMIUM_PRICE_ID!,
    },
  } as const,

  // Special trial configuration (separate from main packages)
  trialConfig: {
    credits: 7,
    price: 1.00,
    name: '🚀 Trial Pack',
    description: 'Try all AI features for $1',
    priceId: process.env.STRIPE_TRIAL_PRICE_ID!,
  },
};

// Stripe webhook event types we care about
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  PAYMENT_INTENT_SUCCEEDED: 'payment_intent.succeeded',
  PAYMENT_INTENT_PAYMENT_FAILED: 'payment_intent.payment_failed',
} as const;

// Types
export type CreditPackageType = keyof typeof STRIPE_CONFIG.creditPackages | 'trial';

export interface StripeCheckoutMetadata {
  userId: string;
  packageType: CreditPackageType;
  credits: string; // Stripe metadata must be strings
  userName: string;
  [key: string]: string; // Index signature for Stripe metadata
}

export interface StripeWebhookPayload {
  id: string;
  object: string;
  api_version: string;
  created: number;
  data: {
    object: any;
  };
  livemode: boolean;
  pending_webhooks: number;
  request: {
    id: string | null;
    idempotency_key: string | null;
  };
  type: string;
} 