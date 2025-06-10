// app/page.tsx
// Auth redirects are now handled by middleware
import { LandingPage } from "@/components/landing-page";
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirect to default locale (English)
  redirect('/en');
}
