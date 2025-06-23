// lib/stripe/config.ts
export const STRIPE_CONFIG = {
  apiKey: process.env.STRIPE_SECRET_KEY!,
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // Credit packages - simplified system with only Pro Pack for regular purchases
  creditPackages: {
    pro: {
      credits: 44,
      price: 200, // Price in MZN
      name: '🥇 Pro Pack',
      description: 'Best value for serious job seekers',
      priceId: process.env.STRIPE_PRO_PRICE_ID || '', // Optional for dynamic pricing
    },
  } as const,

  // Special trial configuration for first-time users only
  trialConfig: {
    credits: 22,
    price: 100, // Price in MZN
    name: '🎁 Trial Pack',
    description: 'Perfect way to try all features - one-time only',
    priceId: process.env.STRIPE_TRIAL_PRICE_ID || '', // Optional for dynamic pricing
  },
};

// Stripe webhook event types we care about
export const STRIPE_WEBHOOK_EVENTS = {
  CHECKOUT_SESSION_COMPLETED: 'checkout.session.completed',
  CHECKOUT_SESSION_EXPIRED: 'checkout.session.expired',
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