// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ResumeProvider } from "@/hooks/use-resume-context";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
          suppressHydrationWarning={true}
        >
          <NextSSRPlugin
            /**
             * The `extractRouterConfig` will extract **only** the route configs
             * from the router to prevent additional information from being
             * leaked to the client. The data passed to the client is the same
             * as if you were to fetch `/api/uploadthing` directly.
             */
            routerConfig={extractRouterConfig(ourFileRouter)}
          />
          <ResumeProvider>
            <Navbar />
            <main className="min-h-screen">{children}</main>
            <Footer />
          </ResumeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
