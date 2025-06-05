"use client";

import { useResumes } from "@/hooks/use-dashboard-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FileText,
  Upload,
  Calendar,
  BarChart3,
  Eye,
  Download,
  Trash2,
  AlertTriangle,
  Plus,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { useState } from "react";

export function CachedResumesPage() {
  const { data: resumesData, isLoading, error, isError } = useResumes();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (isLoading) {
    return <ResumesLoadingSkeleton />;
  }

  if (isError || !resumesData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Failed to load resumes
            </h3>
            <p className="text-gray-600">
              {error?.message || "Please try refreshing the page"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { resumes, total } = resumesData;

  const handleDelete = async (resumeId: string) => {
    if (deletingId) return;

    setDeletingId(resumeId);
    try {
      // TODO: Implement delete functionality with optimistic updates
      console.log("Delete resume:", resumeId);
      // For now, just simulate loading
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error("Failed to delete resume:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            My Resumes
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your resumes and track their analysis performance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-blue-100 text-blue-800">
            {total} {total === 1 ? "resume" : "resumes"}
          </Badge>
          <Link href="/upload">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Upload Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Resumes Grid */}
      {resumes.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {resumes.map((resume) => (
            <Card key={resume.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                      {resume.title || resume.fileName}
                    </CardTitle>
                    {resume.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {resume.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        Uploaded{" "}
                        {formatDistanceToNow(new Date(resume.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* File Info */}
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-700">
                        {resume.fileName}
                      </span>
                    </div>
                    {resume.fileSize && (
                      <span className="text-xs text-gray-500">
                        {(resume.fileSize / 1024).toFixed(1)} KB
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      href={`/analyze?resumeId=${
                        resume.id
                      }&fileName=${encodeURIComponent(resume.fileName)}`}
                      className="flex-1"
                    >
                      <Button
                        size="sm"
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <BarChart3 className="h-4 w-4 mr-1" />
                        Analyze
                      </Button>
                    </Link>
                    <div className="flex gap-2 flex-1">
                      {resume.fileUrl && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          asChild
                        >
                          <a
                            href={resume.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </a>
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleDelete(resume.id)}
                        disabled={deletingId === resume.id}
                      >
                        {deletingId === resume.id ? (
                          <div className="h-4 w-4 mr-1 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-1" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No resumes yet
            </h3>
            <p className="text-gray-600 mb-6">
              Upload your first resume to get started with AI-powered analysis
              and improvements!
            </p>
            <Link href="/upload">
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                Upload Your First Resume
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ResumesLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                  <Skeleton className="h-8 flex-1" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
