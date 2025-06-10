'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface AnonymousStreamingChunk {
  type: 'rate_limit' | 'complete' | 'error';
  data?: any;
  error?: string;
  timestamp: string;
}

export type AnonymousStreamingStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error' | 'rate_limited';

export interface UseAnonymousStreamingAnalysisReturn {
  analysis: any | null;
  status: AnonymousStreamingStatus;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  rateLimit: { remaining: number; resetTime: string } | null;
  startAnalysis: (file: File) => Promise<void>;
  stopAnalysis: () => void;
  retryAnalysis: () => void;
}

export function useAnonymousStreamingAnalysis(): UseAnonymousStreamingAnalysisReturn {
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [status, setStatus] = useState<AnonymousStreamingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<{ remaining: number; resetTime: string } | null>(null);

  const lastFile = useRef<File | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback(async (file: File) => {
    lastFile.current = file;
    setStatus('connecting');
    setError(null);
    setAnalysis(null);
    setRateLimit(null);

    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze-resume-free-stream', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

      // Check for rate limit error
      if (response.status === 429) {
        const errorData = await response.json();
        setError(errorData.message);
        setStatus('rate_limited');
        setRateLimit({
          remaining: 0,
          resetTime: errorData.resetTime
        });
        return;
      }

      if (!response.ok || !response.body) {
        const errorText = await response.text();
        throw new Error(`Failed to start analysis: ${response.status} ${errorText}`);
      }
      
      setStatus('streaming');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        if (abortControllerRef.current.signal.aborted) {
          reader.cancel();
          break;
        }

        const { done, value } = await reader.read();
        if (done) {
          setStatus('completed');
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process all complete event messages in the buffer
        const eventMessages = buffer.split('\n\n');
        
        // The last part of the buffer might be an incomplete message, so we keep it.
        buffer = eventMessages.pop() || '';

        for (const message of eventMessages) {
          if (message.startsWith('data:')) {
            try {
              const jsonStr = message.substring(5).trim();
              if (jsonStr) {
                const chunk: AnonymousStreamingChunk = JSON.parse(jsonStr);
                
                switch (chunk.type) {
                  case 'rate_limit':
                    if (chunk.data) {
                      setRateLimit({
                        remaining: chunk.data.remaining,
                        resetTime: chunk.data.resetTime
                      });
                    }
                    break;
                    
                  case 'complete':
                    if (chunk.data) {
                      setAnalysis(chunk.data);
                      setStatus('completed');
                    }
                    break;
                    
                  case 'error':
                    throw new Error(chunk.error || 'Analysis failed');
                    
                  default:
                    // Handle streaming data updates
                    if (chunk.data) {
                      setAnalysis(chunk.data);
                    }
                    break;
                }
              }
            } catch (e) {
              console.error('[useAnonymousStreamingAnalysis] Error parsing stream data:', e, "Received:", message);
              // Don't throw, just log and continue, as it might be a partial chunk
            }
          } else if (message.startsWith('event: error')) {
            try {
              const jsonStr = message.split('\n')[1]?.substring(5).trim();
              if(jsonStr) {
                const errorData = JSON.parse(jsonStr);
                throw new Error(errorData.error || 'Unknown stream error');
              }
            } catch(e) {
               throw new Error('Could not parse error event from stream.');
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      if (errorMessage === 'The operation was aborted.') {
        console.log('[useAnonymousStreamingAnalysis] Analysis stopped by user.');
        setStatus('idle');
      } else {
        Sentry.captureException(err, {
          extra: {
            errorMessage,
            context: "useAnonymousStreamingAnalysis catch block",
          },
        });
        console.error('[useAnonymousStreamingAnalysis] Error:', errorMessage);
        setError(errorMessage);
        setStatus('error');
      }
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const retryAnalysis = useCallback(() => {
    if (lastFile.current) {
      startAnalysis(lastFile.current);
    }
  }, [startAnalysis]);

  return {
    analysis,
    status,
    isStreaming: status === 'streaming',
    isComplete: status === 'completed',
    error,
    rateLimit,
    startAnalysis,
    stopAnalysis,
    retryAnalysis,
  };
} 