"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TrialPaymentPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded) {
      if (user) {
        // Redirect authenticated users to dashboard where they'll see the claim card
        router.push("/dashboard");
      } else {
        // Redirect unauthenticated users to signup
        localStorage.setItem("aplycat_trial_intent", "true");
        router.push("/signup?trial=true");
      }
    }
  }, [isLoaded, user, router]);

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}
