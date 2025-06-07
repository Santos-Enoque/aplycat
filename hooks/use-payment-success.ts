
// hooks/use-payment-success.ts
"use client";

import { useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface UsePaymentSuccessOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export function usePaymentSuccess(options: UsePaymentSuccessOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { onSuccess, onError } = options;

  const handlePaymentSuccess = useCallback(() => {
    // Clear URL parameters
    const newUrl = window.location.pathname;
    router.replace(newUrl);

    // Show success message
    toast.success('🎉 Purchase successful! Your credits have been added to your account.');

    // Clear pending purchase data
    localStorage.removeItem('pendingPurchase');

    // Call success callback
    if (onSuccess) {
      onSuccess();
    }
  }, [router, onSuccess]);

  const handlePaymentError = useCallback((error: string) => {
    // Clear URL parameters
    const newUrl = window.location.pathname;
    router.replace(newUrl);

    // Show error message
    toast.error(`Payment failed: ${error}`);

    // Call error callback
    if (onError) {
      onError(error);
    }
  }, [router, onError]);

  useEffect(() => {
    const paymentStatus = searchParams.get('payment');
    const errorMessage = searchParams.get('error');

    if (paymentStatus === 'success') {
      handlePaymentSuccess();
    } else if (paymentStatus === 'error' || errorMessage) {
      handlePaymentError(errorMessage || 'Unknown payment error');
    }
  }, [searchParams, handlePaymentSuccess, handlePaymentError]);

  return {
    handlePaymentSuccess,
    handlePaymentError,
  };
}