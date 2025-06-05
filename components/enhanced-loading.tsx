"use client";

import { useState, useEffect } from "react";
import { FileText, Clock } from "lucide-react";

interface EnhancedLoadingProps {
  title: string;
  type: "analysis" | "improvement" | "tailoring" | "general";
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
  const [seconds, setSeconds] = useState(0);
  const [currentJoke, setCurrentJoke] = useState(0);

  const cvJokes = [
    "While we wait... there's a guy that says Microsoft was his top skill... damn 💀",
    "Fun fact: Someone once listed 'breathing' as a skill... technically not wrong 🫁",
    "Meanwhile... a recruiter just read 'I'm a people person' for the 1000th time today 😴",
    "Plot twist: Someone put their horoscope sign under 'Technical Skills' ♈",
    "Breaking news: Another resume claims 15 years of React experience... React is 11 years old 📅",
    "Somewhere out there: A CV lists 'Google' as a programming language 🔍",
    "Reality check: 'I work well under pressure' = 'I procrastinate everything' ⏰",
    "True story: Someone wrote 'I have excellent attention to detial' 🤦‍♂️",
    "Meanwhile... another cover letter starts with 'To Whom It May Concern' in 2024 📧",
    "Fun observation: 'Team player' appears on 99% of resumes but team sports on 2% 🏆",
    "Quick fact: If everyone was 'results-driven', we'd have solved world hunger by now 🌍",
    "Gentle reminder: Your font choice says more about you than your achievements 🔤",
    "Hot take: 'I'm a fast learner' usually means 'I don't know this yet' 🎓",
    "Reality: Someone just listed 'Adobe' without specifying which of the 50+ products 🎨",
    "Confession: A recruiter once got a resume written entirely in Comic Sans... they hired them 😂",
    "Truth bomb: 'Proficient in Office' used to be impressive... in 1995 💼",
    "Plot twist: The best CV ever had a typo in the header 📝",
    "Fun fact: 'I'm passionate about...' followed by the most boring job description ever 🔥",
    "Reality check: Someone's greatest achievement was 'improved efficiency by 300%'... of what? 📊",
    "Breaking: Another person claims to be 'fluent' in a language they learned on Duolingo 🦉",
  ];

  const encouragingMessages = [
    "Our AI is reading every single word... carefully 🤖",
    "Quality analysis takes time, but it's worth it! 💎",
    "The AI is putting on its best reading glasses 👓",
    "We're being extra thorough just for you ✨",
    "Good things come to those who wait... and yours is coming! 🚀",
    "Almost there! Excellence can't be rushed 🎯",
    "The AI is having deep thoughts about your career 🧠",
    "Brewing the perfect feedback... ☕",
  ];

  const [currentEncouragement, setCurrentEncouragement] = useState(0);

  useEffect(() => {
    // Seconds counter
    const secondsTimer = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(secondsTimer);
  }, []);

  useEffect(() => {
    // Rotate jokes every 4 seconds
    const jokesTimer = setInterval(() => {
      setCurrentJoke((prev) => (prev + 1) % cvJokes.length);
    }, 4000);

    return () => clearInterval(jokesTimer);
  }, [cvJokes.length]);

  useEffect(() => {
    // Rotate encouragement every 6 seconds
    const encouragementTimer = setInterval(() => {
      setCurrentEncouragement(
        (prev) => (prev + 1) % encouragingMessages.length
      );
    }, 6000);

    return () => clearInterval(encouragementTimer);
  }, [encouragingMessages.length]);

  const getTypeIcon = () => {
    switch (type) {
      case "analysis":
        return "🔍";
      case "improvement":
        return "✨";
      case "tailoring":
        return "🎯";
      default:
        return "⚡";
    }
  };

  const getTypeDescription = () => {
    switch (type) {
      case "analysis":
        return "Analyzing your resume with AI precision";
      case "improvement":
        return `Optimizing for ${targetRole || "your target role"}`;
      case "tailoring":
        return "Tailoring your resume for this specific job";
      default:
        return "Processing your request";
    }
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-50 to-white backdrop-blur-sm flex items-center justify-center p-4 z-50">
      {/* Floating elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(8)].map((_, index) => (
          <div
            key={index}
            className="absolute text-4xl opacity-10 animate-float text-blue-300"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${4 + Math.random() * 3}s`,
            }}
          >
            {index % 2 === 0 ? "📄" : "💼"}
          </div>
        ))}
      </div>

      {/* Main Loading Card */}
      <div className="bg-white rounded-xl shadow-xl border border-blue-100 p-8 max-w-lg w-full mx-4 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-pulse">{getTypeIcon()}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-sm text-blue-600 font-medium">
            {getTypeDescription()}
          </p>
          {fileName && (
            <p className="text-xs text-gray-500 mt-2">File: {fileName}</p>
          )}
        </div>

        {/* Time Counter */}
        <div className="flex items-center justify-center gap-2 mb-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
          <Clock className="h-5 w-5 text-blue-600" />
          <span className="text-lg font-bold text-blue-800">
            {Math.floor(seconds / 60)}:
            {(seconds % 60).toString().padStart(2, "0")}
          </span>
          <span className="text-sm text-blue-600">elapsed</span>
        </div>

        {/* Spinner */}
        <div className="flex justify-center mb-6">
          <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>

        {/* CV Jokes */}
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-4 mb-6 border-l-4 border-blue-400">
          <p className="text-sm text-gray-700 font-medium leading-relaxed animate-fade-in">
            {cvJokes[currentJoke]}
          </p>
        </div>

        {/* Encouragement */}
        <div className="text-center mb-6">
          <p className="text-sm text-blue-600 font-medium">
            {encouragingMessages[currentEncouragement]}
          </p>
        </div>

        {/* Status */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium">
            <FileText className="h-4 w-4" />
            Processing...
          </div>
        </div>

        {/* Time Warning */}
        {seconds > 30 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-amber-600 font-medium">
              ⏱️ This might take a while... our AI is being extra thorough!
            </p>
          </div>
        )}

        {/* Really long wait */}
        {seconds > 90 && (
          <div className="mt-2 text-center">
            <p className="text-xs text-orange-600 font-medium">
              🍿 Grab some popcorn... we're doing deep analysis here!
            </p>
          </div>
        )}
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        @keyframes fade-in {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        .border-3 {
          border-width: 3px;
        }
      `}</style>
    </div>
  );
}
