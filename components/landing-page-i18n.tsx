"use client";

import React, { useState, useRef, useCallback } from "react";
import { useTranslations } from 'next-intl';
import {
  Award,
  CheckCircle,
  Star,
  Target,
  TrendingUp,
  Upload,
  Zap,
  X,
  Clock,
  Users,
  Sparkles,
  FileText,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SignInButton } from "@clerk/nextjs";
import { useDropzone } from "react-dropzone";
import { AiResumeGeneratorPreview, HonestFeedbackPreview, JobTailoringPreview, LinkedInPreview } from "./feature-previews";

// Trial Popup Component
const TrialPopup = ({ isOpen, onClose, onAccept }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAccept: () => void; 
}) => {
  const t = useTranslations('landingPage.trial');
  const [timeLeft, setTimeLeft] = useState("23:59:42");

  React.useEffect(() => {
    if (!isOpen) return;
    
    const timer = setInterval(() => {
      const now = new Date();
      const hours = String(23 - now.getHours() % 24).padStart(2, '0');
      const minutes = String(59 - now.getMinutes()).padStart(2, '0');
      const seconds = String(59 - now.getSeconds()).padStart(2, '0');
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 relative animate-in slide-in-from-bottom-4 duration-300">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-full text-sm font-bold mb-4">
            <Sparkles className="h-4 w-4" />
            {t('limitedOffer')}
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h2>
          <p className="text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {/* Value Proposition */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-lg font-bold text-gray-900">{t('creditsIncluded')}</span>
            <span className="text-2xl font-bold text-green-600">{t('value')}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t('feature1')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t('feature2')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t('feature3')}</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>{t('feature4')}</span>
            </div>
          </div>
        </div>

        {/* Urgency */}
        <div className="flex items-center justify-center gap-2 text-red-600 font-semibold mb-6">
          <Clock className="h-5 w-5" />
          <span>{t('expiresIn')} {timeLeft}</span>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={onAccept}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 text-lg font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            {t('ctaButton')}
          </Button>
          <Button 
            onClick={onClose}
            variant="ghost" 
            className="w-full text-gray-600 hover:text-gray-800"
          >
            {t('maybeLater')}
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          {t('guarantee')}
        </p>
      </div>
    </div>
  );
};

// Free Upload Component
const FreeResumeUpload = ({ onAnalysisComplete }: { onAnalysisComplete: (result: any) => void }) => {
  const t = useTranslations('landingPage.hero');
  const tAnalyzing = useTranslations('landingPage.analyzing');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsAnalyzing(true);
    setUploadProgress(0);

    // Simulate progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target?.result as string;
        
        // Call your free analysis API
        const response = await fetch('/api/analyze-resume-free', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: file.name,
            fileData: base64Data,
          }),
        });

        const result = await response.json();
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        setTimeout(() => {
          onAnalysisComplete(result);
          setIsAnalyzing(false);
        }, 500);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Analysis failed:', error);
      setIsAnalyzing(false);
      clearInterval(progressInterval);
    }
  }, [onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    disabled: isAnalyzing,
  });

  return (
    <div className="max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive 
            ? 'border-green-500 bg-green-50 scale-105' 
            : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
          }
          ${isAnalyzing ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {!isAnalyzing ? (
          <>
            <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <Upload className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t('dropResume')}
            </h3>
            <p className="text-lg text-gray-600 mb-4">
              {t('analysisDesc')}
            </p>
            <p className="text-sm text-gray-500">
              {t('fileFormats')}
            </p>
            <Button className="mt-6 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-semibold">
              {t('clickToBrowse')}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <div className="w-20 h-20 mx-auto bg-green-500 rounded-full flex items-center justify-center animate-pulse">
              <Zap className="h-10 w-10 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {tAnalyzing('title')}
              </h3>
              <p className="text-gray-600">{tAnalyzing('description')}</p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{Math.round(uploadProgress)}{tAnalyzing('complete')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Analysis Results Component
const AnalysisResults = ({ analysis, onUpgrade }: { analysis: any; onUpgrade: () => void }) => {
  const t = useTranslations('landingPage.results');
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Score Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('overallScore')}</p>
                <p className="text-4xl font-bold text-blue-600">{analysis.overall_score}</p>
              </div>
              <div className="text-blue-500">
                <Target className="h-12 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">{t('atsScore')}</p>
                <p className="text-4xl font-bold text-purple-600">{analysis.ats_score}</p>
              </div>
              <div className="text-purple-500">
                <FileText className="h-12 w-12" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Roast */}
      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-600 flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t('honestFeedback')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg text-red-700 font-medium italic">
            "{analysis.main_roast}"
          </p>
        </CardContent>
      </Card>

      {/* Top Issues */}
      <Card>
        <CardHeader>
          <CardTitle>{t('topIssues')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analysis.top_issues?.slice(0, 3).map((issue: any, index: number) => (
              <div key={index} className="border-l-4 border-l-yellow-500 pl-4">
                <h4 className="font-semibold text-gray-900">{issue.issue}</h4>
                <p className="text-sm text-gray-600 mt-1">{issue.fix}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade CTA */}
      <Card className="bg-gradient-to-r from-green-500 to-emerald-600 text-white">
        <CardContent className="p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">{t('upgradeTitle')}</h3>
          <p className="text-lg mb-6 opacity-90">
            {t('upgradeDesc')}
          </p>
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="text-center">
              <p className="text-3xl font-bold">10</p>
              <p className="text-sm opacity-80">Credits</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">$8.30</p>
              <p className="text-sm opacity-80">Value</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">$1</p>
              <p className="text-sm opacity-80">Limited Time</p>
            </div>
          </div>
          <Button 
            onClick={onUpgrade}
            className="bg-white text-green-600 hover:bg-gray-100 px-8 py-4 text-lg font-bold rounded-xl"
          >
            {t('upgradeBtn')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Main Landing Page Component
export function LandingPageI18n() {
  const t = useTranslations('landingPage');
  const tHero = useTranslations('landingPage.hero');
  const tTestimonials = useTranslations('landingPage.testimonials');
  const tFeatures = useTranslations('landingPage.features');
  const tHowItWorks = useTranslations('landingPage.howItWorks');
  const tPricing = useTranslations('landingPage.pricing');
  const tFinalCta = useTranslations('landingPage.finalCta');
  
  const [showTrialPopup, setShowTrialPopup] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [currentView, setCurrentView] = useState<'upload' | 'results'>('upload');

  const handleAnalysisComplete = (result: any) => {
    setAnalysisResult(result);
    setCurrentView('results');
    
    // Show trial popup after 3 seconds of viewing results
    setTimeout(() => {
      setShowTrialPopup(true);
    }, 3000);
  };

  const handleTrialAccept = () => {
    setShowTrialPopup(false);
    // Redirect to payment/signup
    window.location.href = '/signup?trial=true';
  };

  return (
    <>
      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold">
            🚀 <span className="font-bold">LIMITED TIME:</span> Try ALL AI Features for Just $1 • 10 Credits Worth $8.30
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              🎁 {tHero('freeAnalysis')}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              {tHero('title')} <span className="text-red-600">Brutally Roasted</span>
              <br className="hidden md:block" />
              <span className="text-green-600">{tHero('subtitle')}</span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto">
              {tHero('description')}
            </p>
          </div>

          {/* Upload or Results */}
          {currentView === 'upload' ? (
            <FreeResumeUpload onAnalysisComplete={handleAnalysisComplete} />
          ) : (
            <AnalysisResults 
              analysis={analysisResult} 
              onUpgrade={() => setShowTrialPopup(true)} 
            />
          )}

          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-8 text-sm text-gray-600 mt-12">
            <div className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-green-500" />
              <span className="font-semibold">{tTestimonials('analyzed')}</span>
            </div>
            <div className="flex items-center">
              <Star className="h-5 w-5 mr-2 text-yellow-400" />
              <span className="font-semibold">{tTestimonials('rating')}</span>
            </div>
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-500" />
              <span className="font-semibold">{tTestimonials('interviews')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rest of the component sections would continue here with translations... */}
      
      {/* Trial Popup */}
      <TrialPopup 
        isOpen={showTrialPopup}
        onClose={() => setShowTrialPopup(false)}
        onAccept={handleTrialAccept}
      />
    </>
  );
}