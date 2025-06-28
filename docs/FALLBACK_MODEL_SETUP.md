# Fallback Model System

## Overview

The fallback model system automatically switches to a backup model when the primary model fails for any reason, including:

- API key issues or rate limits
- Model downtime or unavailability
- Network connectivity problems
- Credit exhaustion
- Any other API errors

## Quick Setup

### 1. Environment Variables

Add these to your `.env` file:

```bash
# Primary Model Configuration
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
MODEL_TEMPERATURE=0.1
MODEL_MAX_TOKENS=4000
MODEL_TOP_P=1.0
OPENAI_API_KEY=your_openai_api_key

# Fallback Model Configuration
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
FALLBACK_MODEL_TEMPERATURE=0.1
FALLBACK_MODEL_MAX_TOKENS=4000
FALLBACK_MODEL_TOP_P=1.0

# Additional API Keys (if using different providers)
GEMINI_API_KEY=your_gemini_api_key
```

### 2. Recommended Configurations

**Option 1: OpenAI Primary → OpenAI Fallback (Most Reliable)**

```bash
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
```

**Option 2: OpenAI Primary → Gemini Fallback (Cost-Effective)**

```bash
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
FALLBACK_MODEL_PROVIDER=gemini
FALLBACK_MODEL=gemini-1.5-flash
GEMINI_API_KEY=your_gemini_api_key
```

**Option 3: Gemini Primary → OpenAI Fallback (Reliability Backup)**

```bash
MODEL_PROVIDER=gemini
MODEL_NAME=gemini-1.5-flash
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
```

**Option 4: High Performance → Cost-Effective Fallback**

```bash
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
MODEL_MAX_TOKENS=8000
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
FALLBACK_MODEL_MAX_TOKENS=4000
```

## Advanced Configuration

### Parameter-Level Customization

You can now configure all model parameters individually:

```bash
# Primary Model - High Quality
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
MODEL_TEMPERATURE=0.1
MODEL_MAX_TOKENS=8000
MODEL_TOP_P=0.9

# Fallback Model - Fast & Economical
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
FALLBACK_MODEL_TEMPERATURE=0.2
FALLBACK_MODEL_MAX_TOKENS=4000
FALLBACK_MODEL_TOP_P=1.0
```

### Use Case Specific Configurations

**For Analysis Tasks (Accuracy First):**

```bash
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
MODEL_TEMPERATURE=0.1
MODEL_MAX_TOKENS=8000
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
```

**For Creative Tasks (Creativity + Reliability):**

```bash
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
MODEL_TEMPERATURE=0.7
MODEL_MAX_TOKENS=4000
FALLBACK_MODEL_PROVIDER=gemini
FALLBACK_MODEL=gemini-1.5-flash
FALLBACK_MODEL_TEMPERATURE=0.6
```

**For High-Volume Tasks (Cost Optimized):**

```bash
MODEL_PROVIDER=gemini
MODEL_NAME=gemini-1.5-flash
MODEL_TEMPERATURE=0.1
MODEL_MAX_TOKENS=4000
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
```

## How It Works

### Automatic Failover

1. **Primary Model Attempt**: All requests try the primary model first
2. **Failure Detection**: If primary fails for any reason, automatic failover occurs
3. **Fallback Execution**: Same request sent to fallback model with its own parameters
4. **Success Indication**: Response includes a note when fallback was used
5. **Error Handling**: If both fail, detailed error message is returned

### No Code Changes Required

The fallback system works transparently with all existing API endpoints:

- ✅ `/api/analyze-resume-stream`
- ✅ `/api/improve-resume-stream`
- ✅ `/api/improve-resume`
- ✅ `/api/tailor-resume`
- ✅ `/api/extract-job-info`

## Testing

### Configuration Test

Verify your configuration is loaded correctly:

```bash
# Test configuration loading
GET /api/config-test
```

**Expected Response:**

```json
{
  "message": "Configuration loaded from config.ts",
  "config": {
    "primary": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.1,
      "maxTokens": 4000,
      "topP": 1
    },
    "fallback": {
      "provider": "openai",
      "model": "gpt-4o-mini",
      "temperature": 0.1,
      "maxTokens": 4000,
      "topP": 1
    }
  }
}
```

### Fallback Test

Test if both models are working:

```bash
# Test if both models are working
GET /api/test-fallback

# Test with a real request
POST /api/test-fallback
{
  "message": "Hello, test the fallback system"
}
```

**Response Format:**

```json
{
  "results": {
    "primary": true, // Primary model status
    "fallback": true // Fallback model status
  },
  "recommendation": "Primary model is working correctly"
}
```

## Monitoring

### Log Messages

The system logs detailed information about fallback usage:

