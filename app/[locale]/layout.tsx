import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales } from "@/i18n/request";

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
  params: Promise<{ locale: string }>;
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
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
