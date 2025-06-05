// app/dashboard/page.tsx
import { getCurrentUserFromDB } from "@/lib/auth/user-sync";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await getCurrentUserFromDB();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch comprehensive user data with all relationships
  const userData = await db.user.findUnique({
    where: { id: user.id },
    include: {
      resumes: {
        include: {
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1, // Get latest analysis for each resume
          },
          improvedResumes: {
            orderBy: { createdAt: "desc" },
            take: 1, // Get latest improvement for each resume
          },
        },
        orderBy: { createdAt: "desc" },
      },
      analyses: {
        include: {
          resume: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Recent analyses
      },
      improvedResumes: {
        include: {
          resume: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Recent improvements (using new ImprovedResume model)
      },
      creditTransactions: {
        orderBy: { createdAt: "desc" },
        take: 5, // Recent transactions
      },
      subscriptions: {
        where: { status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!userData) {
    // This shouldn't happen, but fallback to sign-in
    redirect("/sign-in");
  }

  return <DashboardContent user={userData} />;
}
