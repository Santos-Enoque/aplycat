"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { ResumeAnalysis } from "@/types/analysis";
import type { ModelFileInput } from "@/lib/models";

interface ImprovementJobDetails {
  analysis: ResumeAnalysis;
  originalFile: ModelFileInput;
  targetRole?: string;
  targetIndustry?: string;
}

export default function ImproveV2Page() {
  const router = useRouter();
  const [jobDetails, setJobDetails] = useState<ImprovementJobDetails | null>(
    null
  );
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [isImproving, setIsImproving] = useState(false);

  useEffect(() => {
    const storedDetails = sessionStorage.getItem("improvementJobDetails");
    if (storedDetails) {
      setJobDetails(JSON.parse(storedDetails));
    } else {
      // Handle case where there are no details, maybe redirect
      toast.error("Could not find analysis details. Please try again.");
      router.push("/dashboard");
    }
  }, [router]);

  const handleStart = () => {
    if (!targetRole.trim() || !targetIndustry.trim()) {
      toast.error("Both fields are required.", {
        description: "Please specify your target role and industry.",
      });
      return;
    }
    if (!jobDetails) {
      toast.error("Could not find analysis details. Please try again.");
      return;
    }

    setIsImproving(true);

    const updatedJobDetails: ImprovementJobDetails = {
      ...jobDetails,
      targetRole,
      targetIndustry,
    };

    sessionStorage.setItem(
      "improvementJobDetails",
      JSON.stringify(updatedJobDetails)
    );
    router.push("/improve");
  };

  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-lg">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Sparkles className="text-purple-500 h-6 w-6" />
              Improve Your Resume
            </CardTitle>
            <CardDescription>
              Tell us your goal, and our AI will rewrite your resume to match
              it.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6">
              <div className="space-y-2">
                <Label htmlFor="target-role">Target Role</Label>
                <Input
                  id="target-role"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g., Senior Software Engineer"
                  className="py-6 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target-industry">Industry</Label>
                <Input
                  id="target-industry"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  placeholder="e.g., Tech / SaaS"
                  className="py-6 text-base"
                />
              </div>
              <Button
                type="button"
                onClick={handleStart}
                disabled={
                  isImproving || !targetRole.trim() || !targetIndustry.trim()
                }
                className="w-full py-6"
              >
                {isImproving ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                Start Improvement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
