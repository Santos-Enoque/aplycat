"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileUploader } from "@/components/file-uploader";
import { FileText, Clock, Plus, Zap, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface DashboardUser {
  improvedResumes: Array<{
    id: string;
    targetRole: string;
    targetIndustry: string;
    isTailored: boolean;
    createdAt: Date;
  }>;
}

interface NewDashboardContentProps {
  user: DashboardUser;
}

export function NewDashboardContent({ user }: NewDashboardContentProps) {
  const router = useRouter();

  const handleFileSelected = async (file: File) => {
    toast.info("Preparing your resume analysis...", {
      description: "You will be redirected shortly.",
    });

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      sessionStorage.setItem(
        "streamingAnalysisFile",
        JSON.stringify({
          fileName: file.name,
          fileData: base64,
        })
      );
      router.push("/improve"); // Go directly to improve flow
    };
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      toast.error("Could not read the selected file.", {
        description: "Please try a different file or refresh the page.",
      });
    };
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Your Resume Dashboard
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          Start by uploading your resume to get an AI-powered analysis and
          improvement.
        </p>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-purple-600" />
            Analyze a New Resume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FileUploader
            onFileSelect={handleFileSelected}
            prompt="Upload your resume to start"
          />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Past Improvements
        </h2>
        {user.improvedResumes && user.improvedResumes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {user.improvedResumes.map((resume) => (
              <Card key={resume.id} className="flex flex-col">
                <CardHeader>
                  <CardTitle className="text-base">
                    {resume.targetRole}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {resume.targetIndustry}
                  </p>
                </CardHeader>
                <CardContent className="flex-grow">
                  <div className="flex items-center text-sm text-gray-500 mb-4">
                    <Clock className="h-4 w-4 mr-2" />
                    {formatDistanceToNow(new Date(resume.createdAt), {
                      addSuffix: true,
                    })}
                  </div>
                  {resume.isTailored && (
                    <Badge variant="secondary">
                      <Zap className="h-3 w-3 mr-1" />
                      Tailored
                    </Badge>
                  )}
                </CardContent>
                <div className="p-4 border-t">
                  <Button
                    onClick={() => router.push(`/resumes/${resume.id}`)}
                    className="w-full"
                    variant="outline"
                  >
                    View & Edit
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900">
                No improvements yet
              </h3>
              <p className="text-gray-600 mt-2">
                Analyze your first resume to see your improvements here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
