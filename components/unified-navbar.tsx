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
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslations } from "next-intl";
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
  Globe,
  ChevronDown,
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
  const t = useTranslations("navbar");

  // Determine the correct home link
  const getHomeLink = () => {
    if (isSignedIn) {
      return "/dashboard";
    } else {
      return "/";
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href={getHomeLink()} className="flex items-center gap-2">
              <Cat className="h-8 w-8 text-purple-600" />
              <span className="hidden sm:inline-block text-xl font-bold text-gray-900">
                Aplycat
              </span>
            </Link>
          </div>

          {/* Right side - Auth and user menu */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher - Always visible */}
            <div className="block">
              <LanguageSwitcher />
            </div>

            {isSignedIn ? (
              <>
                {/* Credits Display - Only on desktop */}
                <div className="hidden sm:flex items-center gap-2">
                  {creditsLoading ? (
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
                  ) : (
                    <Badge className="bg-purple-100 text-purple-800 px-3 py-1 font-medium">
                      <CreditCard className="h-3 w-3 mr-1" />
                      {userCredits} {t("credits")}
                    </Badge>
                  )}
                </div>

                {/* Buy Credits Button - Compact on mobile */}
                <Button
                  size="sm"
                  onClick={() => setIsCreditsModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
                >
                  <Zap className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">{t("buyCredits")}</span>
                </Button>

                {/* Custom User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex items-center gap-1 p-2"
                    >
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {user?.firstName?.charAt(0) ||
                          user?.emailAddresses[0]?.emailAddress?.charAt(0) ||
                          "U"}
                      </div>
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* User Info */}
                    <div className="px-3 py-2 border-b">
                      <p className="text-sm font-medium truncate">
                        {user?.firstName ||
                          user?.emailAddresses[0]?.emailAddress}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {user?.emailAddresses[0]?.emailAddress}
                      </p>
                    </div>

                    {/* Credits Info - Mobile only */}
                    <div className="sm:hidden px-3 py-2 border-b">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {t("credits")}
                        </span>
                        <Badge className="bg-purple-100 text-purple-800 px-2 py-1 text-xs">
                          <CreditCard className="h-3 w-3 mr-1" />
                          {creditsLoading ? "..." : userCredits}
                        </Badge>
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    {/* Dashboard Link */}
                    <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                      <Home className="h-4 w-4 mr-2" />
                      {t("dashboard")}
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    {/* Sign Out */}
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-600"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              // Not signed in state
              <div className="flex items-center gap-2 sm:gap-4">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {t("signIn")}
                  </Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Zap className="h-4 w-4 sm:mr-2" />
                    <span className="hidden sm:inline">{t("tryFree")}</span>
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
