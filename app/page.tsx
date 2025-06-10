// app/page.tsx
// Auth redirects are now handled by middleware
import { LandingPage } from "@/components/landing-page";
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function RootPage() {
  // Get user's preferred language from Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  
  // Simple language detection - check if Portuguese is preferred
  const preferredLocale = acceptLanguage.toLowerCase().includes('pt') ? 'pt' : 'en';
  
  // Redirect to the appropriate locale
  redirect(`/${preferredLocale}`);
}
