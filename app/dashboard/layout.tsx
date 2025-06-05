import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Auth is now handled by middleware - no need for double checks
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main>{children}</main>
    </div>
  );
}
