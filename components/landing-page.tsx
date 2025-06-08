"use client";

import {
  Award,
  CheckCircle,
  Play,
  Star,
  Target,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; // Added CardHeader and CardTitle
import { Badge } from "@/components/ui/badge"; // Added Badge
import { SignInButton } from "@clerk/nextjs";
import HeroVideoDialog from "@/components/magicui/hero-video-dialog";
import {
  HonestFeedbackPreview,
  AiResumeGeneratorPreview,
  JobTailoringPreview,
  LinkedInPreview,
} from "@/components/feature-previews";

export function LandingPage() {
  return (
    <>
      {/* Launch Promo Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3">
        <div className="container mx-auto px-4 text-center">
          <p className="font-semibold">
            🚀 <span className="font-bold">LAUNCH OFFER:</span> GET BONUS
            CREDITS ON ALL PACKS! • Limited Time
          </p>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-20 bg-gradient-to-b from-purple-50 to-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Tired of{" "}
            <span className="text-purple-500">"We went with someone else"</span>
            ?
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-4xl mx-auto leading-relaxed">
            Get savage resume feedback, AI rewrites, and recruiter-level
            judgment — without the fake niceties.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="bg-purple-500 hover:bg-purple-600 text-white px-8 py-4 text-lg font-semibold"
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Resume & Get Roasted
              </Button>
            </SignInButton>
          </div>
          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center">
              <span className="text-2xl mr-2">🔥</span>
              <span className="font-semibold">50,000+ resumes roasted</span>
            </div>
            <div className="flex items-center">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="font-semibold">4.9/5 rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              See Aplycat in Action
            </h2>
            <p className="text-xl text-muted-foreground">
              Watch how we turn resume disasters into job-winning masterpieces
            </p>
          </div>
          <div className="max-w-6xl mx-auto">
            <HeroVideoDialog
              videoSrc="https://www.youtube.com/embed/XUkq-0LtKvU" // Placeholder video source
              thumbnailSrc="https://firebasestorage.googleapis.com/v0/b/foodapp-ee4f1.appspot.com/o/Frame%205.png?alt=media&token=e1fad3e3-bb8d-420c-8c8c-a566e4ef9bfe" // Placeholder thumbnail source
              thumbnailAlt="Product video thumbnail"
              animationStyle="from-center" // You can choose other animation styles
              className="w-full"
            />
          </div>
        </div>
      </section>

      {/* Social Proof Section
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Join Thousands Getting Better Jobs
            </h2>
            <p className="text-lg text-muted-foreground">
              Real results from real people (not fake testimonials)
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-purple-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Sarah M.
                  </span>
                </div>
                <p className="text-foreground font-medium mb-2">
                  "Finally, honest feedback!"
                </p>
                <p className="text-sm text-muted-foreground">
                  "Went from 0 interviews to 5 offers in 3 weeks. The brutal
                  honesty was exactly what I needed."
                </p>
              </CardContent>
            </Card>
            <Card className="border-purple-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Mike K.
                  </span>
                </div>
                <p className="text-foreground font-medium mb-2">
                  "My ATS score went from 23 to 89"
                </p>
                <p className="text-sm text-muted-foreground">
                  "No more black hole applications. Now recruiters actually call
                  me back."
                </p>
              </CardContent>
            </Card>
            <Card className="border-purple-100 hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-muted-foreground">
                    Jessica R.
                  </span>
                </div>
                <p className="text-foreground font-medium mb-2">
                  "Worth every penny"
                </p>
                <p className="text-sm text-muted-foreground">
                  "Landed a $95k job. The roast was harsh but the results speak
                  for themselves."
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section> */}

      {/* Features Section with Alternating Layout */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Stop Getting Rejected. Start Getting Hired.
            </h2>
            <p className="text-xl text-muted-foreground">
              No fluff. No subscriptions. Just brutal honesty and AI-powered
              fixes.
            </p>
          </div>

          {/* Feature 1: Resume Honest Feedback - Left Feature, Right Screenshot */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Resume Honest Feedback
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Get brutally honest feedback that recruiters actually think. No
                sugar-coating, just the truth about why your resume isn't
                working.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  ATS Score 0-100 with detailed breakdown
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Section-by-section analysis and fixes
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Recruiter-level judgment calls
                </li>
              </ul>
            </div>
            <div>
              <HonestFeedbackPreview />
            </div>
          </div>

          {/* Feature 2: AI Resume Generator - Right Feature, Left Screenshot */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div className="lg:order-2">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">
                AI Resume Generator
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Brand new resumes tailored to your industry and role. Built from
                the ground up with recruiter best practices.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Industry-specific templates and formats
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  ATS-optimized structure and keywords
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Role-based content optimization
                </li>
              </ul>
            </div>
            <div className="lg:order-1">
              <AiResumeGeneratorPreview />
            </div>
          </div>

          {/* Feature 3: Job-Specific Tailoring - Left Feature, Right Screenshot */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Target className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">
                Job-Specific Tailoring
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Paste any job description, get a perfectly matched resume. Stop
                sending generic resumes and start getting interviews.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Custom resume rewrites for each job
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Tailored cover letters that actually work
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Smart keyword optimization and matching
                </li>
              </ul>
            </div>
            <div>
              <JobTailoringPreview />
            </div>
          </div>

          {/* Feature 4: LinkedIn Optimization - Right Feature, Left Screenshot */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="lg:order-2">
              <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Award className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-4">
                LinkedIn Roast & Rewrite
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Fix your LinkedIn so recruiters stop ignoring you. Get found,
                get contacted, get hired.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Complete profile optimization audit
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  Headline & summary professional rewrite
                </li>
                <li className="flex items-center text-foreground">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  SEO optimization for recruiter searches
                </li>
              </ul>
            </div>
            <div className="lg:order-1">
              <LinkedInPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Before & After Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              From Trash to Treasure
            </h2>
            <p className="text-xl text-muted-foreground">
              See what happens when brutal honesty meets AI intelligence
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <Card className="border-red-200 bg-red-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-red-600">
                    Before (Terrible)
                  </CardTitle>
                  <Badge variant="destructive">ATS Score: 23</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded border-2 border-dashed border-red-300">
                  <h3 className="font-semibold text-sm mb-2">RESUME.docx</h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>• Generic "hard worker" objectives</p>
                    <p>• No quantified achievements</p>
                    <p>• Skills section with "Microsoft Office"</p>
                    <p>• 2-page wall of text</p>
                    <p>• Comic Sans font (yes, really)</p>
                  </div>
                </div>
                <div className="text-sm text-red-600 bg-red-100 p-3 rounded">
                  <strong>Roast Result:</strong> "This resume screams 'I haven't
                  updated this since 2015.' Your skills section is basically
                  everyone's LinkedIn from 2008."
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-green-600">
                    After (Acceptable)
                  </CardTitle>
                  <Badge className="bg-green-500">ATS Score: 89</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded border-2 border-dashed border-green-300">
                  <h3 className="font-semibold text-sm mb-2">
                    Sarah_Johnson_Resume.pdf
                  </h3>
                  <div className="space-y-1 text-xs text-muted-foreground">
                    <p>• Results-driven professional summary</p>
                    <p>• Quantified achievements (+32% growth)</p>
                    <p>• Industry-specific keywords</p>
                    <p>• Clean, ATS-friendly format</p>
                    <p>• Tailored to target role</p>
                  </div>
                </div>
                <div className="text-sm text-green-600 bg-green-100 p-3 rounded">
                  <strong>Result:</strong> 5 interview requests in first week.
                  Landed $95k role at tech startup. Worth every credit.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three steps to stop embarrassing yourself
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Upload Your Resume</h3>
              <p className="text-muted-foreground">
                Drop your current resume (PDF, DOC, whatever disaster you've
                been sending out). We'll scan it in seconds.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">
                Get Roasted + See Your Score
              </h3>
              <p className="text-muted-foreground">
                Receive brutal but honest feedback, your ATS score (0-100), and
                section-by-section improvements. No sugar-coating.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Fix It With AI</h3>
              <p className="text-muted-foreground">
                Generate a brand new resume, tailor it to specific jobs, or get
                AI rewrites. Your choice, your career.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white" id="pricing">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-2 px-6 rounded-full inline-block mb-6">
              🚀 LAUNCH OFFER: BONUS CREDITS ON ALL PACKS
            </div>
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Simple Pricing. No Subscriptions.
            </h2>
            <p className="text-xl text-muted-foreground">
              Buy credits once. Use them whenever you need a career boost.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Starter Pack */}
            <Card className="hover:shadow-lg transition-shadow border-purple-200 flex flex-col">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Starter Pack</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-purple-500">
                    $4.99
                  </div>
                  <Badge className="bg-purple-500">5 Credits + 2 Bonus!</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">1x</span>{" "}
                      LinkedIn Analysis (3 credits)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">1x</span>{" "}
                      Resume Improvement (2 credits)
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">1x</span> Job
                      Tailoring (2 credits)
                    </span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <SignInButton mode="modal">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    Get Started
                  </Button>
                </SignInButton>
              </div>
            </Card>

            {/* Professional Pack */}
            <Card className="hover:shadow-lg transition-shadow border-purple-500 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-purple-500 text-white px-4 py-1 text-sm">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl">Professional Pack</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-purple-500">
                    $12.49
                  </div>
                  <Badge className="bg-purple-500">
                    30 Credits + 15 Bonus!
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">15x</span>{" "}
                      Resume Improvements
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">10x</span>{" "}
                      Job-Tailored Resume + Cover Letter
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">
                        Priority
                      </span>{" "}
                      Support
                    </span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <SignInButton mode="modal">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    Choose Professional
                  </Button>
                </SignInButton>
              </div>
            </Card>

            {/* Power User Pack */}
            <Card className="hover:shadow-lg transition-shadow border-purple-200 flex flex-col">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Power User Pack</CardTitle>
                <div className="space-y-2">
                  <div className="text-4xl font-bold text-purple-500">
                    $24.99
                  </div>
                  <Badge className="bg-purple-500">
                    70 Credits + 30 Bonus!
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 flex-grow">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">35x</span>{" "}
                      Resume Improvements
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">23x</span>{" "}
                      Job-Tailored Resume + Cover Letter
                    </span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-1 flex-shrink-0" />
                    <span>
                      <span className="font-bold text-foreground">Premium</span>{" "}
                      Support & Career Change Optimization
                    </span>
                  </li>
                </ul>
              </CardContent>
              <div className="p-6 pt-0">
                <SignInButton mode="modal">
                  <Button className="w-full bg-purple-500 hover:bg-purple-600">
                    Go Power User
                  </Button>
                </SignInButton>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            You've been rejected enough.
          </h2>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Fix your resume. Fix your luck.
          </p>
          <SignInButton mode="modal">
            <Button
              size="lg"
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Resume & Get Roasted
            </Button>
          </SignInButton>
          <p className="text-sm mt-4 opacity-75">
            🚀 Launch offer ends soon • Bonus credits on all packs
          </p>
        </div>
      </section>
    </>
  );
}
