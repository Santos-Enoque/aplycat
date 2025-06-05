"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Share2,
  Copy,
  Linkedin,
  Twitter,
  MessageCircle,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Heart,
  Zap,
  Target,
  TrendingUp,
  Award,
  Clock,
} from "lucide-react"

interface TopIssue {
  issue: string;
  roast: string;
  fix: string;
}

interface ShareableRoast {
  text: string;
  category: string;
  social_text: string;
}

interface QuickResumeAnalysis {
  overall_score: number;
  ats_score: number;
  main_roast: string;
  score_category: string;
  top_issues: TopIssue[];
  actually_good: string[];
  shareable_roasts: ShareableRoast[];
  improvement_tease: string;
}

interface QuickResumeResultsProps {
  results: QuickResumeAnalysis;
  onStartOver: () => void;
  onUpgrade: () => void;
}

export function QuickResumeResults({ results, onStartOver, onUpgrade }: QuickResumeResultsProps) {
  const [copiedRoast, setCopiedRoast] = useState<string | null>(null)
  const [likedRoast, setLikedRoast] = useState<string | null>(null)

  const copyToClipboard = (text: string, roastId: string) => {
    navigator.clipboard.writeText(text)
    setCopiedRoast(roastId)
    setTimeout(() => setCopiedRoast(null), 2000)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-blue-600"
    if (score >= 40) return "text-yellow-600"
    if (score >= 20) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-green-600"
    if (score >= 60) return "from-blue-500 to-blue-600"
    if (score >= 40) return "from-yellow-500 to-yellow-600"
    if (score >= 20) return "from-orange-500 to-orange-600"
    return "from-red-500 to-red-600"
  }

  const getCategoryEmoji = (category: string) => {
    if (category.toLowerCase().includes('disaster')) return '💀'
    if (category.toLowerCase().includes('cpr')) return '🚨'
    if (category.toLowerCase().includes('human')) return '😅'
    if (category.toLowerCase().includes('decent')) return '👍'
    if (category.toLowerCase().includes('timeout')) return '⏰'
    if (category.toLowerCase().includes('technical')) return '🤖'
    return '🤔'
  }

  const getIssueIcon = (index: number) => {
    const icons = [XCircle, AlertTriangle, AlertTriangle]
    const colors = ["text-red-500", "text-orange-500", "text-yellow-500"]
    const Icon = icons[index] || AlertTriangle
    return { Icon, color: colors[index] || "text-gray-500" }
  }

  const handleShare = (platform: string, text: string) => {
    const encodedText = encodeURIComponent(text)
    const currentUrl = encodeURIComponent(window.location.href)
    
    const urls = {
      twitter: `https://twitter.com/intent/tweet?text=${encodedText}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${currentUrl}&summary=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}`,
    }
    
    if (urls[platform as keyof typeof urls]) {
      window.open(urls[platform as keyof typeof urls], '_blank', 'width=600,height=400')
    }
  }

  const handleLikeRoast = (roastId: string) => {
    setLikedRoast(likedRoast === roastId ? null : roastId)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header with Score Circle */}
      <div className="text-center mb-8">
        <div className="mx-auto w-32 h-32 relative mb-6">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="3"
            />
            <path
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              fill="none"
              stroke={
                results.overall_score >= 80
                  ? "#10b981"
                  : results.overall_score >= 60
                    ? "#2563eb"
                    : results.overall_score >= 40
                      ? "#f59e0b"
                      : results.overall_score >= 20
                        ? "#f97316"
                        : "#ef4444"
              }
              strokeWidth="4"
              strokeDasharray={`${results.overall_score}, 100`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getScoreColor(results.overall_score)}`}>
                {results.overall_score}
              </div>
              <div className="text-xs text-gray-500">/ 100</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-2xl">{getCategoryEmoji(results.score_category)}</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">{results.main_roast}</h1>
        </div>
        
        <div className="flex items-center justify-center gap-2 mb-6">
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {results.score_category}
          </Badge>
          <Badge variant="outline" className="text-sm">
            ATS Score: {results.ats_score}%
          </Badge>
        </div>

        {/* Quick Share */}
        <div className="flex justify-center gap-2 mb-8">
          <Button
            onClick={() => copyToClipboard(results.shareable_roasts[0]?.social_text || '', 'main')}
            variant="outline"
            size="sm"
          >
            {copiedRoast === 'main' ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy Roast
              </>
            )}
          </Button>
          <Button
            onClick={() => handleShare('twitter', results.shareable_roasts[0]?.social_text || '')}
            variant="outline"
            size="sm"
            className="bg-sky-500 text-white hover:bg-sky-600 border-sky-500"
          >
            <Twitter className="h-4 w-4 mr-2" />
            Tweet
          </Button>
          <Button
            onClick={() => handleShare('linkedin', results.shareable_roasts[0]?.social_text || '')}
            variant="outline"
            size="sm"
            className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
          >
            <Linkedin className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Top Issues */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-500" />
            Top Issues Killing Your Chances
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {results.top_issues.map((issue, index) => {
            const { Icon, color } = getIssueIcon(index)
            return (
              <div key={index} className="relative">
                <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-shrink-0">
                    <Icon className={`h-6 w-6 ${color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 mb-2">{issue.issue}</h4>
                    <p className="text-red-700 font-medium mb-3 italic">"{issue.roast}"</p>
                    <div className="bg-white p-3 rounded border border-green-200">
                      <p className="text-sm text-green-800">
                        <span className="font-medium">Quick Fix:</span> {issue.fix}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* What You Actually Did Right */}
      {results.actually_good && results.actually_good.length > 0 && (
        <Card className="mb-8 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Actually Not Terrible
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {results.actually_good.map((good, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <p className="text-green-800">{good}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade CTA */}
      <Card className="mb-8 border-2 border-purple-300 bg-gradient-to-r from-purple-50 to-pink-50">
        <CardContent className="p-8 text-center">
          <div className="mb-4">
            <Sparkles className="h-12 w-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-purple-900 mb-2">Ready to Stop Being Roasted?</h3>
            <p className="text-purple-700 mb-4">{results.improvement_tease}</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="text-left p-4 bg-white rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4" />
                AI Resume Makeover
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Complete resume rewrite</li>
                <li>• Industry-specific optimization</li>
                <li>• ATS-friendly formatting</li>
                <li>• Quantified achievements</li>
              </ul>
            </div>
            <div className="text-left p-4 bg-white rounded-lg border border-purple-200">
              <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Job-Specific Tailoring
              </h4>
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Tailored for specific jobs</li>
                <li>• Custom cover letters</li>
                <li>• Keyword optimization</li>
                <li>• Unlimited revisions</li>
              </ul>
            </div>
          </div>

          <Button 
            onClick={onUpgrade}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
          >
            Transform My Resume
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </CardContent>
      </Card>

      {/* Shareable Roasts */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-blue-600" />
            Share Your Roasts 🔥
          </CardTitle>
          <p className="text-gray-600">These are too good not to share</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.shareable_roasts.map((roast, index) => (
              <Card key={index} className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="secondary" className="bg-red-100 text-red-700">
                      {roast.category}
                    </Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleLikeRoast(`roast-${index}`)}
                      className="p-1 h-auto"
                    >
                      <Heart 
                        className={`h-4 w-4 ${
                          likedRoast === `roast-${index}` 
                            ? 'fill-red-500 text-red-500' 
                            : 'text-gray-400'
                        }`}
                      />
                    </Button>
                  </div>
                  
                  <p className="text-lg font-medium text-gray-900 mb-4">"{roast.text}"</p>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(roast.social_text, `roast-${index}`)}
                      className="flex-1"
                    >
                      {copiedRoast === `roast-${index}` ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleShare('twitter', roast.social_text)}
                      className="bg-sky-500 text-white hover:bg-sky-600 border-sky-500"
                    >
                      <Twitter className="h-4 w-4" />
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleShare('linkedin', roast.social_text)}
                      className="bg-blue-600 text-white hover:bg-blue-700 border-blue-600"
                    >
                      <Linkedin className="h-4 w-4" />
                    </Button>

                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => handleShare('whatsapp', roast.social_text)}
                      className="bg-green-600 text-white hover:bg-green-700 border-green-600"
                    >
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Bottom Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button 
          onClick={onUpgrade}
          size="lg" 
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Get My Resume Fixed
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={onStartOver} 
          className="px-8 py-4"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Roast Another Resume
        </Button>
      </div>

      {/* Footer Message */}
      <div className="text-center mt-8 p-4 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          Enjoyed getting roasted? Share with friends who need a reality check! 😸
        </p>
      </div>
    </div>
  )
}