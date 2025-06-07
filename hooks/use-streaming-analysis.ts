'use client';

import { useState, useCallback, useRef } from 'react';
import { ResumeAnalysis } from '@/types/analysis';

interface StreamingChunk {
  type: 'partial_analysis' | 'complete_analysis' | 'error' | 'metadata';
  data?: Partial<ResumeAnalysis>;
  error?: string;
  timestamp: string;
  progress?: number;
}

interface UseStreamingAnalysisReturn {
  analysis: Partial<ResumeAnalysis> | null;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  progress: number;
  startAnalysis: (fileData: string, fileName: string) => Promise<void>;
  stopAnalysis: () => void;
  retryAnalysis: () => Promise<void>;
}

export function useStreamingAnalysis(): UseStreamingAnalysisReturn {
  const [analysis, setAnalysis] = useState<Partial<ResumeAnalysis> | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Store current request details for retry functionality
  const currentRequestRef = useRef<{ fileData: string; fileName: string } | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startAnalysis = useCallback(async (fileData: string, fileName: string) => {
    // Store request details for retry
    currentRequestRef.current = { fileData, fileName };
    
    // Reset state
    setIsStreaming(true);
    setIsComplete(false);
    setError(null);
    setAnalysis(null);
    setProgress(0);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      console.log('[STREAMING_HOOK] Starting analysis for:', fileName);
      
      const response = await fetch('/api/analyze-resume-stream', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ fileData, fileName }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No reader available for streaming response');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      
      console.log('[STREAMING_HOOK] Starting to read stream...');
      
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('[STREAMING_HOOK] Stream completed');
          break;
        }
        
        // Decode chunk and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // Process complete lines from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: StreamingChunk = JSON.parse(line);
              console.log(`[STREAMING_HOOK] Received chunk: ${data.type}`);
              
              switch (data.type) {
                case 'partial_analysis':
                  if (data.data) {
                    setAnalysis(prev => ({ ...prev, ...data.data }));
                    setProgress(data.progress || 0);
                    console.log('[STREAMING_HOOK] Updated partial analysis');
                  }
                  break;
                  
                case 'complete_analysis':
                  if (data.data) {
                    setAnalysis(data.data as ResumeAnalysis);
                    setProgress(100);
                    setIsComplete(true);
                    setIsStreaming(false);
                    console.log('[STREAMING_HOOK] Analysis completed');
                  }
                  break;
                  
                case 'error':
                  setError(data.error || 'Unknown streaming error');
                  setIsStreaming(false);
                  setIsComplete(false);
                  console.error('[STREAMING_HOOK] Stream error:', data.error);
                  break;
                  
                default:
                  console.log('[STREAMING_HOOK] Unknown chunk type:', data.type);
              }
            } catch (parseError) {
              console.warn('[STREAMING_HOOK] Failed to parse chunk:', line, parseError);
            }
          }
        }
      }
      
      // If we reach here without completion, something went wrong
      if (!isComplete && !error) {
        setError('Analysis stream ended unexpectedly');
        setIsStreaming(false);
      }
      
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('[STREAMING_HOOK] Analysis was cancelled');
        setError('Analysis was cancelled');
      } else {
        console.error('[STREAMING_HOOK] Analysis error:', err);
        setError(err instanceof Error ? err.message : 'Analysis failed');
      }
      setIsStreaming(false);
      setIsComplete(false);
    } finally {
      // Clean up
      abortControllerRef.current = null;
    }
  }, []);

  const stopAnalysis = useCallback(() => {
    console.log('[STREAMING_HOOK] Stopping analysis...');
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setIsStreaming(false);
    setError('Analysis was stopped');
  }, []);

  const retryAnalysis = useCallback(async () => {
    console.log('[STREAMING_HOOK] Retrying analysis...');
    
    if (currentRequestRef.current) {
      const { fileData, fileName } = currentRequestRef.current;
      await startAnalysis(fileData, fileName);
    } else {
      setError('No previous request to retry');
    }
  }, [startAnalysis]);

  return {
    analysis,
    isStreaming,
    isComplete,
    error,
    progress,
    startAnalysis,
    stopAnalysis,
    retryAnalysis,
  };
}

// Additional hook for managing multiple streaming analyses
export function useMultipleStreamingAnalyses() {
  const [analyses, setAnalyses] = useState<Map<string, Partial<ResumeAnalysis>>>(new Map());
  const [statuses, setStatuses] = useState<Map<string, {
    isStreaming: boolean;
    isComplete: boolean;
    error: string | null;
    progress: number;
  }>>(new Map());

  const startAnalysis = useCallback(async (id: string, fileData: string, fileName: string) => {
    // Set initial status
    setStatuses(prev => new Map(prev.set(id, {
      isStreaming: true,
      isComplete: false,
      error: null,
      progress: 0,
    })));

    try {
      const response = await fetch('/api/analyze-resume-stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileData, fileName }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No reader available');

      const decoder = new TextDecoder();
      let buffer = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data: StreamingChunk = JSON.parse(line);
              
              switch (data.type) {
                case 'partial_analysis':
                  if (data.data) {
                    setAnalyses(prev => {
                      const newMap = new Map(prev);
                      const existing = newMap.get(id) || {};
                      newMap.set(id, { ...existing, ...data.data });
                      return newMap;
                    });
                    setStatuses(prev => {
                      const newMap = new Map(prev);
                      const existing = newMap.get(id) || { isStreaming: true, isComplete: false, error: null, progress: 0 };
                      newMap.set(id, { ...existing, progress: data.progress || 0 });
                      return newMap;
                    });
                  }
                  break;
                  
                case 'complete_analysis':
                  if (data.data) {
                    setAnalyses(prev => new Map(prev.set(id, data.data as ResumeAnalysis)));
                    setStatuses(prev => new Map(prev.set(id, {
                      isStreaming: false,
                      isComplete: true,
                      error: null,
                      progress: 100,
                    })));
                  }
                  break;
                  
                case 'error':
                  setStatuses(prev => new Map(prev.set(id, {
                    isStreaming: false,
                    isComplete: false,
                    error: data.error || 'Unknown error',
                    progress: 0,
                  })));
                  break;
              }
            } catch (parseError) {
              console.warn('Failed to parse chunk:', line);
            }
          }
        }
      }
    } catch (error) {
      setStatuses(prev => new Map(prev.set(id, {
        isStreaming: false,
        isComplete: false,
        error: error instanceof Error ? error.message : 'Analysis failed',
        progress: 0,
      })));
    }
  }, []);

  const getAnalysis = useCallback((id: string) => analyses.get(id) || null, [analyses]);
  const getStatus = useCallback((id: string) => statuses.get(id) || {
    isStreaming: false,
    isComplete: false,
    error: null,
    progress: 0,
  }, [statuses]);

  const removeAnalysis = useCallback((id: string) => {
    setAnalyses(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
    setStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  }, []);

  return {
    startAnalysis,
    getAnalysis,
    getStatus,
    removeAnalysis,
    analysisIds: Array.from(analyses.keys()),
  };
}