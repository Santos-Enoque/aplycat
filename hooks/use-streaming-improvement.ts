"use client";

import { useState, useCallback, useEffect } from 'react';
import type { ModelFileInput } from "@/lib/models";
import * as Sentry from '@sentry/nextjs';

// Updated interface to match the actual API response
interface ImprovedResumeResponse {
  personalInfo?: {
    name: string;
    email: string;
    phone: string;
    location: string;
    linkedin?: string;
    website?: string;
  };
  professionalSummary?: string;
  experience?: Array<{
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    achievements: string[];
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string;
    achievements: string[];
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    year: string;
    details?: string;
  }>;
  skills?: {
    technical: string[];
    certifications: string[];
    languages: string[];
    methodologies: string[];
  };
  improvementsAnalysis?: {
    originalResumeEffectivenessEstimateForTarget: string;
    targetOptimizedResumeScore: string;
    analysisHeadline: string;
    keyRevisionsImplemented: string[];
    recommendationsForUser: string[];
  };
}

type StreamingStatus = 'idle' | 'streaming' | 'completed' | 'error';

// Helper for deep merging objects, essential for combining streaming JSON chunks.
const isObject = (item: any): item is Record<string, any> => {
  return (item && typeof item === 'object' && !Array.isArray(item));
};

const deepMerge = <T extends Record<string, any>>(target: T, source: Partial<T>): T => {
  const output = { ...target };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      const sourceKey = key as keyof T;
      if (isObject(source[sourceKey]) && target[sourceKey]) {
        output[sourceKey] = deepMerge(target[sourceKey] as Record<string, any>, source[sourceKey] as Record<string, any>) as T[keyof T];
      } else if (Array.isArray(source[sourceKey]) && Array.isArray(target[sourceKey])) {
        // Simple array merge: assumes arrays of primitives or replaces entirely.
        // For more complex array merging (e.g., of objects by ID), a more sophisticated strategy would be needed.
        output[sourceKey] = [...(target[sourceKey] as any[]), ...(source[sourceKey] as any[])] as T[keyof T];
      }
      else {
        output[sourceKey] = source[sourceKey] as T[keyof T];
      }
    });
  }

  return output;
};

export interface UseStreamingImprovementReturn {
  improvement: Partial<ImprovedResumeResponse> | null;
  status: StreamingStatus;
  error: string | null;
  startImprovement: (
    originalFile: ModelFileInput,
    targetRole: string,
    targetIndustry: string
  ) => Promise<void>;
}

export function useStreamingImprovement(): UseStreamingImprovementReturn {
  const [improvement, setImprovement] = useState<Partial<ImprovedResumeResponse> | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem('streamingImprovement');
    return saved ? JSON.parse(saved) : null;
  });
  const [status, setStatus] = useState<StreamingStatus>(() => {
    if (typeof window === 'undefined') return 'idle';
    return (sessionStorage.getItem('streamingImprovementStatus') as StreamingStatus) || 'idle';
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'idle' && improvement) {
      const savedStatus = sessionStorage.getItem('streamingImprovementStatus') as StreamingStatus;
      if (savedStatus && savedStatus !== 'idle') {
        setStatus(savedStatus);
      }
    }
  }, [status, improvement]);

  useEffect(() => {
    if (improvement) {
      sessionStorage.setItem('streamingImprovement', JSON.stringify(improvement));
    }
    sessionStorage.setItem('streamingImprovementStatus', status);
  }, [improvement, status]);

  const startImprovement = useCallback(
    async (
      originalFile: ModelFileInput,
      targetRole: string,
      targetIndustry: string
    ) => {
      setStatus('streaming');
      setError(null);
      setImprovement(null);

      try {
        const response = await fetch('/api/improve-resume-stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ originalFile, targetRole, targetIndustry }),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          throw new Error(
            `Failed to start improvement: ${response.status} ${errorText}`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            console.log('[useStreamingImprovement] Stream finished.');
            // Process any final data left in the buffer.
            if (buffer.startsWith('data:')) {
               const jsonStr = buffer.substring(5).trim();
               if (jsonStr) {
                 try {
                   const dataChunk = JSON.parse(jsonStr);
                   console.log('[useStreamingImprovement] Merging final chunk:', dataChunk);
                   setImprovement(prev => deepMerge(prev || {}, dataChunk));
                 } catch (e) {
                   console.error('[useStreamingImprovement] Error parsing final stream chunk:', e, 'Received:', jsonStr);
                 }
               }
            }
            setStatus('completed');
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          let boundary;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const message = buffer.substring(0, boundary);
            buffer = buffer.substring(boundary + 2);

            if (message.startsWith('data:')) {
              const jsonStr = message.substring(5).trim();
              if (jsonStr) {
                try {
                  const dataChunk = JSON.parse(jsonStr);
                  console.log('[useStreamingImprovement] Merging chunk:', dataChunk);
                  setImprovement(prev => deepMerge(prev || {}, dataChunk));
                } catch (e) {
                  console.error('[useStreamingImprovement] Error parsing stream chunk:', e, 'Received:', jsonStr);
                }
              }
            }
          }
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unknown error occurred';
        Sentry.captureException(err, {
          extra: {
            errorMessage,
            context: "useStreamingImprovement catch block",
          },
        });
        console.error('[useStreamingImprovement] Error:', errorMessage);
        setError(errorMessage);
        setStatus('error');
      }
    },
    []
  );

  return { improvement, status, error, startImprovement };
} 