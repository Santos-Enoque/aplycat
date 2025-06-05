import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { type RecentActivity } from "@/lib/actions/dashboard-actions";

interface DashboardRecentActivityProps {
  activity: RecentActivity;
}

export function DashboardRecentActivity({
  activity,
}: DashboardRecentActivityProps) {
  const { recentAnalyses, recentImprovements } = activity;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Recent Analyses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Recent Analyses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentAnalyses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No analyses yet.</p>
              <Link
                href="/analyze"
                className="text-purple-600 hover:text-purple-700 font-medium"
              >
                Create your first analysis →
              </Link>
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
                        <div className="text-xs text-gray-500">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm font-semibold text-gray-900">
                          {analysis.atsScore}
                        </div>
                        <div className="text-xs text-gray-500">ATS</div>
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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ✨ Recent Improvements
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentImprovements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No improvements yet.</p>
              <p className="text-sm">
                Analyze a resume first to unlock improvements!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentImprovements.map((improvement) => (
                <div
                  key={improvement.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {improvement.versionName || "Improved Resume"}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {improvement.resume.fileName}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(improvement.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    {improvement.originalScore && improvement.improvedScore && (
                      <div className="text-center ml-4">
                        <div className="text-sm font-semibold text-green-600">
                          +
                          {improvement.improvedScore -
                            improvement.originalScore}
                        </div>
                        <div className="text-xs text-gray-500">
                          {improvement.originalScore} →{" "}
                          {improvement.improvedScore}
                        </div>
                      </div>
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
