import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { type UserEssentials } from "@/lib/actions/dashboard-actions";

interface DashboardHeaderProps {
  user: UserEssentials;
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const t = useTranslations("dashboard.header");

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
              {t("welcomeBack", { displayName })}
            </h1>
            <p className="text-gray-600 mt-1">{t("makeBetter")}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-sm text-gray-500">{t("credits")}</div>
              <div className="text-xl font-semibold text-gray-900">
                {user.credits}
              </div>
              {user.isPremium && (
                <div className="text-xs text-purple-600 font-medium">
                  {t("premium")}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Link href="/analyze-direct">
                <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                  {t("directAnalysis")}
                </Button>
              </Link>
              <Link href="/analyze">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  {t("standardAnalysis")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
