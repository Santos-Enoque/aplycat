"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileUpload } from "@/components/file-upload";
import {
  Zap,
  Target,
  Brain,
  FileText,
  CheckCircle,
  Star,
  ArrowRight,
  PlayCircle,
  Users,
  Award,
  TrendingUp,
  Sparkles,
  Clock,
  Shield,
  Eye,
  AlertTriangle,
  Lightbulb,
} from "lucide-react";

interface LandingPageProps {
  onStartAnalysis: (fileData: string, fileName: string) => void;
}

export function LandingPage({ onStartAnalysis }: LandingPageProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileSelect = async (fileData: string, fileName: string) => {
    setIsAnalyzing(true);
    onStartAnalysis(fileData, fileName);
  };

  const features = [
    {
      icon: AlertTriangle,
      title: "Brutally Honest Analysis",
      description:
        "Get Gordon Ramsay-style feedback that tells you exactly what's wrong and how to fix it.",
      color: "red",
    },
    {
      icon: Brain,
      title: "AI-Powered Intelligence",
      description:
        "Advanced AI analyzes every section and provides industry-specific insights.",
      color: "purple",
    },
    {
      icon: Target,
      title: "ATS Optimization",
      description:
        "Ensure your resume passes Applicant Tracking Systems with smart keyword optimization.",
      color: "green",
    },
    {
      icon: Sparkles,
      title: "Smart Improvements",
      description:
        "Get an AI-optimized version tailored to your target role and industry.",
      color: "blue",
    },
    {
      icon: FileText,
      title: "Section-by-Section Breakdown",
      description:
        "Detailed analysis of every resume section with specific improvement suggestions.",
      color: "orange",
    },
    {
      icon: Eye,
      title: "Keyword Highlighting",
      description:
        "See which keywords are working and which ones you're missing for your target role.",
      color: "teal",
    },
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer",
      company: "Google",
      content:
        "Aplycat's brutal honesty was exactly what I needed. Went from 0 responses to 5 interviews in 2 weeks!",
      rating: 5,
    },
    {
      name: "Marcus Rodriguez",
      role: "Marketing Manager",
      company: "Spotify",
      content:
        "The AI-powered improvements were spot on. My resume finally shows the impact I've made.",
      rating: 5,
    },
    {
      name: "Priya Patel",
      role: "Data Scientist",
      company: "Meta",
      content:
        "The section-by-section analysis helped me identify gaps I never knew existed. Game changer!",
      rating: 5,
    },
  ];

  const stats = [
    { number: "50,000+", label: "Resumes Analyzed" },
    { number: "89%", label: "Get More Interviews" },
    { number: "4.9", label: "Average Rating" },
    { number: "2x", label: "Faster Job Search" },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      description: "Perfect for trying out Aplycat",
      features: [
        "1 resume analysis",
        "Basic feedback",
        "ATS score",
        "General improvements",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "one-time",
      description: "Everything you need for job hunting",
      features: [
        "Unlimited resume analysis",
        "Brutal honest feedback",
        "AI-powered improvements",
        "Job-specific tailoring",
        "Cover letter generation",
        "Priority support",
      ],
      cta: "Get Pro",
      popular: true,
    },
    {
      name: "Premium",
      price: "$49",
      period: "one-time",
      description: "For serious career advancement",
      features: [
        "Everything in Pro",
        "LinkedIn profile optimization",
        "Interview preparation",
        "Salary negotiation tips",
        "Career coaching session",
        "White-glove support",
      ],
      cta: "Go Premium",
      popular: false,
    },
  ];

  const beforeAfterExample = {
    before:
      "Experienced professional with strong communication skills and a passion for technology. Seeking opportunities to contribute to a dynamic team.",
    after:
      "Full-stack developer with 5+ years building scalable web applications, increasing user engagement by 40% at previous role. Led development of React-based dashboard serving 10K+ daily users.",
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-purple-600 text-white mb-6">
                <Zap className="h-3 w-3 mr-1" />
                AI-Powered Resume Analysis
              </Badge>

              <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
                Get Brutally Honest
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                  {" "}
                  Resume Feedback
                </span>
              </h1>

              <p className="text-xl lg:text-2xl text-purple-100 mb-8 leading-relaxed">
                Stop getting ignored by recruiters. Our AI gives you the harsh
                truth about your resume and tells you exactly how to fix it.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Button
                  size="lg"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg px-8 py-4"
                  onClick={() =>
                    document
                      .getElementById("upload-section")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Analyze My Resume Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-purple-900 text-lg px-8 py-4"
                >
                  <PlayCircle className="h-5 w-5 mr-2" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center gap-4 text-purple-200">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <span>4.9/5 from 10,000+ job seekers</span>
              </div>
            </div>

            <div className="lg:pl-8">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  🐱 Try Aplycat Now
                </h3>
                <div id="upload-section">
                  <FileUpload
                    onFileSelect={handleFileSelect}
                    isLoading={isAnalyzing}
                  />
                </div>
                <p className="text-purple-200 text-sm text-center mt-4">
                  Upload your resume and get instant feedback
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl lg:text-5xl font-bold text-purple-600 mb-2">
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Aplycat Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI doesn't just give you generic advice. It provides brutally
              honest, actionable feedback that actually gets you hired.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-purple-200"
              >
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-lg bg-${feature.color}-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                  >
                    <feature.icon
                      className={`h-6 w-6 text-${feature.color}-600`}
                    />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Example */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              See the Transformation
            </h2>
            <p className="text-xl text-gray-600">
              Watch how Aplycat transforms weak resume content into compelling
              achievements
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-2 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Before: Generic & Weak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {beforeAfterExample.before}
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge variant="destructive">No metrics</Badge>
                  <Badge variant="destructive">Vague claims</Badge>
                  <Badge variant="destructive">Generic language</Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-green-200">
              <CardHeader>
                <CardTitle className="text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  After: Specific & Powerful
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  <span className="bg-green-200 px-1 rounded">
                    Full-stack developer
                  </span>{" "}
                  with{" "}
                  <span className="bg-green-200 px-1 rounded">5+ years</span>{" "}
                  building scalable web applications, increasing user engagement
                  by <span className="bg-green-200 px-1 rounded">40%</span> at
                  previous role. Led development of{" "}
                  <span className="bg-green-200 px-1 rounded">
                    React-based dashboard
                  </span>{" "}
                  serving{" "}
                  <span className="bg-green-200 px-1 rounded">
                    10K+ daily users
                  </span>
                  .
                </p>
                <div className="mt-4 flex gap-2">
                  <Badge className="bg-green-100 text-green-800">
                    Quantified results
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    Specific technologies
                  </Badge>
                  <Badge className="bg-green-100 text-green-800">
                    Clear impact
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Success Stories
            </h2>
            <p className="text-xl text-gray-600">
              Join thousands who transformed their careers with Aplycat
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card
                key={index}
                className="border-2 hover:shadow-lg transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-5 w-5 fill-yellow-400 text-yellow-400"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 italic">
                    "{testimonial.content}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="font-semibold text-purple-600">
                        {testimonial.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </span>
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {testimonial.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {testimonial.role} at {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, Honest Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Choose the plan that fits your career goals
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <Card
                key={index}
                className={`relative border-2 ${
                  plan.popular
                    ? "border-purple-500 shadow-lg scale-105"
                    : "border-gray-200 hover:border-gray-300"
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-600 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    {plan.name}
                  </CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price}
                    </span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  <p className="text-gray-600 mt-2">{plan.description}</p>
                </CardHeader>

                <CardContent>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li
                        key={featureIndex}
                        className="flex items-center gap-3"
                      >
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                    size="lg"
                  >
                    {plan.cta}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">
            Ready to Transform Your Resume?
          </h2>
          <p className="text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Join 50,000+ job seekers who've gotten brutally honest feedback and
            landed their dream jobs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold text-lg px-8 py-4"
              onClick={() =>
                document
                  .getElementById("upload-section")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              <Zap className="h-5 w-5 mr-2" />
              Start Free Analysis
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-purple-600 text-lg px-8 py-4"
            >
              View Pricing
            </Button>
          </div>

          <p className="text-purple-200 text-sm mt-6">
            No credit card required • Free forever plan available
          </p>
        </div>
      </section>
    </div>
  );
}
