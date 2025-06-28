'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { ResumeAnalysis } from '@/types/analysis';
import { backgroundProcessor } from '@/lib/background-processor';
import { streamingAutoSave } from '@/lib/streaming-auto-save';
import { useAuth } from '@clerk/nextjs';
// import * as Sentry from '@sentry/nextjs';

interface StreamingChunk {
  type: 'partial_analysis' | 'complete_analysis' | 'error' | 'metadata';
  data?: Partial<ResumeAnalysis>;
  error?: string;
  timestamp: string;
  progress?: number;
}

export type StreamingStatus = 'idle' | 'connecting' | 'streaming' | 'completed' | 'error';

export interface UseStreamingAnalysisReturn {
  analysis: Partial<ResumeAnalysis> | null;
  status: StreamingStatus;
  isStreaming: boolean;
  isComplete: boolean;
  progress: number;
  error: string | null;
  startAnalysis: (file: File) => Promise<void>;
  stopAnalysis: () => void;
  retryAnalysis: () => void;
  resetAnalysis: () => void;
  recoverFromCheckpoint: (resumeId: string) => Promise<any>;
  hasRecoverableState: boolean;
}

export function useStreamingAnalysis(): UseStreamingAnalysisReturn {
  const { userId } = useAuth();
  
  const [analysis, setAnalysis] = useState<Partial<ResumeAnalysis> | null>(() => {
    if (typeof window === 'undefined') return null;
    const saved = sessionStorage.getItem('streamingAnalysis');
    return saved ? JSON.parse(saved) : null;
  });
  const [status, setStatus] = useState<StreamingStatus>(() => {
    if (typeof window === 'undefined') return 'idle';
    return (sessionStorage.getItem('streamingAnalysisStatus') as StreamingStatus) || 'idle';
  });
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    return Number(sessionStorage.getItem('streamingAnalysisProgress')) || 0;
  });
  const [hasRecoverableState, setHasRecoverableState] = useState<boolean>(false);

  const lastFile = useRef<File | null>(null);
  const currentResumeId = useRef<string | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const saveAttemptedRef = useRef<boolean>(false);

  // Function to save analysis results to database
  const saveAnalysisToDatabase = useCallback(async (analysisData: any, file: File | null) => {
    if (!analysisData || !file) {
      console.warn('[useStreamingAnalysis] Missing data for saving analysis');
      return;
    }

    // Prevent multiple save attempts for the same analysis
    if (saveAttemptedRef.current) {
      console.log('[useStreamingAnalysis] Analysis save already attempted, skipping');
      return;
    }
    
    saveAttemptedRef.current = true;

    try {
      // Get resume ID from session storage if available
      const uploadThingResumeId = sessionStorage.getItem('aplycat_uploadthing_resume_id');
      const fallbackResumeId = sessionStorage.getItem('aplycat_fallback_resume_id');
      const resumeId = uploadThingResumeId || fallbackResumeId;

      const savePayload = {
        fileName: file.name,
        analysisData: analysisData,
        resumeId: resumeId || undefined,
        overallScore: analysisData.overallScore || 0,
        atsScore: analysisData.atsScore || 0,
        scoreCategory: analysisData.scoreCategory || 'Unknown',
        mainRoast: analysisData.mainRoast || 'No roast available',
        creditsUsed: 1 // Default credit cost for analysis
      };

      console.log('[useStreamingAnalysis] Saving analysis to database...', savePayload);

      const response = await fetch('/api/save-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(savePayload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[useStreamingAnalysis] Analysis saved successfully:', result);
        
        // Store the analysis ID for future reference
        if (result.analysisId) {
          sessionStorage.setItem('aplycat_last_analysis_id', result.analysisId);
        }
      } else {
        const error = await response.text();
        console.error('[useStreamingAnalysis] Failed to save analysis:', error);
      }
    } catch (error) {
      console.error('[useStreamingAnalysis] Error saving analysis:', error);
    }
  }, []);

  // Enhanced auto-save function with background processing
  const autoSaveProgress = useCallback(async (partialAnalysis: any, progressValue: number) => {
    if (!userId || !currentResumeId.current) return;

    try {
      // Queue background auto-save (non-blocking)
      await backgroundProcessor.saveAnalysisProgress({
        resumeId: currentResumeId.current,
        userId,
        progress: progressValue / 100,
        partialAnalysis,
        status: progressValue >= 100 ? 'COMPLETED' : 'IN_PROGRESS',
      });
    } catch (error) {
      console.error('[useStreamingAnalysis] Auto-save failed:', error);
      // Don't throw - auto-save should be resilient
    }
  }, [userId]);

  // Recovery function to check for existing checkpoints
  const recoverFromCheckpoint = useCallback(async (resumeId: string) => {
    if (!userId) return null;

    try {
      const checkpoint = await streamingAutoSave.recoverAnalysisState(resumeId, userId);
      
      if (checkpoint && checkpoint.status === 'IN_PROGRESS') {
        // Restore state from checkpoint
        setAnalysis(checkpoint.partialAnalysis);
        setProgress(checkpoint.progress * 100);
        setStatus('streaming');
        currentResumeId.current = resumeId;
        
        // Update session storage for backward compatibility
        sessionStorage.setItem('streamingAnalysis', JSON.stringify(checkpoint.partialAnalysis));
        sessionStorage.setItem('streamingAnalysisProgress', (checkpoint.progress * 100).toString());
        sessionStorage.setItem('streamingAnalysisStatus', 'streaming');
        
        return checkpoint;
      }
      return null;
    } catch (error) {
      console.error('[useStreamingAnalysis] Recovery failed:', error);
      return null;
    }
  }, [userId]);

  // Check for recoverable state on mount
  useEffect(() => {
    if (userId) {
      const checkRecoverableState = async () => {
        const uploadThingResumeId = sessionStorage.getItem('aplycat_uploadthing_resume_id');
        const fallbackResumeId = sessionStorage.getItem('aplycat_fallback_resume_id');
        const resumeId = uploadThingResumeId || fallbackResumeId;
        
        if (resumeId) {
          const checkpoint = await streamingAutoSave.recoverAnalysisState(resumeId, userId);
          setHasRecoverableState(
            checkpoint !== null && 
            checkpoint.status === 'IN_PROGRESS' && 
            checkpoint.progress < 1.0
          );
        }
      };
      
      checkRecoverableState();
    }
  }, [userId]);

  // Set up periodic auto-save during streaming
  useEffect(() => {
    if (status === 'streaming' && analysis && userId) {
      // Clear any existing interval
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
      
      // Set up auto-save every 10 seconds
      autoSaveIntervalRef.current = setInterval(() => {
        autoSaveProgress(analysis, progress);
      }, 10000);
    } else {
      // Clear interval when not streaming
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
    }

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [status, analysis, progress, userId, autoSaveProgress]);

  useEffect(() => {
    if (status === 'idle' && analysis) {
       const savedStatus = sessionStorage.getItem('streamingAnalysisStatus') as StreamingStatus;
       if(savedStatus && savedStatus !== 'idle') {
         setStatus(savedStatus);
       }
    }
  }, [status, analysis]);

  useEffect(() => {
    if (analysis) {
      sessionStorage.setItem('streamingAnalysis', JSON.stringify(analysis));
    }
    sessionStorage.setItem('streamingAnalysisStatus', status);
    sessionStorage.setItem('streamingAnalysisProgress', progress.toString());
  }, [analysis, status, progress]);

  const resetAnalysis = useCallback(() => {
    setAnalysis(null);
    setStatus('idle');
    setError(null);
    setProgress(0);
    setHasRecoverableState(false);
    saveAttemptedRef.current = false; // Reset save flag
    
    // Clear session storage
    sessionStorage.removeItem('streamingAnalysis');
    sessionStorage.removeItem('streamingAnalysisStatus');
    sessionStorage.removeItem('streamingAnalysisProgress');
    
    // Clear auto-save interval
    if (autoSaveIntervalRef.current) {
      clearInterval(autoSaveIntervalRef.current);
      autoSaveIntervalRef.current = null;
    }
    
    // Cancel streaming
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    // Mark checkpoint as cancelled in background
    if (userId && currentResumeId.current) {
      backgroundProcessor.saveAnalysisProgress({
        resumeId: currentResumeId.current,
        userId,
        progress: 0,
        partialAnalysis: {},
        status: 'CANCELLED',
      });
    }
    
    currentResumeId.current = null;
  }, [userId]);

  const startAnalysis = useCallback(async (file: File) => {
    lastFile.current = file;
    setStatus('connecting');
    setError(null);
    setAnalysis(null);
    setProgress(0);
    saveAttemptedRef.current = false; // Reset save flag for new analysis

    // Get or generate resume ID for tracking
    const uploadThingResumeId = sessionStorage.getItem('aplycat_uploadthing_resume_id');
    const fallbackResumeId = sessionStorage.getItem('aplycat_fallback_resume_id');
    currentResumeId.current = uploadThingResumeId || fallbackResumeId;

    // Initialize checkpoint if user is authenticated
    if (userId && currentResumeId.current) {
      await backgroundProcessor.saveAnalysisProgress({
        resumeId: currentResumeId.current,
        userId,
        progress: 0,
        partialAnalysis: {},
        status: 'IN_PROGRESS',
      });
    }

    abortControllerRef.current = new AbortController();

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/analyze-resume-stream', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
      });

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
          // Final check on the buffer in case the last chunk was incomplete
          if (buffer.trim()) {
            try {
              const finalData = JSON.parse(buffer);
              setAnalysis(finalData);
              setProgress(100);
              
              // Save analysis to database when completed
              saveAnalysisToDatabase(finalData, lastFile.current);
            } catch (e) {
              console.error('[useStreamingAnalysis] Error parsing final buffer:', e);
            }
          }
          setStatus('completed');
          break;
        }

        // Dummy progress calculation
        setProgress(p => Math.min(99, p + 5));

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
                const data = JSON.parse(jsonStr);
                
                // The backend now sends the partial/complete analysis object directly
                const updatedAnalysis = { ...analysis, ...data };
                setAnalysis(prev => ({ ...prev, ...data }));
                
                // If this appears to be a complete analysis, save it
                if (data.overallScore !== undefined && data.atsScore !== undefined && data.mainRoast) {
                  console.log('[useStreamingAnalysis] Complete analysis detected in stream, saving...');
                  saveAnalysisToDatabase(updatedAnalysis, lastFile.current);
                }
              }
            } catch (e) {
              console.error('[useStreamingAnalysis] Error parsing stream data:', e, "Received:", message);
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
        console.log('[useStreamingAnalysis] Analysis stopped by user.');
        setStatus('idle');
      } else {
        // Sentry.captureException(err, {
        //   extra: {
        //     errorMessage,
        //     context: "useStreamingAnalysis catch block",
        //   },
        // });
        console.error('[useStreamingAnalysis] Error:', errorMessage);
        setError(errorMessage);
        setStatus('error');
      }
    }
  }, [userId]);

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
    progress,
    error,
    startAnalysis,
    stopAnalysis,
    retryAnalysis,
    resetAnalysis,
    recoverFromCheckpoint,
    hasRecoverableState,
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