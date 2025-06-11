import React from "react";
import { setRequestLocale } from "next-intl/server";
import { LandingPage } from "../../components/landing-page";
import { routing } from "../../i18n/routing";

// Add generateStaticParams for static rendering
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale);

  // Show landing page for unauthenticated users
  // Authenticated users are redirected by middleware
  return <LandingPage />;
}
