"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, SignInButton, UserButton, useClerk } from "@clerk/nextjs";
import { EnhancedCreditsModal } from "@/components/enhanced-credits-modal";
import { useUserCredits } from "@/hooks/use-user-credits";
import {
  Cat,
  Home,
  FileText,
  Sparkles,
  CreditCard,
  Settings,
  HelpCircle,
  Menu,
  User,
  LogOut,
  Brain,
  Zap,
  X,
} from "lucide-react";

export function UnifiedNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCreditsModalOpen, setIsCreditsModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const {
    credits: userCredits,
    isLoading: creditsLoading,
    refetch: refetchCredits,
  } = useUserCredits();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link
              href={isSignedIn ? "/dashboard" : "/"}
              className="flex items-center gap-2"
            >
              <Cat className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">Aplycat</span>
            </Link>
          </div>

          {/* Right side - Auth and user menu */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              <>
                {/* Credits Display */}
                <div className="hidden sm:flex items-center gap-2">
                  {creditsLoading ? (
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-800 px-3 py-1 font-medium">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {userCredits} Credits
                    </Badge>
                  )}
                </div>

                {/* Buy Credits Button */}
                <Button
                  size="sm"
                  onClick={() => setIsCreditsModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white hidden sm:flex"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Buy Credits
                </Button>

                {/* Clerk UserButton */}
                <UserButton afterSignOutUrl="/" />
              </>
            ) : (
              // Not signed in state
              <div className="flex items-center space-x-4">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    Sign In
                  </Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Zap className="h-4 w-4 mr-2" />
                    Try Free
                  </Button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Credits Modal */}
      <EnhancedCreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
        onCreditsUpdated={async () => {
          // Refresh user credits after purchase
          await refetchCredits();
        }}
      />
    </nav>
  );
}
