import { Button } from "@/components/ui/button";
import Link from "next/link";
import { type UserEssentials } from "@/lib/actions/dashboard-actions";

interface DashboardHeaderProps {
  user: UserEssentials;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const displayName =
    user.firstName && user.lastName
      ? `${user.firstName} ${user.lastName}`
      : user.firstName || user.email;

  return (
    <div className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {displayName}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              Let's make your resume even better today
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">Credits</div>
              <div className="text-xl font-semibold text-gray-900">
                {user.credits}
              </div>
              {user.isPremium && (
                <div className="text-xs text-purple-600 font-medium">
                  Premium ✨
                </div>
              )}
            </div>
            <Link href="/analyze">
              <Button className="bg-purple-600 hover:bg-purple-700">
                Analyze Resume
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
