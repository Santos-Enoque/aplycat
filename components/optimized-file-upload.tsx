// components/optimized-file-upload.tsx
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, AlertCircle } from 'lucide-react';

interface OptimizedFileUploadProps {
  onAnalysisStarted?: () => void;
}

export function OptimizedFileUpload({ onAnalysisStarted }: OptimizedFileUploadProps) {
  const router = useRouter();
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileToBase64 = useCallback((file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  const processFile = useCallback(async (file: File) => {
    // Validate file
    if (!file.type.includes('pdf')) {
      setError('Please upload a PDF file only');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setIsProcessing(true);

    try {
      // Convert to base64
      const base64Data = await handleFileToBase64(file);
      
      // Store analysis data for immediate processing
      const analysisData = {
        fileName: file.name,
        fileData: base64Data,
        fileSize: file.size,
        mimeType: file.type,
        timestamp: new Date().toISOString(),
      };

      // Store in sessionStorage for immediate analysis
      sessionStorage.setItem('aplycat_resume_data', JSON.stringify(analysisData));

      // Start background processes immediately (don't wait)
      startBackgroundProcesses(analysisData);

      // Navigate immediately to analysis with enhanced loading
      const params = new URLSearchParams({
        fileName: encodeURIComponent(file.name),
        fileSize: file.size.toString(),
        immediate: 'true',
      });

      onAnalysisStarted?.();
      router.push(`/analyze?${params.toString()}`);

    } catch (error) {
      console.error('Error processing file:', error);
      setError('Failed to process file. Please try again.');
      setIsProcessing(false);
    }
  }, [handleFileToBase64, router, onAnalysisStarted]);

  // Background processes that don't block user experience
  const startBackgroundProcesses = async (analysisData: any) => {
    // These run in parallel, user doesn't wait for them
    Promise.allSettled([
      uploadToUploadThing(analysisData),
      saveResumeMetadata(analysisData),
    ]).then(() => {
      console.log('[BACKGROUND] File upload and metadata save completed');
    }).catch((error) => {
      console.error('[BACKGROUND] Background processes failed:', error);
      // Handle gracefully - user experience not affected
    });
  };

  const uploadToUploadThing = async (analysisData: any) => {
    try {
      // Convert base64 back to File for UploadThing
      const byteCharacters = atob(analysisData.fileData);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const file = new File([byteArray], analysisData.fileName, { 
        type: analysisData.mimeType 
      });

      // This would integrate with your UploadThing setup
      // For now, we'll simulate the upload
      console.log('[BACKGROUND] Starting UploadThing upload...');
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('[BACKGROUND] UploadThing upload completed');
      return { success: true, url: 'mock-upload-url' };
    } catch (error) {
      console.error('[BACKGROUND] UploadThing upload failed:', error);
      throw error;
    }
  };

  const saveResumeMetadata = async (analysisData: any) => {
    try {
      console.log('[BACKGROUND] Saving resume metadata...');
      
      const response = await fetch('/api/save-resume-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: analysisData.fileName,
          fileSize: analysisData.fileSize,
          mimeType: analysisData.mimeType,
          // We'll update with real fileUrl once UploadThing completes
          fileUrl: 'pending-upload',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save metadata');
      }

      const result = await response.json();
      console.log('[BACKGROUND] Resume metadata saved:', result.resumeId);
      
      // Store resumeId for later use
      sessionStorage.setItem('aplycat_resume_id', result.resumeId);
      
      return result;
    } catch (error) {
      console.error('[BACKGROUND] Failed to save resume metadata:', error);
      throw error;
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  }, [processFile]);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  if (isProcessing) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="border-2 border-dashed border-purple-300 rounded-lg p-8 text-center bg-purple-50">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full"></div>
            <p className="text-lg font-medium text-purple-900">
              Starting Analysis...
            </p>
            <p className="text-sm text-purple-700">
              Preparing your resume for AI analysis
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <div className="flex-1 text-sm">
            <p className="font-medium text-red-900">Upload Error</p>
            <p className="text-red-700">{error}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={clearFile}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all
          ${isDragOver 
            ? 'border-purple-500 bg-purple-50' 
            : 'border-gray-300 hover:border-purple-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-purple-100 rounded-full">
            <Upload className="w-6 h-6 text-purple-600" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900">
              Drop your resume here
            </p>
            <p className="text-sm text-gray-500 mt-1">
              or click to browse files
            </p>
          </div>

          <Button
            variant="default"
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <FileText className="w-4 h-4 mr-2" />
            Choose PDF File
          </Button>

          <p className="text-xs text-gray-400">
            PDF files only, max 10MB • Analysis starts instantly
          </p>
        </div>

        <input
          id="file-input"
          type="file"
          accept=".pdf"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
}