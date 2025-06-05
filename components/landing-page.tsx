"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUploadWithUploadThing } from "@/components/file-upload-with-uploadthing";
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import {
  ArrowRight,
  Upload,
  Flame,
  FileCheck,
  Users,
  Star,
  Zap,
  CheckCircle,
  AlertTriangle,
  Brain,
  Sparkles,
  Target,
  FileText,
  Award,
  Lightbulb,
} from "lucide-react";
import { useRouter } from "next/navigation";

export function LandingPage() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const router = useRouter();

  const handleFileUploaded = async (result: any) => {
    setIsAnalyzing(true);
    try {
      console.log("File uploaded:", result);
      if (result?.serverData?.resumeId) {
        router.push(`/analysis/${result.serverData.resumeId}`);
      }
    } catch (error) {
      console.error("Error handling file upload:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const pricingPlans = [
    {
      name: "🥉 Starter Pack",
      price: "$4.99",
      originalPrice: "$9.99",
      credits: "3 credits",
      features: [
        "1 Resume Analysis",
        "1 Resume Improvement",
        "1 Resume Template selection",
      ],
      cta: "Get Started",
      popular: false,
      buttonClass: "bg-purple-600 hover:bg-purple-700",
    },
    {
      name: "🥈 Professional Pack",
      price: "$12.49",
      originalPrice: "$24.99",
      credits: "15 credits",
      features: [
        "6 Resume Analyses",
        "5 Resume Improvements",
        "4 Job-Tailored Resume + Cover Letter combos",
      ],
      cta: "Choose Professional",
      popular: true,
      buttonClass: "bg-purple-600 hover:bg-purple-700",
    },
    {
      name: "🥇 Power User Pack",
      price: "$24.99",
      originalPrice: "$49.99",
      credits: "40 credits",
      features: [
        "15 Resume Analyses",
        "13 Resume Improvements",
        "12 Job-Tailored Resume + Cover Letter combos",
      ],
      cta: "Go Power User",
      popular: false,
      buttonClass: "bg-purple-600 hover:bg-purple-700",
      badge: "Best Value",
    },
  ];

  // Sample data for demonstrations
  const sampleAnalysis = {
    overall_score: 6,
    ats_score: 4,
    score_category: "Needs Major Improvement",
    main_roast:
      "Your resume reads like a grocery list written by someone who's never been grocery shopping. Generic, uninspiring, and about as memorable as yesterday's lunch.",
    sections: {
      professional_summary: {
        score: 3,
        feedback:
          "Your summary is more generic than store-brand cereal. 'Experienced professional' tells me nothing. What do you actually DO?",
      },
      experience: {
        score: 5,
        feedback:
          "Job descriptions masquerading as achievements. Where are the numbers? The impact? The proof you didn't just show up and breathe?",
      },
    },
  };

  const sampleImprovement = {
    personalInfo: {
      name: "John Smith",
      email: "john.smith@email.com",
      phone: "(555) 123-4567",
      location: "San Francisco, CA",
    },
    professionalSummary:
      "Results-driven Software Engineer with 5+ years building scalable web applications that serve 100K+ users daily. Increased system performance by 40% and led cross-functional teams of 8 developers to deliver projects 20% ahead of schedule.",
    experience: [
      {
        title: "Senior Software Engineer",
        company: "TechCorp",
        achievements: [
          "• Architected microservices infrastructure serving 500K+ daily users, reducing load times by 45%",
          "• Led development of React-based dashboard that increased user engagement by 60%",
          "• Mentored 3 junior developers, resulting in 100% team retention and 2 promotions",
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-20 sm:pt-24 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 leading-tight mb-6">
                I'll tell you what recruiters wish they could say{" "}
                <span className="text-purple-600 relative">
                  to your face
                  <span className="absolute -bottom-1 left-0 w-full h-3 bg-purple-200 -z-10 transform -rotate-1"></span>
                </span>
                .
              </h1>

              <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
                Get savage feedback from a cat who's seen it all and doesn't
                care about your feelings. Turn your cringeworthy resume into
                something that won't embarrass you.
              </p>

              <div className="space-y-4">
                <Button
                  onClick={() => scrollToSection("upload")}
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold rounded-lg w-full sm:w-auto"
                >
                  Upload Resume & Get Roasted
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>

                <p className="text-sm text-gray-500">
                  {"It's free. AplyCat is feeling generous today."}
                </p>
              </div>
            </div>

            <div className="relative mt-8 lg:mt-0">
              <HeroVideoDialog
                className="w-full max-w-2xl mx-auto"
                animationStyle="from-center"
                videoSrc="https://www.youtube.com/embed/dQw4w9WgXcQ"
                thumbnailSrc="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                thumbnailAlt="AplyCat Resume Analysis Demo"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {"Let's Be Honest, Your Resume Is Probably The Problem."}
          </h2>

          <p className="text-xl text-gray-600 mb-12">
            Still sending resumes into the void? {"Here's why."}
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-2 border-gray-200 hover:border-red-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {"Robots can't read it"}
                </h3>
                <p className="text-gray-600">
                  ATS systems are rejecting you before humans even see your
                  resume.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-red-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">😴</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  More boring than watching paint dry
                </h3>
                <p className="text-gray-600">
                  Generic bullet points that make recruiters fall asleep.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 border-gray-200 hover:border-red-300 transition-colors">
              <CardContent className="p-6 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👻</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Full of fluff, zero impact
                </h3>
                <p className="text-gray-600">
                  {
                    "Buzzwords and responsibilities instead of achievements that matter."
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="value-prop" className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Fine.{" "}
                <span className="text-purple-600">AplyCat Will Help.</span> (You
                Clearly Need It.)
              </h2>

              <p className="text-xl text-gray-600 mb-8">
                Superior judgment. Reluctant assistance. Actual results.
              </p>

              <p className="text-lg text-gray-600 mb-8">
                {
                  "He's a connoisseur of failure with impeccable taste. Thousands of resumes have crossed his superior gaze. "
                }
                Get unfiltered judgment from someone who actually knows better
                (and isn't afraid to tell you).
              </p>

              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  <span>50,000+ resumes roasted</span>
                </div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 mr-1 text-yellow-500" />
                  <span>4.9/5 rating</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-r from-gray-100 to-blue-50 rounded-2xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">Before</h4>
                    <div className="space-y-2">
                      <div className="h-2 bg-red-300 rounded w-full"></div>
                      <div className="h-2 bg-red-300 rounded w-3/4"></div>
                      <div className="h-2 bg-red-300 rounded w-1/2"></div>
                    </div>
                    <span className="text-xs text-red-600">😾 Terrible</span>
                  </div>
                  <div className="bg-green-100 p-4 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">After</h4>
                    <div className="space-y-2">
                      <div className="h-2 bg-green-500 rounded w-full"></div>
                      <div className="h-2 bg-green-500 rounded w-full"></div>
                      <div className="h-2 bg-green-500 rounded w-4/5"></div>
                    </div>
                    <span className="text-xs text-green-600">
                      😼 Acceptable
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {"It's Not Brain Surgery. (Even You Can Do This.)"}
          </h2>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="relative">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                1
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Upload Your PDF
              </h3>
              <p className="text-gray-600">
                Drag & drop your current disasterpiece.
              </p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flame className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                2
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Get Judged & Scored
              </h3>
              <p className="text-gray-600">
                AplyCat reluctantly shares his superior judgment in seconds.
              </p>
            </div>

            <div className="relative">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCheck className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -top-2 -left-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                3
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Fix & Succeed
              </h3>
              <p className="text-gray-600">
                {
                  "Choose from AplyCat's curated templates & get a resume that meets his standards."
                }
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 px-2">
              What You Get (Besides a Bruised Ego):
            </h2>
          </div>

          {/* Feature 1 - AI Analysis Demo */}
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-16 sm:mb-20">
            <div className="order-2 lg:order-1">
              <Card className="w-full border-2 border-red-200 bg-red-50">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-bold text-red-800">
                      Resume Analysis Results
                    </CardTitle>
                    <Badge className="bg-red-600 text-white">
                      Score: {sampleAnalysis.overall_score}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">
                      AplyCat's Verdict:
                    </h4>
                    <p className="text-sm text-gray-700 italic bg-white p-3 rounded border-l-4 border-red-500">
                      "{sampleAnalysis.main_roast}"
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">
                        Professional Summary
                      </span>
                      <Badge variant="destructive">3/10</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">
                        Experience Section
                      </span>
                      <Badge variant="destructive">5/10</Badge>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-white rounded">
                      <span className="text-sm font-medium">
                        ATS Compatibility
                      </span>
                      <Badge variant="destructive">4/10</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Brutally Honest Feline Judgment
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                No sugar-coating, no participation trophies. AplyCat tells you
                exactly what's wrong with your resume because someone has to.
                Get specific, judgmental feedback from a cat with standards.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Section-by-section detailed breakdown</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>ATS compatibility scoring</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Specific improvement recommendations</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Feature 2 - AI Improvements Demo */}
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center mb-16 sm:mb-20">
            <div className="order-1">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Reluctant Improvements
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                Watch AplyCat begrudgingly fix your mess. He'll transform your
                boring job descriptions into something that won't make him
                cringe. Proper achievements, decent bullet points, and
                formatting that meets basic standards of civilization.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Quantified achievements with real numbers</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Action-oriented bullet points</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>One-page optimization</span>
                </li>
              </ul>
            </div>
            <div className="order-2">
              <Card className="w-full border-2 border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-green-800">
                    Improved Resume Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Professional Summary
                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          ENHANCED
                        </span>
                      </h4>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded border-l-4 border-green-500">
                        Results-driven Software Engineer with{" "}
                        <span className="bg-yellow-200 px-1 rounded">
                          5+ years
                        </span>{" "}
                        building scalable web applications that serve{" "}
                        <span className="bg-yellow-200 px-1 rounded">
                          100K+ users daily
                        </span>
                        . Increased system performance by{" "}
                        <span className="bg-yellow-200 px-1 rounded">40%</span>{" "}
                        and led cross-functional teams of{" "}
                        <span className="bg-yellow-200 px-1 rounded">
                          8 developers
                        </span>{" "}
                        to deliver projects{" "}
                        <span className="bg-yellow-200 px-1 rounded">
                          20% ahead of schedule
                        </span>
                        .
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Experience Highlights
                        <span className="ml-2 bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                          QUANTIFIED
                        </span>
                      </h4>
                      <div className="bg-white p-3 rounded border-l-4 border-green-500">
                        <p className="font-medium text-sm text-gray-800 mb-1">
                          Senior Software Engineer at TechCorp
                        </p>
                        <ul className="space-y-1">
                          <li className="text-xs text-gray-700">
                            • Architected microservices infrastructure serving{" "}
                            <span className="bg-yellow-200 px-1 rounded">
                              500K+ daily users
                            </span>
                            , reducing load times by{" "}
                            <span className="bg-yellow-200 px-1 rounded">
                              45%
                            </span>
                          </li>
                          <li className="text-xs text-gray-700">
                            • Led development of React-based dashboard that
                            increased user engagement by{" "}
                            <span className="bg-yellow-200 px-1 rounded">
                              60%
                            </span>
                          </li>
                          <li className="text-xs text-gray-700">
                            • Mentored{" "}
                            <span className="bg-yellow-200 px-1 rounded">
                              3 junior developers
                            </span>
                            , resulting in{" "}
                            <span className="bg-yellow-200 px-1 rounded">
                              100% team retention
                            </span>{" "}
                            and{" "}
                            <span className="bg-yellow-200 px-1 rounded">
                              2 promotions
                            </span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Feature 3 - Job Tailoring Demo */}
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 items-center">
            <div className="order-2 lg:order-1">
              <Card className="w-full border-2 border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-blue-800">
                    Job-Tailored Resume + Cover Letter
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">
                          Target Job
                        </h4>
                        <Badge className="bg-blue-100 text-blue-800">
                          Senior Frontend Dev
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 bg-white p-3 rounded">
                        🎯 Resume optimized for React, TypeScript, and team
                        leadership keywords
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">
                        Tailored Achievements
                      </h4>
                      <div className="bg-white p-3 rounded space-y-1">
                        <p className="text-xs text-gray-700">
                          • Built React applications serving 500K+ users daily
                        </p>
                        <p className="text-xs text-gray-700">
                          • Led frontend team of 5 developers using Agile
                          methodology
                        </p>
                        <p className="text-xs text-gray-700">
                          • Implemented TypeScript, reducing bugs by 35%
                        </p>
                      </div>
                    </div>
                    <div className="bg-purple-100 p-3 rounded">
                      <h5 className="font-medium text-purple-800 text-sm mb-1">
                        + Custom Cover Letter
                      </h5>
                      <p className="text-xs text-purple-700">
                        Personalized for company culture and role requirements
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="order-1 lg:order-2">
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">
                Custom Tailoring (When He Feels Like It)
              </h3>
              <p className="text-base sm:text-lg text-gray-600 mb-4 sm:mb-6">
                Stop sending the same generic trash everywhere. AplyCat will
                (sigh) analyze job descriptions and customize your resume to
                actually match what they want. He'll even write you a cover
                letter because apparently you need that too.
              </p>
              <ul className="space-y-2 text-sm sm:text-base text-gray-600">
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Job description keyword analysis</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Experience reordering for relevance</span>
                </li>
                <li className="flex items-center">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mr-3 flex-shrink-0"></div>
                  <span>Custom cover letters included</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center bg-purple-100 text-purple-800 px-4 py-2 rounded-full mb-4">
              <span className="font-semibold text-sm">
                🎉 EARLY MEMBER SALE - 50% OFF
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Pick Your Poison (Pricing That Won't Break The Bank)
            </h2>
            <p className="text-xl text-gray-600 mb-4">
              Choose how much truth you can handle.
            </p>
            <p className="text-sm text-purple-600 font-medium">
              Limited time launch pricing - lock in these rates forever!
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`border-2 transition-colors relative ${
                  plan.popular
                    ? "border-purple-500 hover:border-purple-600 transform scale-105"
                    : "border-gray-200 hover:border-purple-300"
                }`}
              >
                {(plan.popular || plan.badge) && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span
                      className={`text-white px-4 py-1 rounded-full text-sm font-semibold ${
                        plan.popular ? "bg-purple-500" : "bg-green-500"
                      }`}
                    >
                      {plan.popular ? "Most Popular" : plan.badge}
                    </span>
                  </div>
                )}
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-3xl mb-2">
                      {plan.name.split(" ")[0]}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                      {plan.name.slice(2)}
                    </h3>
                    <div className="mb-4">
                      <span className="text-3xl font-bold text-purple-600">
                        {plan.price}
                      </span>
                      <span className="text-lg text-gray-500 line-through ml-2">
                        {plan.originalPrice}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      ({plan.credits})
                    </p>
                  </div>

                  <ul className="space-y-3 text-left mb-6">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button className={`w-full text-white ${plan.buttonClass}`}>
                    {plan.cta}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="text-sm text-gray-500 mt-8">
            All plans include AplyCat's superior judgment. No refunds for hurt
            feelings or wounded pride.
          </p>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            {"Fresh from the Fire Pit: See What AplyCat Is Saying"}
          </h2>

          <p className="text-xl text-gray-600 mb-12">
            {"Don't just take our word for it... See the carnage!"}
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white border-2 border-purple-200 transform hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">😾</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">AplyCat</div>
                    <div className="text-sm text-gray-500">@aplycat_ai</div>
                  </div>
                </div>
                <p className="text-gray-800 italic">
                  {
                    "Your 'Skills' section includes 'Microsoft Word'? *yawn* How revolutionary. Did you also list 'Having thumbs' and 'Existing in 3D space'?"
                  }
                </p>
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <Flame className="h-4 w-4 mr-1 text-purple-500" />
                  <span>Roast Level: Savage</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-purple-200 transform hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">😾</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">AplyCat</div>
                    <div className="text-sm text-gray-500">@aplycat_ai</div>
                  </div>
                </div>
                <p className="text-gray-800 italic">
                  {
                    "This resume is longer than my afternoon nap and twice as boring. Three pages to say you answered emails? I've seen litter boxes with more substance."
                  }
                </p>
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <Flame className="h-4 w-4 mr-1 text-purple-500" />
                  <span>Roast Level: Nuclear</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-2 border-purple-200 transform hover:scale-105 transition-transform">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">😾</span>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">AplyCat</div>
                    <div className="text-sm text-gray-500">@aplycat_ai</div>
                  </div>
                </div>
                <p className="text-gray-800 italic">
                  {
                    "Comic Sans font? *slowly blinks* Really? I'm genuinely impressed by your ability to make poor life choices. Even my scratching post has better design sense."
                  }
                </p>
                <div className="flex items-center mt-4 text-sm text-gray-500">
                  <Flame className="h-4 w-4 mr-1 text-purple-500" />
                  <span>Roast Level: Brutal</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <div className="inline-flex items-center bg-purple-100 px-4 py-2 rounded-full">
              <Zap className="h-4 w-4 text-purple-600 mr-2" />
              <span className="text-purple-800 font-semibold">
                Over 50,000 Resumes Roasted Into Shape!
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="upload" className="py-8 sm:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 px-2">
            Ready to Stop Embarrassing Yourself?
          </h2>

          <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 px-2">
            Let AplyCat reluctantly fix whatever this mess is supposed to be.
          </p>

          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl sm:rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 mx-2 sm:mx-0">
            <div id="upload-section">
              <FileUploadWithUploadThing
                onFileUploaded={handleFileUploaded}
                isLoading={isAnalyzing}
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              PDF files only. Max 5MB. AplyCat doesn't have all day.
            </p>
          </div>

          <p className="text-sm text-gray-500 px-4">
            Or,{" "}
            <button className="text-purple-600 hover:underline">
              see examples of AplyCat's superior work
            </button>
          </p>
        </div>
      </section>
    </div>
  );
}
