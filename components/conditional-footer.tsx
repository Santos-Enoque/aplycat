"use client";

import { useUser } from "@clerk/nextjs";
import { Footer } from "@/components/footer";

export function ConditionalFooter() {
  const { isSignedIn } = useUser();

  // Only show footer when user is not authenticated
  if (isSignedIn) {
    return null;
  }

  return <Footer />;
}
