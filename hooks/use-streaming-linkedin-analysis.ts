"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import {
  LinkedInAnalysis,
  LinkedInAnalysisSchema,
} from "@/lib/schemas/linkedin-analysis-schema";
import { z } from "zod";

const RefusalSchema = z.object({
  error: z.literal("refusal"),
  message: z.string(),
});

export function useStreamingLinkedInAnalysis() {
  const [analysis, setAnalysis] = useState<LinkedInAnalysis | null>(null);
  const [status, setStatus] = useState<
    "idle" | "connecting" | "streaming" | "completed" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  const startLinkedInAnalysis = useCallback(async (profileUrl: string) => {
    setAnalysis(null);
    setError(null);
    setStatus("connecting");
    toast.info("Starting LinkedIn analysis...", { id: "linkedin-analysis" });

    try {
      const response = await fetch("/api/linkedin-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileUrl }),
      });

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(
          `Failed to start analysis: ${response.status} ${errorText}`
        );
      }

      setStatus("streaming");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        try {
          const refusalParse = RefusalSchema.safeParse(JSON.parse(buffer));
          if (refusalParse.success) {
            throw new Error(`Analysis refused: ${refusalParse.data.message}`);
          }
          const parsed = JSON.parse(buffer);
          setAnalysis(parsed);
        } catch (e) {
          // This is expected as the JSON streams in chunks.
        }
      }

      // Sanitize and validate the final JSON object
      try {
        let finalJson = JSON.parse(buffer);

        // Pre-validation: Ensure required arrays exist, as AI might omit them if empty
        if (!finalJson.profile_sections) finalJson.profile_sections = [];
        if (!finalJson.missing_sections) finalJson.missing_sections = [];
        if (
          finalJson.profile_sections &&
          Array.isArray(finalJson.profile_sections)
        ) {
          finalJson.profile_sections.forEach((section: any) => {
            if (!section.good_things) section.good_things = [];
            if (!section.issues_found) section.issues_found = [];
            if (!section.quick_fixes) section.quick_fixes = [];
          });
        }

        const finalParse = LinkedInAnalysisSchema.safeParse(finalJson);
        if (!finalParse.success) {
          console.error(
            "Final validation failed even after sanitization:",
            finalParse.error.flatten()
          );
          console.error("Original buffer from AI:", buffer);
          throw new Error("The final analysis data was invalid.");
        }

        setAnalysis(finalParse.data);
        setStatus("completed");
        toast.success("LinkedIn analysis complete!", {
          id: "linkedin-analysis",
        });
      } catch (err) {
        if (err instanceof SyntaxError) {
          console.error("Final JSON from AI was malformed:", buffer);
          throw new Error("Failed to parse the response from the AI.");
        }
        // Re-throw validation errors
        throw err;
      }
    } catch (err: any) {
      console.error("Streaming analysis failed:", err);
      setError(err.message || "An unknown error occurred.");
      setStatus("error");
      toast.error("Analysis failed", {
        id: "linkedin-analysis",
        description: err.message,
      });
    }
  }, []);

  return { analysis, status, error, startLinkedInAnalysis };
} 