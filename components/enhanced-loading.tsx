"use client";

import { useState, useEffect } from "react";
import { Brain, Zap, Target, CheckCircle, Star } from "lucide-react";

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "in-progress" | "completed" | "error";
  timestamp?: Date;
}

interface EnhancedLoadingProps {
  title: string;
  type: "analysis" | "improvement";
  fileName?: string;
  targetRole?: string;
  targetIndustry?: string;
  realTimeSteps?: ProgressStep[];
  apiLogs?: string[];
}

export function EnhancedLoading({
  title,
  type,
  fileName,
  targetRole,
  targetIndustry,
  realTimeSteps = [],
  apiLogs = [],
}: EnhancedLoadingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [currentMessage, setCurrentMessage] = useState(0);
  const [progress, setProgress] = useState(0);

  const analysisSteps = [
    {
      icon: "📄",
      title: "Reading Your Resume",
      description: "Parsing every section with precision",
      duration: 8000,
    },
    {
      icon: "🧠",
      title: "AI Analysis in Progress",
      description: "Examining content quality and structure",
      duration: 15000,
    },
    {
      icon: "🔍",
      title: "Identifying Issues",
      description: "Finding areas for improvement",
      duration: 12000,
    },
    {
      icon: "📊",
      title: "Calculating Scores",
      description: "Evaluating ATS compatibility",
      duration: 8000,
    },
    {
      icon: "✨",
      title: "Generating Roasts",
      description: "Preparing brutally honest feedback",
      duration: 10000,
    },
  ];

  const improvementSteps = [
    {
      icon: "🎯",
      title: "Understanding Requirements",
      description: `Analyzing ${targetRole} role requirements`,
      duration: 8000,
    },
    {
      icon: "🏭",
      title: "Industry Research",
      description: `Researching ${targetIndustry} industry standards`,
      duration: 10000,
    },
    {
      icon: "🔄",
      title: "Content Optimization",
      description: "Rewriting sections for maximum impact",
      duration: 15000,
    },
    {
      icon: "🤖",
      title: "ATS Optimization",
      description: "Ensuring robot-friendly formatting",
      duration: 10000,
    },
    {
      icon: "🎨",
      title: "Final Polish",
      description: "Adding finishing touches",
      duration: 8000,
    },
  ];

  const floatingEmojis = [
    "🐱",
    "💼",
    "📄",
    "✨",
    "🚀",
    "💪",
    "🎯",
    "🔥",
    "💡",
    "⭐",
    "🏆",
    "📈",
    "💯",
    "🎉",
    "⚡",
    "🌟",
  ];

  const encouragingMessages = [
    "Hang tight! Our AI cat is working its magic 🐱✨",
    "Good things take time... and your resume is worth it! 💼",
    "Almost there! Quality analysis takes patience 🎯",
    "The AI is being extra thorough just for you 🔍",
    "Brewing the perfect feedback... ☕",
    "Your future employer will thank you for this wait! 🙏",
    "Excellence is in progress... 🌟",
    "The AI is putting on its reading glasses 👓",
    "Crafting insights that actually matter 💡",
    "This level of analysis usually costs $200+ 💰",
  ];

  const steps = type === "analysis" ? analysisSteps : improvementSteps;

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 100;
        // Smooth progress with occasional pauses to feel more realistic
        const increment = Math.random() > 0.3 ? Math.random() * 2 + 0.5 : 0;
        return Math.min(prev + increment, 100);
      });
    }, 500);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    let messageTimer: NodeJS.Timeout;

    // Update message rotation
    const updateMessage = () => {
      setCurrentMessage((prev) => (prev + 1) % encouragingMessages.length);
      messageTimer = setTimeout(updateMessage, 4000 + Math.random() * 2000);
    };

    messageTimer = setTimeout(updateMessage, 4000);

    return () => {
      clearTimeout(messageTimer);
    };
  }, [encouragingMessages.length]);

  // Update progress based on real-time steps
  useEffect(() => {
    if (realTimeSteps.length > 0) {
      const completedSteps = realTimeSteps.filter(
        (step) => step.status === "completed"
      ).length;
      const inProgressSteps = realTimeSteps.filter(
        (step) => step.status === "in-progress"
      ).length;
      const totalSteps = realTimeSteps.length;

      if (totalSteps > 0) {
        const progressPercentage =
          ((completedSteps + inProgressSteps * 0.5) / totalSteps) * 100;
        setProgress(Math.min(progressPercentage, 95)); // Cap at 95% until fully complete

        // Set current step to the first in-progress or pending step
        const activeStepIndex = realTimeSteps.findIndex(
          (step) => step.status === "in-progress" || step.status === "pending"
        );
        if (activeStepIndex !== -1) {
          setCurrentStep(activeStepIndex);
        }
      }
    }
  }, [realTimeSteps]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Floating Emojis */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingEmojis.map((emoji, index) => (
          <div
            key={index}
            className="absolute text-2xl opacity-20 animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}
          >
            {emoji}
          </div>
        ))}
      </div>

      {/* Main Loading Card */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 relative overflow-hidden">
        {/* Progress Bar Background */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gray-200">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce">
            {steps[currentStep]?.icon}
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          {fileName && (
            <p className="text-sm text-gray-600">Processing: {fileName}</p>
          )}
        </div>

        {/* Real-time Steps or Default Steps */}
        <div className="mb-8">
          {realTimeSteps.length > 0 ? (
            <>
              {/* Real-time Progress */}
              <div className="space-y-3 mb-6">
                {realTimeSteps.map((step, index) => (
                  <div key={step.id} className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        step.status === "completed"
                          ? "bg-green-100"
                          : step.status === "in-progress"
                          ? "bg-purple-100"
                          : step.status === "error"
                          ? "bg-red-100"
                          : "bg-gray-100"
                      }`}
                    >
                      {step.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : step.status === "in-progress" ? (
                        <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse" />
                      ) : step.status === "error" ? (
                        <span className="text-red-600">✕</span>
                      ) : (
                        <div className="w-4 h-4 bg-gray-400 rounded-full" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-semibold ${
                          step.status === "completed"
                            ? "text-green-900"
                            : step.status === "in-progress"
                            ? "text-purple-900"
                            : step.status === "error"
                            ? "text-red-900"
                            : "text-gray-700"
                        }`}
                      >
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {step.description}
                      </p>
                      {step.timestamp && (
                        <p className="text-xs text-gray-500">
                          {step.timestamp.toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              {/* Default Step Display */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-purple-600 rounded-full animate-pulse" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">
                    {steps[currentStep]?.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {steps[currentStep]?.description}
                  </p>
                </div>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-2 mb-6">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`flex-1 h-2 rounded-full transition-all duration-500 ${
                      index <= currentStep
                        ? "bg-gradient-to-r from-purple-500 to-blue-500"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        {/* API Logs Section */}
        {apiLogs.length > 0 && (
          <div className="mb-6">
            <div className="bg-gray-900 rounded-lg p-4 max-h-32 overflow-y-auto">
              <div className="space-y-1">
                {apiLogs.slice(-5).map((log, index) => (
                  <div key={index} className="text-xs font-mono text-green-400">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Encouraging Message */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-center text-gray-700 font-medium animate-fade-in">
            {encouragingMessages[currentMessage]}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-purple-600">
              {Math.round(progress)}%
            </div>
            <div className="text-xs text-gray-600">Complete</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-blue-600">
              {currentStep + 1}/{steps.length}
            </div>
            <div className="text-xs text-gray-600">Steps</div>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="text-lg font-bold text-green-600">
              {Math.max(15, 60 - Math.round(progress * 0.6))}s
            </div>
            <div className="text-xs text-gray-600">Est. Time</div>
          </div>
        </div>

        {/* Bottom Message */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            ✨ Pro tip: Quality analysis takes time, but it's worth the wait!
          </p>
        </div>
      </div>
    </div>
  );
}
