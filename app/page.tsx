// app/page.tsx
// Auth redirects are now handled by middleware
import { LandingPage } from "@/components/landing-page";

export default function HomePage() {
  // Show landing page for unauthenticated users
  // Authenticated users are redirected by middleware
  return <LandingPage />;
}