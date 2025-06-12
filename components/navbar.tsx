// components/navbar.tsx
"use client";

import { useState } from "react";
import { useUser, SignInButton, UserButton } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Menu, X, Zap, User } from "lucide-react";
import Link from "next/link";

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, isSignedIn, isLoaded } = useUser();
  const t = useTranslations("navbar");

  const navItems = [
    { name: "Features", href: "#features" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Examples", href: "#examples" },
    { name: "Pricing", href: "#pricing" },
  ];

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="text-2xl">🐱</span>
              <span className="ml-2 text-xl font-bold text-gray-900">
                Aplycat
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              {navItems.map((item) => (
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

          {/* Desktop Auth & CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {!isLoaded ? (
              // Loading skeleton
              <div className="flex items-center space-x-4">
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : isSignedIn ? (
              // Signed in state
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {t("dashboard")}
                  </Button>
                </Link>
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
              // Not signed in state
              <div className="flex items-center space-x-4">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {t("signIn")}
                  </Button>
                </SignInButton>
                <SignInButton mode="modal">
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Zap className="h-4 w-4 mr-2" />
                    {t("tryFree")}
                  </Button>
                </SignInButton>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
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
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t">
              {navItems.map((item) => (
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
                ) : isSignedIn ? (
                  // Signed in state
                  <div className="space-y-2">
                    <Link href="/dashboard">
                      <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <User className="h-4 w-4 mr-2" />
                        {t("dashboard")}
                      </Button>
                    </Link>
                    <div className="px-3 py-2">
                      <UserButton
                        appearance={{
                          elements: {
                            avatarBox: "h-8 w-8",
                          },
                        }}
                        afterSignOutUrl="/"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {user.firstName || user.emailAddresses[0]?.emailAddress}
                      </span>
                    </div>
                  </div>
                ) : (
                  // Not signed in state
                  <div className="flex flex-col space-y-2">
                    <SignInButton mode="modal">
                      <Button variant="ghost" className="justify-start">
                        <User className="h-4 w-4 mr-2" />
                        {t("signIn")}
                      </Button>
                    </SignInButton>
                    <SignInButton mode="modal">
                      <Button className="bg-purple-600 hover:bg-purple-700 text-white justify-start">
                        <Zap className="h-4 w-4 mr-2" />
                        {t("tryFree")}
                      </Button>
                    </SignInButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
