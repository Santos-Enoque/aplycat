import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard/dashboard-content";
import { db } from "@/lib/db";

export default async function DashboardPage() {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Fetch user data and related information
  const dbUser = await db.user.findUnique({
    where: { clerkId: user.id },
    include: {
      resumes: {
        include: {
          analyses: {
            orderBy: { createdAt: "desc" },
            take: 1, // Get latest analysis for each resume
          },
          improvements: {
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
      improvements: {
        include: {
          resume: true,
        },
        orderBy: { createdAt: "desc" },
        take: 10, // Recent improvements
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

  if (!dbUser) {
    // Create user if doesn't exist (fallback)
    redirect("/sign-up");
  }

  return <DashboardContent user={dbUser} />;
}
