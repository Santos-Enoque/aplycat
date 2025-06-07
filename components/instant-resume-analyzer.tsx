'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertCircle, Copy, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalysisResult {
  success: boolean;
  analysis?: any;
  fileName?: string;
  processingTimeMs?: number;
  timestamp?: string;
  error?: string;
  raw_response?: string;
}

export function InstantResumeAnalyzer() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
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

  const analyzeResume = async (file: File) => {
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      console.log('[INSTANT] Starting analysis for:', file.name);
      const startTime = Date.now();

      // Convert to base64
      const base64Data = await handleFileToBase64(file);
      
      // Single API call for upload + analysis
      const response = await fetch('/api/analyze-upload-instant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data,
        }),
      });

      const analysisResult: AnalysisResult = await response.json();
      
      const totalTime = Date.now() - startTime;
      console.log(`[INSTANT] Total time: ${totalTime}ms (API: ${analysisResult.processingTimeMs}ms)`);

      if (!response.ok) {
        throw new Error(analysisResult.error || 'Analysis failed');
      }

      setResult(analysisResult);
    } catch (err: any) {
      console.error('[INSTANT] Analysis failed:', err);
      setError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      
      // Validate file
      if (!file.type.includes('pdf')) {
        setError('Please upload a PDF file only');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }

      setSelectedFile(file);
      setError(null);
      analyzeResume(file);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      analyzeResume(file);
    }
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadJSON = () => {
    if (!result) return;
    
    const dataStr = JSON.stringify(result, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resume-analysis-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
  };

  // Show loading during analysis
  if (isAnalyzing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4"></div>
              <h3 className="text-lg font-semibold mb-2">Analyzing Resume...</h3>
              <p className="text-gray-600">
                {selectedFile ? `Processing ${selectedFile.name}` : 'Please wait...'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show results
  if (result) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Analysis Results</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(JSON.stringify(result, null, 2))}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadJSON}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button onClick={reset}>
                  Analyze Another
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h4 className="font-medium text-gray-700">File</h4>
                <p className="text-sm">{result.fileName}</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Processing Time</h4>
                <p className="text-sm">{result.processingTimeMs}ms</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700">Analysis Data (JSON)</h4>
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-auto max-h-96">
                {JSON.stringify(result.analysis, null, 2)}
              </pre>
            </div>

            {result.raw_response && (
              <div className="mt-6">
                <h4 className="font-medium text-gray-700 mb-2">Raw Response (Debug)</h4>
                <pre className="bg-yellow-50 p-4 rounded-lg text-sm overflow-auto max-h-48">
                  {result.raw_response}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error
  if (error) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Error</h3>
                <p className="text-sm">{error}</p>
              </div>
            </div>
            <Button onClick={reset} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // File upload interface
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Instant Resume Analyzer</CardTitle>
          <p className="text-gray-600">Upload your PDF resume for immediate AI analysis</p>
        </CardHeader>
        <CardContent>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors"
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
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
                PDF files only, max 10MB • Analysis happens instantly
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
        </CardContent>
      </Card>
    </div>
  );
}