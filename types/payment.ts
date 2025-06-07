// types/payment.ts
export interface CreditPackage {
    id: string;
    name: string;
    credits: number;
    price: number;
    description: string;
    pricePerCredit: string;
    features: string[];
    isPopular?: boolean;
    discount?: string;
  }
  
  export interface CheckoutSession {
    id: string;
    url: string;
    packageType: string;
    amount: number;
    credits: number;
    expiresAt?: string;
  }
  
  export interface PaymentTransaction {
    id: string;
    userId: string;
    type: 'PURCHASE' | 'ANALYSIS_USE' | 'IMPROVEMENT_USE' | 'BONUS_CREDIT' | 'REFUND';
    amount: number;
    description: string;
    orderId?: string;
    orderNumber?: number;
    packageType?: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    metadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
  }
  
  export interface WebhookEvent {
    id: string;
    type: string;
    data: any;
    processed: boolean;
    processingAttempts: number;
    lastError?: string;
    createdAt: Date;
    processedAt?: Date;
  }
  
  export interface PaymentProvider {
    name: 'lemonsqueezy';
    displayName: 'Lemon Squeezy';
    isActive: boolean;
    configuration: {
      apiKey: string;
      storeId: string;
      webhookSecret: string;
      baseUrl: string;
    };
  }
  