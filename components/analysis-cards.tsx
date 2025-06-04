// components/analysis-cards.tsx
'use client';

interface AnalysisData {
  overall_score: number;
  ats_score: number;
  main_roast: string;
  score_category: string;
  good_stuff: Array<{
    title: string;
    roast: string;
    description: string;
  }>;
  needs_work: Array<{
    title: string;
    roast: string;
    issue: string;
    fix: string;
    example: string;
  }>;
  critical_issues: Array<{
    title: string;
    roast: string;
    disaster: string;
    fix: string;
    example: string;
  }>;
  shareable_roasts: Array<{
    id: string;
    text: string;
    category: string;
    shareText: string;
    platform: string;
  }>;
  ats_issues: string[];
  action_plan: {
    immediate: Array<{
      title: string;
      description: string;
      icon: string;
      color: string;
    }>;
    longTerm: Array<{
      title: string;
      description: string;
      icon: string;
      color: string;
    }>;
  };
}

interface AnalysisCardsProps {
  analysis: AnalysisData;
  fileName: string;
}

export function AnalysisCards({ analysis, fileName }: AnalysisCardsProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getColorClasses = (color: string) => {
    const colors: Record<string, string> = {
      red: 'bg-red-100 text-red-800 border-red-200',
      blue: 'bg-blue-100 text-blue-800 border-blue-200',
      yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      green: 'bg-green-100 text-green-800 border-green-200',
      purple: 'bg-purple-100 text-purple-800 border-purple-200',
      gray: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return colors[color] || colors.gray;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          🐱 Aplycat's Brutal Analysis
        </h2>
        <p className="text-gray-600">Analysis for: {fileName}</p>
      </div>

      {/* Scores */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(analysis.overall_score)} text-2xl font-bold mb-3`}>
            {analysis.overall_score}
          </div>
          <h3 className="font-semibold text-gray-900">Overall Score</h3>
          <p className="text-sm text-gray-600 mt-1">{analysis.score_category}</p>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${getScoreColor(analysis.ats_score)} text-2xl font-bold mb-3`}>
            {analysis.ats_score}
          </div>
          <h3 className="font-semibold text-gray-900">ATS Score</h3>
          <p className="text-sm text-gray-600 mt-1">Applicant Tracking</p>
        </div>

        <div className="bg-red-50 p-6 rounded-lg border border-red-200 text-center">
          <div className="text-3xl mb-3">🔥</div>
          <h3 className="font-semibold text-red-900">Main Roast</h3>
          <p className="text-sm text-red-700 mt-2 font-medium">"{analysis.main_roast}"</p>
        </div>
      </div>

      {/* Good Stuff */}
      {analysis.good_stuff && analysis.good_stuff.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            ✅ What Doesn't Suck
          </h3>
          <div className="space-y-4">
            {analysis.good_stuff.map((item, index) => (
              <div key={index} className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">{item.title}</h4>
                <p className="text-green-700 italic mb-2">"{item.roast}"</p>
                <p className="text-green-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Needs Work */}
      {analysis.needs_work && analysis.needs_work.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-orange-700 mb-4 flex items-center gap-2">
            ⚠️ Needs Work (Obviously)
          </h3>
          <div className="space-y-4">
            {analysis.needs_work.map((item, index) => (
              <div key={index} className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">{item.title}</h4>
                <p className="text-orange-700 italic mb-2">"{item.roast}"</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-orange-800">Issue:</span> {item.issue}</p>
                  <p><span className="font-medium text-orange-800">Fix:</span> {item.fix}</p>
                  <p><span className="font-medium text-orange-800">Example:</span> {item.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Issues */}
      {analysis.critical_issues && analysis.critical_issues.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-red-700 mb-4 flex items-center gap-2">
            🚨 Critical Disasters
          </h3>
          <div className="space-y-4">
            {analysis.critical_issues.map((item, index) => (
              <div key={index} className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">{item.title}</h4>
                <p className="text-red-700 italic mb-2">"{item.roast}"</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-red-800">Why it's disaster:</span> {item.disaster}</p>
                  <p><span className="font-medium text-red-800">Fix:</span> {item.fix}</p>
                  <p><span className="font-medium text-red-800">Example:</span> {item.example}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Shareable Roasts */}
      {analysis.shareable_roasts && analysis.shareable_roasts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
            📱 Viral-Worthy Roasts
          </h3>
          <div className="grid gap-4">
            {analysis.shareable_roasts.map((roast, index) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs font-medium text-purple-600 uppercase tracking-wide">
                    {roast.category}
                  </span>
                  <button
                    onClick={() => copyToClipboard(roast.shareText)}
                    className="text-xs bg-purple-100 hover:bg-purple-200 px-2 py-1 rounded transition-colors"
                  >
                    Copy Share Text
                  </button>
                </div>
                <p className="text-purple-800 font-medium mb-2">"{roast.text}"</p>
                <p className="text-purple-600 text-sm italic">{roast.shareText}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ATS Issues */}
      {analysis.ats_issues && analysis.ats_issues.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-700 mb-4 flex items-center gap-2">
            🤖 ATS Issues
          </h3>
          <ul className="space-y-2">
            {analysis.ats_issues.map((issue, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-red-500 mt-1">•</span>
                <span className="text-gray-700">{issue}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Plan */}
      {analysis.action_plan && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            📋 Action Plan
          </h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Immediate Actions */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">🚀 Do This Now</h4>
              <div className="space-y-3">
                {analysis.action_plan.immediate?.map((action, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getColorClasses(action.color)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{action.icon}</span>
                      <div>
                        <h5 className="font-medium">{action.title}</h5>
                        <p className="text-sm mt-1">{action.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Long-term Actions */}
            <div>
              <h4 className="font-semibold text-gray-700 mb-3">📈 Long-term Goals</h4>
              <div className="space-y-3">
                {analysis.action_plan.longTerm?.map((action, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${getColorClasses(action.color)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-lg">{action.icon}</span>
                      <div>
                        <h5 className="font-medium">{action.title}</h5>
                        <p className="text-sm mt-1">{action.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}