import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useTranslations } from "next-intl";
import { type RecentActivity } from "@/lib/actions/dashboard-actions";

interface DashboardRecentActivityProps {
  activity: RecentActivity;
}

export function DashboardRecentActivity({
  activity,
}: DashboardRecentActivityProps) {
  const t = useTranslations("dashboard.recentActivity");
  const { recentAnalyses, recentImprovements } = activity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Recent Analyses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            {t("recentAnalyses")}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {recentAnalyses.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t("noActivity")}</p>
              <p className="text-sm mt-1">{t("startByUploading")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentAnalyses.map((analysis) => (
                <div
                  key={analysis.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 truncate">
                        {analysis.resume.fileName}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(analysis.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {analysis.overallScore}
                        </div>
                        <div className="text-xs text-gray-500">
                          {t("overall")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {analysis.atsScore}
                        </div>
                        <div className="text-xs text-gray-500">{t("ats")}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Improvements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">
            {t("recentImprovements")}
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {recentImprovements.length}
          </Badge>
        </CardHeader>
        <CardContent>
          {recentImprovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>{t("noActivity")}</p>
              <p className="text-sm mt-1">{t("startByUploading")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentImprovements.map((improvement) => (
                <div
                  key={improvement.id}
                  className="flex items-center justify-between py-3 border-b last:border-b-0"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 truncate">
                      {improvement.versionName || improvement.targetRole}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {formatDistanceToNow(new Date(improvement.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    {improvement.improvedScore && (
                      <>
                        <div className="text-sm font-semibold text-green-600">
                          {improvement.improvedScore}
                        </div>
                        <div className="text-xs text-gray-500">Score</div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
