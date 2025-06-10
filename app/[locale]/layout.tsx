import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UnifiedNavbar } from "@/components/unified-navbar";
import { Footer } from "@/components/footer";
import { ResumeProvider } from "@/hooks/use-resume-context";
import { PerformanceTracker } from "@/components/performance-tracker";
import { QueryProvider } from "@/components/providers/query-provider";
import "../globals.css";
import { ClerkProvider } from "@clerk/nextjs";
// import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
// import { extractRouterConfig } from "uploadthing/server";
// import { ourFileRouter } from "@/app/api/uploadthing/core";
import { ConditionalFooter } from "@/components/conditional-footer";
import { PostHogProvider } from "@/components/providers/PostHogProvider";
import { CreditsModalProvider } from "@/components/providers/credits-modal-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n";

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

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  // Await params before accessing its properties
  const { locale } = await params;

  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  // Providing all messages to the client
  const messages = await getMessages();

  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined,
        variables: {
          colorPrimary: "#7c3aed", // Purple-600
          colorText: "#374151", // Gray-700
        },
        elements: {
          formButtonPrimary:
            "bg-purple-600 hover:bg-purple-700 text-white font-medium",
          formFieldInput:
            "border-gray-300 focus:border-purple-500 focus:ring-purple-500",
          footerActionLink: "text-purple-600 hover:text-purple-500",
        },
      }}
    >
      <html lang={locale}>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning={true}
        >
          {/* <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} /> */}
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
          </NextIntlClientProvider>
          <Analytics />
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
