// lib/json-parser.ts
/**
 * Robust JSON parser specifically designed to handle OpenAI's inconsistent JSON responses
 * Handles common issues like:
 * - Unescaped quotes in string values
 * - Single quotes used instead of double quotes for JSON values
 * - Backslash escape sequences in examples
 * - Mixed quote types
 * - Newlines and special characters
 */

interface ParseResult {
    success: boolean;
    data?: any;
    error?: string;
    strategy?: string;
    rawResponse?: string; // For debugging
  }
  
  export function parseOpenAIResponse(rawResponse: string): ParseResult {
    if (!rawResponse?.trim()) {
      console.error('[JSON_PARSER] Empty response received');
      return {
        success: false,
        error: 'Empty response from OpenAI',
        rawResponse,
      };
    }

    console.log('[JSON_PARSER] Starting JSON parse with response length:', rawResponse.length);
    console.log('[JSON_PARSER] Response preview:', rawResponse.substring(0, 200) + '...');

    let cleanedResult = rawResponse.trim();
    
    // Remove markdown code blocks if present
    if (cleanedResult.startsWith('```json')) {
      console.log('[JSON_PARSER] Removing JSON markdown blocks');
      cleanedResult = cleanedResult.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedResult.startsWith('```')) {
      console.log('[JSON_PARSER] Removing generic markdown blocks');
      cleanedResult = cleanedResult.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // Strategy 1: Try parsing as-is (fastest path)
    try {
      console.log('[JSON_PARSER] Attempting direct parse...');
      const result = JSON.parse(cleanedResult);
      console.log('[JSON_PARSER] ✅ Direct parse successful');
      return {
        success: true,
        data: result,
        strategy: 'direct',
      };
    } catch (error) {
      console.log('[JSON_PARSER] ❌ Direct parse failed:', error instanceof Error ? error.message : 'Unknown error');
      console.log('[JSON_PARSER] Response sample around error:', cleanedResult.substring(0, 500));
    }

    // Strategy 2: Fix single quotes in JSON property values (NEW)
    try {
      console.log('[JSON_PARSER] Attempting single quote fix...');
      const singleQuoteFixed = fixSingleQuotes(cleanedResult);
      const result = JSON.parse(singleQuoteFixed);
      console.log('[JSON_PARSER] ✅ Single quote fix successful');
      return {
        success: true,
        data: result,
        strategy: 'single-quote-fix',
      };
    } catch (error) {
      console.log('[JSON_PARSER] ❌ Single quote fix failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 3: Fix common escape sequence issues
    try {
      console.log('[JSON_PARSER] Attempting escape sequence fix...');
      const escapedFixed = fixEscapeSequences(cleanedResult);
      const result = JSON.parse(escapedFixed);
      console.log('[JSON_PARSER] ✅ Escape sequence fix successful');
      return {
        success: true,
        data: result,
        strategy: 'escape-fix',
      };
    } catch (error) {
      console.log('[JSON_PARSER] ❌ Escape fix failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 4: Comprehensive quote and content cleaning
    try {
      console.log('[JSON_PARSER] Attempting comprehensive quote fix...');
      const quoteFixed = fixQuotesAndContent(cleanedResult);
      const result = JSON.parse(quoteFixed);
      console.log('[JSON_PARSER] ✅ Quote fix successful');
      return {
        success: true,
        data: result,
        strategy: 'quote-fix',
      };
    } catch (error) {
      console.log('[JSON_PARSER] ❌ Quote fix failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 5: Regex-based JSON repair
    try {
      console.log('[JSON_PARSER] Attempting regex-based repair...');
      const regexFixed = repairJsonWithRegex(cleanedResult);
      const result = JSON.parse(regexFixed);
      console.log('[JSON_PARSER] ✅ Regex repair successful');
      return {
        success: true,
        data: result,
        strategy: 'regex-repair',
      };
    } catch (error) {
      console.log('[JSON_PARSER] ❌ Regex repair failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Strategy 6: Manual key extraction and reconstruction
    try {
      console.log('[JSON_PARSER] Attempting manual reconstruction...');
      const manuallyBuilt = extractAndRebuildJson(cleanedResult);
      console.log('[JSON_PARSER] ✅ Manual reconstruction successful');
      return {
        success: true,
        data: manuallyBuilt,
        strategy: 'manual-rebuild',
      };
    } catch (error) {
      console.error('[JSON_PARSER] ❌ Manual reconstruction failed:', error instanceof Error ? error.message : 'Unknown error');
    }

    // Final fallback
    console.error('[JSON_PARSER] ❌ All parsing strategies failed, using fallback response');
    console.error('[JSON_PARSER] Raw response for debugging:', rawResponse.substring(0, 1000));
    
    return {
      success: false,
      error: 'Could not parse OpenAI response after all strategies',
      data: createFallbackResponse(),
      rawResponse: rawResponse.substring(0, 1000), // Include sample for debugging
    };
  }

  /**
   * NEW: Fix single quotes used for JSON property values
   * This handles the specific issue where AI returns 'value' instead of "value"
   */
  function fixSingleQuotes(json: string): string {
    console.log('[JSON_PARSER] Fixing single quotes in JSON...');
    
    return json
      // Fix single quotes around property values (but not within strings)
      .replace(/:\s*'([^']*)'/g, (match, content) => {
        // Escape any double quotes within the content
        const escapedContent = content.replace(/"/g, '\\"');
        return `: "${escapedContent}"`;
      })
      // Fix single quotes around property names
      .replace(/([{,]\s*)'([^']*)'(\s*:)/g, '$1"$2"$3')
      // Handle nested quotes more carefully
      .replace(/'([^']*(?:[^']|'[^,}\]]*)*?)'/g, (match, content) => {
        // If this looks like a property value (preceded by :), convert to double quotes
        const beforeMatch = json.substring(0, json.indexOf(match));
        if (beforeMatch.match(/:\s*$/)) {
          const escapedContent = content.replace(/"/g, '\\"');
          return `"${escapedContent}"`;
        }
        return match; // Leave other single quotes alone
      });
  }

  /**
   * Fix escape sequences that commonly break JSON parsing
   */
  function fixEscapeSequences(json: string): string {
    console.log('[JSON_PARSER] Fixing escape sequences...');
    
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
    console.log('[JSON_PARSER] Fixing quotes and content...');
    
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
    console.log('[JSON_PARSER] Attempting regex-based repairs...');
    
    return json
      // Fix missing commas between object properties
      .replace(/}(\s*){/g, '},$1{')
      .replace(/](\s*)\[/g, '],$1[')
      // Fix trailing commas
      .replace(/,(\s*[}\]])/g, '$1')
      // Fix quote inconsistencies in property names
      .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
      // Fix single quotes around property values (additional pass)
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
    console.log('[JSON_PARSER] Attempting manual JSON reconstruction...');
    
    // Extract core values with more robust regex patterns
    const extractValue = (key: string, fallback: any = null) => {
      const patterns = [
        // Handle both single and double quotes
        new RegExp(`"${key}"\\s*:\\s*"([^"]*(?:\\\\.[^"]*)*)"`, 'i'),
        new RegExp(`"${key}"\\s*:\\s*'([^']*(?:\\\\.[^']*)*)'`, 'i'),
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
          return value;
        }
      }
      return fallback;
    };

    // Extract arrays with better handling
    const extractArray = (key: string, fallback: any[] = []) => {
      try {
        const patterns = [
          new RegExp(`"${key}"\\s*:\\s*\\[([^\\]]*(?:\\[[^\\]]*\\][^\\]]*)*)\\]`, 'is'),
        ];
        
        for (const pattern of patterns) {
          const match = json.match(pattern);
          if (match) {
            let arrayContent = match[1];
            // Simple array parsing - split by commas not within quotes
            const items = [];
            let currentItem = '';
            let inQuotes = false;
            let quoteChar = '';
            
            for (let i = 0; i < arrayContent.length; i++) {
              const char = arrayContent[i];
              
              if ((char === '"' || char === "'") && !inQuotes) {
                inQuotes = true;
                quoteChar = char;
                currentItem += char;
              } else if (char === quoteChar && inQuotes) {
                inQuotes = false;
                currentItem += char;
              } else if (char === ',' && !inQuotes) {
                const trimmed = currentItem.trim();
                if (trimmed) {
                  // Clean up the item
                  let cleanItem = trimmed.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
                  items.push(cleanItem);
                }
                currentItem = '';
              } else {
                currentItem += char;
              }
            }
            
            // Add the last item
            const trimmed = currentItem.trim();
            if (trimmed) {
              let cleanItem = trimmed.replace(/^["']|["']$/g, '');
              items.push(cleanItem);
            }
            
            return items;
          }
        }
      } catch (error) {
        console.log(`[JSON_PARSER] Failed to extract array ${key}:`, error);
      }
      return fallback;
    };

    // Build the response object
    const result = {
      overall_score: extractValue('overall_score', 50),
      ats_score: extractValue('ats_score', 50),
      main_roast: extractValue('main_roast', 'Unable to analyze - JSON parsing error'),
      score_category: extractValue('score_category', 'Technical Issue'),
      resume_sections: [],
      missing_sections: [],
      good_stuff: [],
      needs_work: [],
      critical_issues: [],
      shareable_roasts: [],
      ats_issues: extractArray('ats_issues'),
      formatting_issues: [],
      keyword_analysis: {
        missing_keywords: extractArray('missing_keywords'),
        overused_buzzwords: extractArray('overused_buzzwords'),
        weak_action_verbs: extractArray('weak_action_verbs'),
      },
      quantification_issues: {
        missing_metrics: extractArray('missing_metrics'),
        vague_statements: extractArray('vague_statements'),
      },
      action_plan: {
        immediate: [],
        longTerm: [],
      },
      recommendations: {
        priority: extractValue('priority', 'High'),
        timeline: extractValue('timeline', '1 week'),
        next_steps: extractArray('next_steps'),
      },
    };

    console.log('[JSON_PARSER] Manual reconstruction completed with basic structure');
    return result;
  }

  /**
   * Create a fallback response when all parsing fails
   */
  function createFallbackResponse(): any {
    console.log('[JSON_PARSER] Creating fallback response');
    
    return {
      overall_score: 50,
      ats_score: 50,
      main_roast: "Technical issue prevented proper analysis",
      score_category: "System Error",
      resume_sections: [{
        section_name: "Technical Issue",
        found: false,
        score: 0,
        roast: "Our JSON parsing had a hairball! Please try again.",
        issues: ["JSON parsing failed", "Unable to analyze resume structure"],
        strengths: [],
        improvements: [{
          issue: "System processing error",
          fix: "Please try submitting your resume again",
          example: "No changes needed on your end"
        }]
      }],
      missing_sections: [],
      good_stuff: [],
      needs_work: [{
        title: "System Recovery",
        roast: "Even I can't analyze what I can't parse!",
        issue: "Technical processing error",
        fix: "Please try again - our system needs a moment",
        example: "No action needed from you"
      }],
      critical_issues: [],
      shareable_roasts: [{
        id: "main",
        text: "Technical issue prevented proper analysis",
        category: "System Error",
        shareText: "The AI had a technical hiccup analyzing my resume 🤖",
        platform: "general"
      }],
      ats_issues: ["Unable to analyze due to technical issue"],
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
          title: "Try Again",
          description: "Please resubmit your resume for analysis",
          icon: "🔄",
          color: "blue",
          time_estimate: "1 minute"
        }],
        longTerm: []
      },
      recommendations: {
        priority: "High",
        timeline: "Immediate",
        next_steps: ["Please try submitting your resume again"]
      }
    };
  }