```bash
# Normal operation
[ConsolidatedModelService] Created openai provider with model gpt-4o-mini

# Fallback activation
[ConsolidatedModelService] Primary provider failed, trying fallback
[ConsolidatedModelService] Successfully used fallback provider

# Complete failure
[ConsolidatedModelService] Both primary and fallback providers failed
```

### Response Indicators

When fallback is used, responses include:

- **Non-streaming**: `<!-- Generated using fallback model -->` appended to content
- **Streaming**: Metadata chunk with `{ "usingFallback": true }`

## Best Practices

### 1. Choose Reliable Fallbacks

- **OpenAI gpt-4o-mini**: Most reliable, fast, cost-effective
- **Gemini 1.5-flash**: Good alternative, different provider
- Avoid using the same model as both primary and fallback

### 2. Monitor Usage

- Check logs regularly for fallback activations
- Set up alerts if fallback usage becomes frequent
- Consider switching primary/fallback if patterns emerge

### 3. API Key Management

- Ensure fallback provider has valid API keys
- Consider different billing accounts for redundancy
- Test both keys regularly with `/api/test-fallback`

### 4. Performance Considerations

- Fallback adds slight latency only when primary fails
- No performance impact during normal operation
- Streaming responses maintain real-time feel
- Different parameters for primary/fallback optimize for different scenarios

## Parameter Guidelines

### Temperature

- **0.1**: Consistent, factual responses (analysis, extraction)
- **0.3**: Balanced creativity and consistency (general tasks)
- **0.7**: Creative, varied responses (writing, brainstorming)

### Max Tokens

- **2000**: Quick responses, simple tasks
- **4000**: Standard responses, most use cases
- **8000**: Detailed responses, complex analysis

### Top P

- **0.9**: More focused responses
- **1.0**: Full vocabulary range (recommended)

## Troubleshooting

### Configuration Not Loading

```bash
# Check config test endpoint
GET /api/config-test

# Verify environment variables
echo $MODEL_PROVIDER
echo $FALLBACK_MODEL_PROVIDER
```

### Both Models Failing

```bash
# Check API keys
OPENAI_API_KEY=valid_key_here
GEMINI_API_KEY=valid_key_here

# Verify model names
FALLBACK_MODEL=gpt-4o-mini  # ✅ Correct
FALLBACK_MODEL=gpt4-mini    # ❌ Wrong
```

### Fallback Not Activating

1. Check environment variables are set
2. Verify fallback model name is correct
3. Ensure fallback provider API key is valid
4. Test with `/api/test-fallback` endpoint
5. Check that primary is actually failing

### High Fallback Usage

- Primary model may have issues
- Check primary provider status page
- Consider switching models
- Review API key limits/quotas

### Parameter Issues

```bash
# Check numeric parameters parse correctly
MODEL_TEMPERATURE=0.1        # ✅ Valid
MODEL_TEMPERATURE=zero       # ❌ Invalid

MODEL_MAX_TOKENS=4000        # ✅ Valid
MODEL_MAX_TOKENS=four-thousand # ❌ Invalid
```

## Cost Considerations

### Minimal Additional Cost

- Fallback only used when primary fails
- No duplicate requests in normal operation
- Cost is only for actual fallback usage

### Optimization Tips

- Use cost-effective fallback models (gpt-4o-mini, gemini-1.5-flash)
- Set lower max tokens for fallback if appropriate
- Monitor fallback frequency
- Switch to cheaper primary if fallback works better

### Cost-Effective Configurations

```bash
# Expensive primary, cheap fallback
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
FALLBACK_MODEL_PROVIDER=gemini
FALLBACK_MODEL=gemini-1.5-flash

# Balanced cost approach
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL=gpt-4o-mini
FALLBACK_MODEL_MAX_TOKENS=2000  # Lower token limit for fallback
```

## Advanced Configuration

### Environment-Specific Settings

```bash
# Development - Fast and cheap
NODE_ENV=development
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o-mini
MODEL_MAX_TOKENS=2000

# Production - High quality
NODE_ENV=production
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
MODEL_MAX_TOKENS=8000
```

### Multiple Fallback Levels

Currently supports one fallback level. Can be extended to support multiple fallback tiers if needed.

### Custom Configuration in Code

```typescript
// Override config for specific requests
import { modelConfigs } from "@/lib/config";

// Use economical config for bulk operations
const economicalProvider = createModelProvider(modelConfigs.economical);
```

## Summary

✅ **Zero Configuration Required** - Works with existing code
✅ **Automatic Failover** - No manual intervention needed
✅ **Transparent Operation** - Users don't notice the switch
✅ **Detailed Logging** - Full visibility into fallback usage
✅ **Cost Effective** - Only pay for actual fallback usage
✅ **Easy Testing** - Built-in test endpoints for verification
✅ **Parameter Control** - Configure all model parameters independently
✅ **Environment Variables** - Full configuration via env vars

The fallback system provides enterprise-grade reliability with minimal setup and maximum flexibility for different use cases and environments.
