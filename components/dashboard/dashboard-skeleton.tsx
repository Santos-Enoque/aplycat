"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-lg shadow p-6 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-8 w-8 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-1 space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-gray-50 mb-4">
                <div className="text-center">
                  <div className="h-8 w-8 bg-gray-200 rounded mx-auto mb-3"></div>
                  <div className="h-5 bg-gray-200 rounded w-48 mx-auto mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-32 mx-auto mb-4"></div>
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="h-10 bg-gray-200 rounded w-full"
                  ></div>
                ))}
              </div>
            </div>

            {/* Account Overview Card */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex justify-between items-center">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>
              <div className="h-10 bg-gray-200 rounded w-full mt-4"></div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Resumes Card */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-48 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Analyses Card */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-40 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-64 mb-2"></div>
                      <div className="flex items-center gap-4">
                        <div className="h-3 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-20"></div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="h-6 bg-gray-200 rounded w-12 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-10"></div>
                      </div>
                      <div className="text-center">
                        <div className="h-6 bg-gray-200 rounded w-12 mb-1"></div>
                        <div className="h-3 bg-gray-200 rounded w-8"></div>
                      </div>
                      <div className="h-8 w-8 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Improvements Card */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
              <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="h-5 bg-gray-200 rounded w-36 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-56 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 bg-gray-200 rounded w-16"></div>
                      <div className="h-8 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Transactions Card */}
            <div className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-44 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="text-right">
                      <div className="h-4 bg-gray-200 rounded w-8 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
