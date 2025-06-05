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
import { CreditsModal } from "@/components/credits-modal";
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

  // Navigation items for authenticated users
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "Resumes", href: "/dashboard/resumes", icon: FileText },
    { name: "Analyses", href: "/dashboard/analyses", icon: Brain },
    { name: "Improvements", href: "/dashboard/improvements", icon: Sparkles },
    { name: "Credits", href: "/dashboard/credits", icon: CreditCard },
  ];

  // Navigation items for non-authenticated users
  const publicNavItems = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Examples", href: "#examples" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center">
            <Link
              href={isSignedIn ? "/dashboard" : "/"}
              className="flex items-center gap-2"
            >
              <Cat className="h-8 w-8 text-purple-600" />
              <span className="text-xl font-bold text-gray-900">Aplycat</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-4">
              {isSignedIn
                ? // Authenticated navigation
                  navigation.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.name}
                        href={item.href}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-purple-100 text-purple-700"
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.name}
                      </Link>
                    );
                  })
                : // Public navigation
                  publicNavItems.map((item) => (
                    <a
                      key={item.name}
                      href={item.href}
                      className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium transition-colors"
                    >
                      {item.name}
                    </a>
                  ))}
            </div>
          </div>

          {/* Right side - Auth and user menu */}
          <div className="flex items-center gap-4">
            {isSignedIn ? (
              // Authenticated user UI
              <>
                {/* Credits Badge */}
                <Badge className="bg-purple-100 text-purple-800 px-3 py-1 hidden sm:flex">
                  <CreditCard className="h-3 w-3 mr-1" />
                  Credits
                </Badge>

                {/* Buy Credits Button */}
                <Button
                  size="sm"
                  onClick={() => setIsCreditsModalOpen(true)}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white hidden sm:flex"
                >
                  Buy Credits
                </Button>

                {/* Mobile menu for authenticated users */}
                <div className="md:hidden">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {navigation.map((item) => (
                        <DropdownMenuItem
                          key={item.name}
                          onClick={() => router.push(item.href)}
                          className="flex items-center gap-2"
                        >
                          <item.icon className="h-4 w-4" />
                          {item.name}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setIsCreditsModalOpen(true)}
                        className="flex items-center gap-2"
                      >
                        <CreditCard className="h-4 w-4" />
                        Buy Credits
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                      <DropdownMenuItem className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Help
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-semibold text-purple-600">
                          {user?.firstName?.charAt(0) ||
                            user?.emailAddresses[0]?.emailAddress.charAt(0) ||
                            "U"}
                        </span>
                      </div>
                      <span className="hidden sm:block">
                        {user?.firstName || "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/profile")}
                      className="flex items-center gap-2"
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/settings")}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => router.push("/dashboard/help")}
                      className="flex items-center gap-2"
                    >
                      <HelpCircle className="h-4 w-4" />
                      Help & Support
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => signOut(() => router.push("/"))}
                      className="flex items-center gap-2 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Clerk UserButton for actual auth */}
                <div className="hidden">
                  <UserButton afterSignOutUrl="/" />
                </div>
              </>
            ) : (
              // Non-authenticated user UI
              <div className="hidden md:flex items-center space-x-4">
                {!isLoaded ? (
                  // Loading skeleton
                  <div className="flex items-center space-x-4">
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
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
            )}

            {/* Mobile menu button for non-authenticated users */}
            {!isSignedIn && (
              <div className="md:hidden">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="text-gray-600 hover:text-gray-900 focus:outline-none focus:text-gray-900"
                >
                  {isMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation for non-authenticated users */}
        {!isSignedIn && isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {publicNavItems.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 block px-3 py-2 text-base font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}

              <div className="pt-4 pb-2 border-t border-gray-200 mt-4">
                {!isLoaded ? (
                  // Loading skeleton
                  <div className="space-y-2">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                ) : (
                  <div className="flex flex-col space-y-2">
                    <SignInButton mode="modal">
                      <Button variant="ghost" className="justify-start">
                        <User className="h-4 w-4 mr-2" />
                        Sign In
                      </Button>
                    </SignInButton>
                    <SignInButton mode="modal">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white justify-start">
                        <Zap className="h-4 w-4 mr-2" />
                        Try Free
                      </Button>
                    </SignInButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Credits Modal */}
      <CreditsModal
        isOpen={isCreditsModalOpen}
        onClose={() => setIsCreditsModalOpen(false)}
      />
    </nav>
  );
}
