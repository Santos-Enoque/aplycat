// components/resume-customization.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare,
  FileText,
  Send,
  Loader2,
  Sparkles,
  Target,
  Building,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
} from 'lucide-react';

interface ResumeCustomizationProps {
  currentResume: any;
  targetRole: string;
  targetIndustry: string;
  onResumeUpdate: (updatedResume: any) => void;
  onTailoredResume: (tailoredData: any) => void;
}

export function ResumeCustomization({ 
  currentResume, 
  targetRole, 
  targetIndustry, 
  onResumeUpdate,
  onTailoredResume 
}: ResumeCustomizationProps) {
  const [userFeedback, setUserFeedback] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTailoring, setIsTailoring] = useState(false);
  const [activeTab, setActiveTab] = useState<'feedback' | 'tailor'>('feedback');

  const handleUpdateResume = async () => {
    if (!userFeedback.trim()) return;

    setIsUpdating(true);
    try {
      const response = await fetch('/api/update-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentResume,
          userFeedback,
          targetRole,
          targetIndustry,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update resume');
      }

      onResumeUpdate(result.updatedResume);
      setUserFeedback('');
    } catch (error: any) {
      console.error('Error updating resume:', error);
      alert('Failed to update resume. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleTailorResume = async () => {
    if (!jobDescription.trim()) return;

    setIsTailoring(true);
    try {
      const response = await fetch('/api/tailor-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentResume,
          jobDescription,
          includeCoverLetter,
          companyName: companyName.trim() || undefined,
          jobTitle: jobTitle.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to tailor resume');
      }

      onTailoredResume(result);
    } catch (error: any) {
      console.error('Error tailoring resume:', error);
      alert('Failed to tailor resume. Please try again.');
    } finally {
      setIsTailoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('feedback')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            activeTab === 'feedback'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Update with Feedback
        </button>
        <button
          onClick={() => setActiveTab('tailor')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-all ${
            activeTab === 'tailor'
              ? 'bg-white text-purple-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Target className="h-4 w-4" />
          Tailor to Job
        </button>
      </div>

      {/* Feedback Tab */}
      {activeTab === 'feedback' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <MessageSquare className="h-5 w-5" />
              Update Resume with Your Feedback
            </CardTitle>
            <p className="text-sm text-gray-600">
              Tell us what you'd like to change, add, or improve on your resume
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your feedback and suggestions:
              </label>
              <textarea
                value={userFeedback}
                onChange={(e) => setUserFeedback(e.target.value)}
                placeholder="e.g., 'Add more emphasis on Python programming skills', 'Include my recent AWS certification', 'Make the summary more focused on data analytics', 'Add metrics to my marketing achievements'..."
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                disabled={isUpdating}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  Be specific about what you want to change or improve
                </p>
                <span className="text-xs text-gray-400">
                  {userFeedback.length}/500
                </span>
              </div>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Current Target: {targetRole} in {targetIndustry}
              </h4>
              <p className="text-xs text-blue-700">
                Updates will maintain optimization for your target role
              </p>
            </div>

            <Button
              onClick={handleUpdateResume}
              disabled={!userFeedback.trim() || isUpdating}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isUpdating ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating Resume...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  <span>Update Resume</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tailor Tab */}
      {activeTab === 'tailor' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Target className="h-5 w-5" />
              Tailor Resume to Job Description
            </CardTitle>
            <p className="text-sm text-gray-600">
              Customize your resume for a specific job posting
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Job Details */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g., Google, Microsoft, Acme Corp"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isTailoring}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Job Title (Optional)
                </label>
                <input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g., Senior Data Analyst"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  disabled={isTailoring}
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Job Description *
              </label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the complete job description here, including requirements, responsibilities, and qualifications..."
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                disabled={isTailoring}
              />
              <p className="text-xs text-gray-500 mt-1">
                Include the full job posting for best results
              </p>
            </div>

            {/* Cover Letter Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-gray-600" />
                <div>
                  <h4 className="font-medium text-gray-900">Include Cover Letter</h4>
                  <p className="text-sm text-gray-600">Generate a tailored cover letter with your resume</p>
                </div>
              </div>
              <button
                onClick={() => setIncludeCoverLetter(!includeCoverLetter)}
                disabled={isTailoring}
                className="flex items-center"
              >
                {includeCoverLetter ? (
                  <ToggleRight className="h-6 w-6 text-purple-600" />
                ) : (
                  <ToggleLeft className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>

            <Button
              onClick={handleTailorResume}
              disabled={!jobDescription.trim() || isTailoring}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isTailoring ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Tailoring Resume...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Tailor Resume{includeCoverLetter ? ' + Cover Letter' : ''}</span>
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}