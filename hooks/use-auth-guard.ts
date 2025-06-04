// lib/hooks/use-auth-guard.ts
"use client";

import { useUser } from '@clerk/nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthGuardOptions {
  redirectTo?: string;
  allowGuests?: boolean;
}

export function useAuthGuard(options: AuthGuardOptions = {}) {
  const { user, isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  const { redirectTo = '/sign-in', allowGuests = false } = options;

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn && !allowGuests) {
      // Store current URL for redirect after sign-in
      const currentUrl = window.location.href;
      const signInUrl = new URL(redirectTo, window.location.origin);
      signInUrl.searchParams.set('redirect_url', currentUrl);
      
      router.push(signInUrl.toString());
      return;
    }

    setIsReady(true);
  }, [isLoaded, isSignedIn, allowGuests, redirectTo, router]);

  return {
    user,
    isSignedIn,
    isLoaded,
    isReady,
    isGuest: !isSignedIn && allowGuests,
  };
}

// Hook for handling post-sign-in redirects
export function useAuthRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePostSignIn = () => {
    const redirectUrl = searchParams.get('redirect_url');
    if (redirectUrl) {
      router.push(redirectUrl);
    } else {
      router.push('/dashboard');
    }
  };

  return { handlePostSignIn };
}