// app/page.tsx
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingPageWrapper } from "@/components/landing-page-wrapper";

export default async function HomePage() {
  const user = await currentUser();

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/dashboard");
  }

  // Show landing page for unauthenticated users
  return <LandingPageWrapper />;
}
