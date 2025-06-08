// components/navbar.tsx
"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus } from "lucide-react";
import Link from "next/link";
import { useCredits } from "@/hooks/use-credits"; // We'll create this hook next

export function Navbar() {
  const { isSignedIn, isLoaded } = useUser();
  const { credits, isLoading: isLoadingCredits } = useCredits();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="text-2xl">🐱</span>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Aplycat
              </span>
            </Link>
          </div>

          {/* Auth & Credits */}
          <div className="flex items-center space-x-4">
            {!isLoaded ? (
              <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
            ) : isSignedIn ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5 text-gray-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {isLoadingCredits ? "..." : credits} Credits
                  </span>
                </div>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </div>
            ) : (
              <div />
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
