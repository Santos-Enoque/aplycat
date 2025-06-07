
// hooks/use-pending-purchase.ts
"use client";

import { useState, useEffect } from 'react';

interface PendingPurchase {
  packageId: string;
  checkoutId: string;
  timestamp: number;
}

export function usePendingPurchase() {
  const [pendingPurchase, setPendingPurchase] = useState<PendingPurchase | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('pendingPurchase');
    if (stored) {
      try {
        const purchase = JSON.parse(stored) as PendingPurchase;
        
        // Check if purchase is less than 1 hour old
        const isRecent = Date.now() - purchase.timestamp < 60 * 60 * 1000;
        
        if (isRecent) {
          setPendingPurchase(purchase);
        } else {
          // Clean up old pending purchase
          localStorage.removeItem('pendingPurchase');
        }
      } catch (error) {
        console.error('Error parsing pending purchase:', error);
        localStorage.removeItem('pendingPurchase');
      }
    }
  }, []);

  const clearPendingPurchase = () => {
    localStorage.removeItem('pendingPurchase');
    setPendingPurchase(null);
  };

  return {
    pendingPurchase,
    clearPendingPurchase,
    hasPendingPurchase: !!pendingPurchase,
  };
}