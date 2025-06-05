import { Card, CardContent } from "@/components/ui/card";
import { type DashboardStats } from "@/lib/actions/dashboard-actions";

interface DashboardStatsProps {
  stats: DashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Resumes Uploaded",
      value: stats.totalResumes,
      icon: "📄",
      description: "Total resumes in your account",
    },
    {
      title: "Analyses Completed",
      value: stats.totalAnalyses,
      icon: "📊",
      description: "Resume analyses done",
    },
    {
      title: "Improvements Made",
      value: stats.totalImprovements,
      icon: "✨",
      description: "Resume improvements generated",
    },
    {
      title: "Credits Available",
      value: stats.currentCredits,
      icon: "💎",
      description: "Credits ready to use",
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
