import { Card, CardContent } from "@/components/ui/card";
import { type DashboardStats } from "@/lib/actions/dashboard-actions";
import { useTranslations } from "next-intl";

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const t = useTranslations("dashboard.stats");

  const statCards = [
    {
      title: t("resumesUploaded"),
      value: stats.totalResumes,
      icon: "📄",
      description: t("totalResumes"),
    },
    {
      title: t("analysesCompleted"),
      value: stats.totalAnalyses,
      icon: "📊",
      description: t("resumeAnalysesDone"),
    },
    {
      title: t("improvementsMade"),
      value: stats.totalImprovements,
      icon: "✨",
      description: t("resumeImprovementsGenerated"),
    },
    {
      title: t("creditsAvailable"),
      value: stats.currentCredits,
      icon: "💎",
      description: t("creditsReadyToUse"),
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => (
        <Card
          key={index}
          className="bg-white hover:shadow-md transition-shadow"
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">
                  {stat.title}
                </p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </div>
              <div className="text-2xl">{stat.icon}</div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
