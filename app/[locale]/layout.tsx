// app/layout.tsx
import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UnifiedNavbar } from "../../components/unified-navbar";
import { ResumeProvider } from "../../hooks/use-resume-context";
import { PerformanceTracker } from "../../components/performance-tracker";
import { QueryProvider } from "../../components/providers/query-provider";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { PostHogProvider } from "../../components/providers/PostHogProvider";
import { CreditsModalProvider } from "../../components/providers/credits-modal-provider";
import { Toaster } from "../../components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { getMessages, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "../../i18n/routing";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Aplycat - Brutally Honest Resume Analysis",
  description:
    "Get AI-powered, brutally honest feedback on your resume. Transform your career with insights that actually matter.",
  keywords:
    "resume analysis, resume feedback, AI resume review, ATS optimization, job search",
  openGraph: {
    title: "Aplycat - Brutally Honest Resume Analysis",
    description:
      "Get AI-powered, brutally honest feedback on your resume. Transform your career with insights that actually matter.",
    type: "website",
  },
};

// Add generateStaticParams for static rendering
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const messages = await getMessages();
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#278EC6", // Blue color
          colorText: "#374151", // Gray-700
        },
        elements: {
          formButtonPrimary:
            "bg-blue-600 hover:bg-blue-700 text-white font-medium",
          formFieldInput:
            "border-gray-300 focus:border-blue-500 focus:ring-blue-500",
          footerActionLink: "text-blue-600 hover:text-blue-500",
        },
      }}
    >
      <html lang={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning={true}
        >
          <NextIntlClientProvider messages={messages}>
            <PostHogProvider>
              <CreditsModalProvider>
                <QueryProvider>
                  <ResumeProvider>
                    <PerformanceTracker />
                    <UnifiedNavbar />
                    <main className="min-h-screen">{children}</main>
                  </ResumeProvider>
                </QueryProvider>
              </CreditsModalProvider>
            </PostHogProvider>
            <Analytics />
            <Toaster />
          </NextIntlClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
