// lib/json-parser.ts
/**
 * Robust JSON parser specifically designed to handle OpenAI's inconsistent JSON responses
 * Handles common issues like:
 * - Unescaped quotes in string values
 * - Backslash escape sequences in examples
 * - Mixed quote types
 * - Newlines and special characters
 */

interface ParseResult {
    success: boolean;
    data?: any;
    error?: string;
    strategy?: string;
  }
  
  export function parseOpenAIResponse(rawResponse: string): ParseResult {
    if (!rawResponse?.trim()) {
      return {
        success: false,
        error: 'Empty response from OpenAI',
      };
    }
  
    let cleanedResult = rawResponse.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResult.startsWith('```json')) {
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
  
    // Strategy 1: Try parsing as-is (fastest path)
    try {
      const result = JSON.parse(cleanedResult);
      return {
        success: true,
        data: result,
        strategy: 'direct',
      };
    } catch (error) {
      console.log('Direct parse failed, trying cleanup strategies...');
    }
  
    // Strategy 2: Fix common escape sequence issues
    try {
      const escapedFixed = fixEscapeSequences(cleanedResult);
      const result = JSON.parse(escapedFixed);
      return {
        success: true,
        data: result,
        strategy: 'escape-fix',
      };
    } catch (error) {
      console.log('Escape fix failed, trying quote normalization...');
    }
  
    // Strategy 3: Comprehensive quote and content cleaning
    try {
      const quoteFixed = fixQuotesAndContent(cleanedResult);
      const result = JSON.parse(quoteFixed);
      return {
        success: true,
        data: result,
        strategy: 'quote-fix',
      };
    } catch (error) {
      console.log('Quote fix failed, trying regex-based repair...');
    }
  
    // Strategy 4: Regex-based JSON repair
    try {
      const regexFixed = repairJsonWithRegex(cleanedResult);
      const result = JSON.parse(regexFixed);
      return {
        success: true,
        data: result,
        strategy: 'regex-repair',
      };
    } catch (error) {
      console.log('Regex repair failed, attempting manual extraction...');
    }
  
    // Strategy 5: Manual key extraction and reconstruction
    try {
      const manuallyBuilt = extractAndRebuildJson(cleanedResult);
      return {
        success: true,
        data: manuallyBuilt,
        strategy: 'manual-rebuild',
      };
    } catch (error) {
      console.error('All parsing strategies failed:', error);
    }
  
    // Final fallback
    return {
      success: false,
      error: 'Could not parse OpenAI response after all strategies',
      data: createFallbackResponse(),
    };
  }
  
  /**
   * Fix escape sequences that commonly break JSON parsing
   */
  function fixEscapeSequences(json: string): string {
    return json
      // Fix common problematic escape sequences in strings
      .replace(/\\"/g, '\uE000') // Temporarily replace escaped quotes
      .replace(/\\"([^"]*?)\\"/g, '"$1"') // Fix doubled escaped quotes
      .replace(/\uE000/g, '\\"') // Restore escaped quotes
      // Fix backslashes in examples and descriptions
      .replace(/(\"example\"\s*:\s*\")([^"]*?)\\([^"]*?)(\")/, '$1$2\\\\$3$4')
      // Fix newlines and tabs in string values
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      // Fix unescaped quotes within string values
      .replace(/(:\s*")([^"]*?)"([^"]*?)"/g, (match, start, middle, end) => {
        if (end.includes(':') || end.includes('{') || end.includes('[')) {
          return match; // Don't modify if it looks like a JSON structure
        }
        return `${start}${middle}\\"${end}"`;
      });
  }
  
  /**
   * Comprehensive quote and content cleaning
   */
  function fixQuotesAndContent(json: string): string {
    return json
      // First pass: handle string values with embedded quotes
      .replace(/"([^"]*(?:\\.[^"]*)*)"/g, (match, content) => {
        // Clean up content within quotes
        const cleaned = content
          .replace(/'/g, "\\'") // Escape single quotes
          .replace(/\\\\/g, '\\') // Fix double escapes
          .replace(/\\n/g, ' ') // Replace literal \n with space
          .replace(/\\t/g, ' ') // Replace literal \t with space
          .replace(/\\r/g, ' ') // Replace literal \r with space
          .replace(/\n/g, ' ') // Replace actual newlines
          .replace(/\r/g, ' ') // Replace actual carriage returns
          .replace(/\t/g, ' ') // Replace actual tabs
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        return `"${cleaned}"`;
      })
      // Fix array and object separators
      .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
      .replace(/([}\]])(\s*)([{\[])/g, '$1,$2$3'); // Add missing commas between objects/arrays
  }
  
  /**
   * Use regex patterns to repair common JSON structure issues
   */
  function repairJsonWithRegex(json: string): string {
    return json
      // Fix missing commas between object properties
      .replace(/}(\s*){/g, '},$1{')
      .replace(/](\s*)\[/g, '],$1[')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix quote inconsistencies in property names
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix single quotes around property values
      .replace(/:\s*'([^']*)'/g, ': "$1"')
      // Clean up escape sequences that break parsing
      .replace(/\\([^"\\\/bfnrt])/g, '\\\\$1')
      // Ensure proper string termination
      .replace(/("[^"]*?)\\$/, '$1')
      // Fix broken unicode escape sequences
      .replace(/\\u([0-9a-fA-F]{0,3}(?![0-9a-fA-F]))/g, '\\\\u$1');
  }
  
  /**
   * Extract key values and manually rebuild the JSON structure
   */
  function extractAndRebuildJson(json: string): any {
    console.log('Attempting manual JSON reconstruction...');
    
    // Extract core values with more robust regex patterns
    const extractValue = (key: string, fallback: any = null) => {
      const patterns = [
        new RegExp(`"${key}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i'),
        new RegExp(`"${key}"\\s*:\\s*([0-9]+)`, 'i'),
        new RegExp(`"${key}"\\s*:\\s*(true|false)`, 'i'),
      ];
      
      for (const pattern of patterns) {
        const match = json.match(pattern);
        if (match) {
          const value = match[1];
          // Try to parse as number or boolean
          if (/^\d+$/.test(value)) return parseInt(value);
          if (value === 'true') return true;
          if (value === 'false') return false;
          return value.replace(/\\"/g, '"'); // Unescape quotes
        }
      }
      return fallback;
    };
  
    // Extract array values
    const extractArray = (key: string, fallback: any[] = []) => {
      const pattern = new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*(?:\\[[^\\]]*\\][^\\]]*)*)\\]`, 'i');
      const match = json.match(pattern);
      if (!match) return fallback;
      
      try {
        // Try to parse the array content
        const arrayContent = `[${match[1]}]`;
        return JSON.parse(arrayContent);
      } catch {
        // Fallback to simple string splitting for basic arrays
        const items = match[1].split(',').map(item => 
          item.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"')
        ).filter(item => item.length > 0);
        return items;
      }
    };
  
    // Build the response structure
    const rebuilt = {
      overall_score: extractValue('overall_score', 50),
      ats_score: extractValue('ats_score', 50),
      main_roast: extractValue('main_roast', 'Resume analysis encountered technical issues'),
      score_category: extractValue('score_category', 'Technical Error'),
      resume_sections: [],
      missing_sections: [],
      good_stuff: [{
        title: "Analysis Recovered",
        roast: "Despite JSON parsing chaos, we salvaged your resume feedback.",
        description: "The analysis was completed but required technical recovery."
      }],
      needs_work: [{
        title: "System Recovery",
        roast: "Even our AI parser needed some first aid after your resume.",
        issue: "Response formatting caused parsing complexity",
        fix: "Analysis completed successfully despite technical hiccups",
        example: "Your resume feedback is intact and ready for review"
      }],
      critical_issues: [],
      shareable_roasts: [{
        id: "main",
        text: extractValue('main_roast', 'Technical recovery successful'),
        category: "System Recovery",
        shareText: `This AI analyzed my resume despite technical challenges 🤖✨`,
        platform: "general"
      }],
      ats_issues: extractArray('ats_issues', ["Technical parsing complexity encountered"]),
      formatting_issues: [],
      keyword_analysis: {
        missing_keywords: extractArray('missing_keywords', []),
        overused_buzzwords: extractArray('overused_buzzwords', []),
        weak_action_verbs: extractArray('weak_action_verbs', [])
      },
      quantification_issues: {
        missing_metrics: extractArray('missing_metrics', []),
        vague_statements: extractArray('vague_statements', [])
      },
      action_plan: {
        immediate: [{
          title: "Review Results",
          description: "Check the analysis results that were successfully recovered",
          icon: "📋",
          color: "blue",
          time_estimate: "5 minutes"
        }],
        longTerm: [{
          title: "Continue Optimization",
          description: "Use the recovered feedback to improve your resume",
          icon: "🚀",
          color: "green",
          time_estimate: "1-2 hours"
        }]
      },
      industry_specific_advice: {
        detected_industry: extractValue('detected_industry', 'Professional Services'),
        industry_standards: extractArray('industry_standards', []),
        industry_keywords: extractArray('industry_keywords', [])
      }
    };
  
    console.log('Manual JSON reconstruction completed successfully');
    return rebuilt;
  }
  
  /**
   * Create a minimal fallback response when all parsing fails
   */
  function createFallbackResponse(): any {
    return {
      overall_score: 50,
      ats_score: 50,
      main_roast: "Technical parsing challenges encountered",
      score_category: "System Recovery",
      resume_sections: [],
      missing_sections: [],
      good_stuff: [{
        title: "Analysis Attempted",
        roast: "Your resume was brave enough to face our AI, even if the tech got wobbly.",
        description: "The system encountered parsing challenges but maintained professional service."
      }],
      needs_work: [{
        title: "System Resilience",
        roast: "Our parser needed therapy after your resume, but we're both fine now.",
        issue: "Complex response formatting challenged our JSON parser",
        fix: "Please try uploading your resume again for complete analysis",
        example: "System is designed to handle various resume formats and complexities"
      }],
      critical_issues: [],
      shareable_roasts: [{
        id: "main",
        text: "Technical parsing challenges encountered",
        category: "System Notice",
        shareText: "This AI had technical challenges with my resume but stayed professional 🤖💪",
        platform: "general"
      }],
      ats_issues: ["System encountered parsing complexity"],
      formatting_issues: [],
      keyword_analysis: {
        missing_keywords: [],
        overused_buzzwords: [],
        weak_action_verbs: []
      },
      quantification_issues: {
        missing_metrics: [],
        vague_statements: []
      },
      action_plan: {
        immediate: [{
          title: "Retry Analysis",
          description: "Upload your resume again for complete feedback",
          icon: "🔄",
          color: "blue",
          time_estimate: "2 minutes"
        }],
        longTerm: []
      },
      industry_specific_advice: {
        detected_industry: "Professional Services",
        industry_standards: [],
        industry_keywords: []
      }
    };
  }