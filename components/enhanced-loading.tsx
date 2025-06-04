"use client";

import { useState, useEffect } from "react";
import { Brain, Zap, Target, CheckCircle, Star } from "lucide-react";

interface EnhancedLoadingProps {
  title: string;
  type: "analysis" | "improvement";
  fileName?: string;
  targetRole?: string;
  targetIndustry?: string;
}

export function EnhancedLoading({
  title,
  type,
  fileName,
  targetRole,
  targetIndustry,
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
    let stepTimer: NodeJS.Timeout;
    let messageTimer: NodeJS.Timeout;

    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    let elapsed = 0;

    const updateStep = () => {
      if (currentStep < steps.length - 1) {
        elapsed += steps[currentStep].duration;
        if (elapsed < totalDuration) {
          setCurrentStep((prev) => prev + 1);
          stepTimer = setTimeout(
            updateStep,
            steps[currentStep + 1]?.duration || 5000
          );
        }
      }
    };

    const updateMessage = () => {
      setCurrentMessage((prev) => (prev + 1) % encouragingMessages.length);
      messageTimer = setTimeout(updateMessage, 4000 + Math.random() * 2000);
    };

    stepTimer = setTimeout(updateStep, steps[0].duration);
    messageTimer = setTimeout(updateMessage, 4000);

    return () => {
      clearTimeout(stepTimer);
      clearTimeout(messageTimer);
    };
  }, [currentStep, steps, encouragingMessages.length]);

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

        {/* Current Step */}
        <div className="mb-8">
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
        </div>

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
