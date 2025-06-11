
// hooks/use-payment-success.ts
"use client";

import { useEffect, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface UsePaymentSuccessOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
  pollForCredits?: boolean; // Enable automatic credit polling
  maxPollAttempts?: number; // Maximum number of polling attempts
  pollInterval?: number; // Polling interval in ms
}

export function usePaymentSuccess(options: UsePaymentSuccessOptions = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { 
    onSuccess, 
    onError, 
    pollForCredits = true, 
    maxPollAttempts = 6, 
    pollInterval = 2000 
  } = options;
  
  const [isPolling, setIsPolling] = useState(false);

  const pollForCreditUpdate = useCallback(async (provider: string) => {
    if (!pollForCredits || isPolling) return;
    
    setIsPolling(true);
    let attempts = 0;
    
    // Get initial credit balance
    let initialCredits: number | null = null;
    try {
      const response = await fetch('/api/user/credits');
      if (response.ok) {
        const data = await response.json();
        initialCredits = data.credits || 0;
      }
    } catch (error) {
      console.log('Failed to get initial credits, continuing...');
    }

    const pollInterval_ms = pollInterval;
    
    const poll = async (attemptNumber: number): Promise<boolean> => {
      try {
        // Wait before checking (except first attempt)
        if (attemptNumber > 0) {
          await new Promise(resolve => setTimeout(resolve, pollInterval_ms));
        }
        
        const response = await fetch('/api/user/credits');
        if (!response.ok) return false;
        
        const data = await response.json();
        const currentCredits = data.credits || 0;
        
        // Check if credits have increased
        if (initialCredits !== null && currentCredits > initialCredits) {
          console.log(`Credits updated: ${initialCredits} -> ${currentCredits}`);
          return true; // Credits have been updated!
        }
        
        return false;
      } catch (error) {
        console.log(`Polling attempt ${attemptNumber + 1} failed:`, error);
        return false;
      }
    };

    // Poll for credit updates
    for (let i = 0; i < maxPollAttempts; i++) {
      const creditsUpdated = await poll(i);
      
      if (creditsUpdated) {
        // Success! Credits have been updated
        setIsPolling(false);
        if (onSuccess) {
          onSuccess();
        }
        return;
      }
      
      attempts = i + 1;
      console.log(`Polling attempt ${attempts}/${maxPollAttempts} - waiting for ${provider} webhook...`);
    }
    
    // Polling timeout - force refresh anyway
    setIsPolling(false);
    console.log(`Polling timeout after ${attempts} attempts. Forcing refresh...`);
    
    toast.info('Payment processed! Refreshing your account...');
    
    if (onSuccess) {
      onSuccess();
    }
  }, [onSuccess, pollForCredits, isPolling, maxPollAttempts, pollInterval]);

  const handlePaymentSuccess = useCallback(async (provider?: string) => {
    // Clear URL parameters
    const newUrl = window.location.pathname;
    router.replace(newUrl);

    // Clear pending purchase data
    localStorage.removeItem('pendingPurchase');

    // Show success message and handle provider-specific logic
    if (provider === 'paysuite') {
      toast.success('🎉 PaySuite payment successful!', {
        description: 'Your credits are being added to your account...'
      });
      
      // For PaySuite, poll for webhook processing
      await pollForCreditUpdate('PaySuite');
    } else {
      toast.success('🎉 Purchase successful! Your credits have been added to your account.');
      
      // For Stripe, credits are usually immediate
      if (onSuccess) {
        onSuccess();
      }
    }
  }, [router, onSuccess, pollForCreditUpdate]);

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
    const provider = searchParams.get('provider');
    const errorMessage = searchParams.get('error');

    if (paymentStatus === 'success') {
      handlePaymentSuccess(provider || undefined);
    } else if (paymentStatus === 'error' || errorMessage) {
      handlePaymentError(errorMessage || 'Unknown payment error');
    }
  }, [searchParams, handlePaymentSuccess, handlePaymentError]);

  return {
    handlePaymentSuccess,
    handlePaymentError,
  };
}