"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Download,
  Wand2,
  ListChecks,
  Lightbulb,
  UserCheck,
} from "lucide-react";
import { LinkedInRegeneration } from "@/lib/schemas/linkedin-regeneration-schema";
import { toast } from "sonner";
import { LinkedInAnalysis } from "@/lib/schemas/linkedin-analysis-schema";

interface ImprovementContext {
  analysis: LinkedInAnalysis;
  profileUrl: string;
  timestamp: number;
}

// Editable Text Component (similar to resume page)
const EditableText = ({
  value,
  onEdit,
  multiline = false,
  className = "",
  placeholder = "Click to edit",
}: {
  value: string;
  onEdit: (newValue: string) => void;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const editableRef = useRef<HTMLDivElement>(null);

  const handleFocus = () => {
    setIsEditing(true);
    setTimeout(() => {
      if (editableRef.current) {
        editableRef.current.focus();
        const range = document.createRange();
        range.selectNodeContents(editableRef.current);
        const selection = window.getSelection();
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }, 0);
  };

  const handleBlur = () => {
    if (editableRef.current) {
      onEdit(editableRef.current.innerText);
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={editableRef}
      contentEditable
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`p-2 rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:bg-gray-50 ${
        isEditing ? "bg-white ring-2 ring-blue-500" : "bg-transparent"
      } ${className}`}
      dangerouslySetInnerHTML={{ __html: value }}
    />
  );
};

export default function LinkedInImprovementPage() {
  const router = useRouter();
  const [context, setContext] = useState<ImprovementContext | null>(null);
  const [regeneration, setRegeneration] = useState<LinkedInRegeneration | null>(
    null
  );
  const [editableContent, setEditableContent] =
    useState<LinkedInRegeneration | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "streaming" | "completed" | "error"
  >("idle");

  // Load context from sessionStorage on mount
  useEffect(() => {
    const storedContext = sessionStorage.getItem("linkedinImprovementContext");
    if (storedContext) {
      try {
        const parsedContext: ImprovementContext = JSON.parse(storedContext);
        setContext(parsedContext);
      } catch (e) {
        toast.error("Could not load analysis data. Redirecting...");
        router.push("/linkedin");
      }
    } else {
      toast.error("No analysis data found. Redirecting...");
      router.push("/linkedin");
    }
  }, [router]);

  // Fetch regeneration data when context is loaded
  useEffect(() => {
    if (context && status === "idle") {
      const fetchRegeneration = async () => {
        setStatus("loading");
        toast.info("The Profile Architect is crafting your new profile...");
        try {
          const response = await fetch("/api/linkedin-regeneration", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              analysis: context.analysis,
              originalProfileText: "", // We send empty as the API has mock data for now
            }),
          });

          if (!response.ok || !response.body) {
            throw new Error("Failed to start profile regeneration.");
          }

          setStatus("streaming");
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            try {
              const parsed = JSON.parse(buffer);
              setRegeneration(parsed);
              setEditableContent(parsed);
            } catch (e) {
              // Buffering...
            }
          }

          setStatus("completed");
          toast.success("Your new profile is ready!");
        } catch (err: any) {
          setStatus("error");
          toast.error("Failed to generate profile", {
            description: err.message,
          });
        }
      };
      fetchRegeneration();
    }
  }, [context, status]);

  const handleEdit = (field: string, newValue: string) => {
    if (!editableContent) return;

    // A simple edit handler for top-level string fields
    const updatedContent = { ...editableContent };
    const fieldPath = field.split(".");

    if (fieldPath.length === 2) {
      (updatedContent as any)[fieldPath[0]][fieldPath[1]] = newValue;
    }
    setEditableContent(updatedContent);
  };

  const handleDownloadActionPlan = () => {
    if (!regeneration) return;

    const {
      improvementsOverview,
      recommendedSkills,
      finalInstructionsForUser,
    } = regeneration;

    let plan = `LinkedIn Improvement Action Plan\n`;
    plan += `=================================\n\n`;
    plan += `OVERVIEW: ${improvementsOverview.headline}\n`;
    plan += `${improvementsOverview.summary}\n\n`;

    plan += `RECOMMENDED SKILLS:\n`;
    plan += `---------------------\n`;
    plan += `${recommendedSkills.top10Skills.join(", ")}\n`;
    plan += `Note: ${recommendedSkills.explanation}\n\n`;

    plan += `FINAL INSTRUCTIONS FOR YOU:\n`;
    plan += `---------------------------\n`;
    finalInstructionsForUser.forEach((instruction, i) => {
      plan += `${i + 1}. ${instruction}\n`;
    });

    const blob = new Blob([plan], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "linkedin-action-plan.txt";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Action plan downloaded!");
  };

  if (status !== "completed" || !editableContent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <Wand2 className="w-12 h-12 text-blue-600 mx-auto animate-pulse" />
          <h1 className="mt-4 text-2xl font-bold text-gray-800">
            AI Architect at Work
          </h1>
          <p className="mt-2 text-gray-600">
            Rewriting your profile for maximum impact...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-900">
              Your New Profile
            </h1>
            <Button variant="outline" onClick={() => router.push("/linkedin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Analysis
            </Button>
          </div>

          {/* Headline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCheck className="mr-2 text-blue-600" />
                Rewritten Headline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EditableText
                value={editableContent.rewrittenHeadline.newContent}
                onEdit={(v) => handleEdit("rewrittenHeadline.newContent", v)}
                className="text-xl font-bold"
              />
              <div className="text-sm text-gray-500 mt-2">
                {editableContent.rewrittenHeadline.keyChanges.join(" • ")}
              </div>
            </CardContent>
          </Card>

          {/* About Section */}
          <Card>
            <CardHeader>
              <CardTitle>Rewritten "About" Section</CardTitle>
            </CardHeader>
            <CardContent>
              <EditableText
                value={editableContent.rewrittenAbout.newContent}
                onEdit={(v) => handleEdit("rewrittenAbout.newContent", v)}
                multiline
                className="prose prose-blue max-w-none"
              />
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Rewritten Experience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editableContent.rewrittenExperience.map((exp, i) => (
                <div key={i} className="border-b pb-4 last:border-b-0">
                  <h3 className="font-bold">{exp.title}</h3>
                  <p className="text-sm text-gray-600">{exp.company}</p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    {exp.newAchievements.map((ach, j) => (
                      <li key={j} className="text-gray-800">
                        {ach}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar - Action Plan */}
        <div className="lg:col-span-1 space-y-6">
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ListChecks className="mr-2 text-green-600" />
                  Your Action Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  {editableContent.improvementsOverview.summary}
                </p>
                <Button className="w-full" onClick={handleDownloadActionPlan}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Full Action Plan
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="mr-2 text-yellow-500" />
                  Top 10 Recommended Skills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {editableContent.recommendedSkills.top10Skills.map(
                    (skill) => (
                      <Badge key={skill} variant="secondary">
                        {skill}
                      </Badge>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
