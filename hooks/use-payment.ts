// hooks/use-payment.ts
"use client";

import { useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { toast } from 'sonner';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  description: string;
  pricePerCredit: string;
}

interface PaymentTransaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface UsePaymentReturn {
  // State
  packages: CreditPackage[];
  transactions: PaymentTransaction[];
  isLoading: boolean;
  isCreatingCheckout: boolean;
  
  // Actions
  loadPackages: () => Promise<void>;
  loadTransactions: () => Promise<void>;
  createCheckout: (packageId: string) => Promise<string | null>;
  
  // Utilities
  refresh: () => Promise<void>;
}

export function usePayment(): UsePaymentReturn {
  const { user } = useUser();
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingCheckout, setIsCreatingCheckout] = useState(false);

  const loadPackages = useCallback(async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/payments/packages');
      if (!response.ok) {
        throw new Error('Failed to load packages');
      }
      
      const data = await response.json();
      if (data.success) {
        setPackages(data.packages);
      } else {
        throw new Error(data.error || 'Failed to load packages');
      }
    } catch (error) {
      console.error('Error loading packages:', error);
      toast.error('Failed to load credit packages');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadTransactions = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/payments/history');
      if (!response.ok) {
        throw new Error('Failed to load transaction history');
      }
      
      const data = await response.json();
      if (data.success) {
        setTransactions(data.transactions);
      } else {
        throw new Error(data.error || 'Failed to load transactions');
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load payment history');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const createCheckout = useCallback(async (packageId: string): Promise<string | null> => {
    if (!user) {
      toast.error('Please sign in to purchase credits');
      return null;
    }

    try {
      setIsCreatingCheckout(true);
      
      const response = await fetch('/api/payments/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageType: packageId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create checkout');
      }

      const data = await response.json();
      
      if (!data.success || !data.checkoutUrl) {
        throw new Error('Invalid checkout response');
      }

      // Store checkout info for later reference
      localStorage.setItem('pendingPurchase', JSON.stringify({
        packageId,
        checkoutId: data.checkoutId,
        timestamp: Date.now(),
      }));

      return data.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create checkout'
      );
      return null;
    } finally {
      setIsCreatingCheckout(false);
    }
  }, [user]);

  const refresh = useCallback(async () => {
    await Promise.all([
      loadPackages(),
      loadTransactions(),
    ]);
  }, [loadPackages, loadTransactions]);

  return {
    packages,
    transactions,
    isLoading,
    isCreatingCheckout,
    loadPackages,
    loadTransactions,
    createCheckout,
    refresh,
  };
}