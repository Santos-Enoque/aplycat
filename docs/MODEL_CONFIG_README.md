# Model Configuration Environment Variables

This file documents all available environment variables for configuring AI models in AplyCat.

## Primary Model Configuration

These variables control the main AI model used for resume analysis and improvements:

```bash
# Provider: openai, gemini, or anthropic
MODEL_PROVIDER=gemini

# Model name (provider-specific)
MODEL_NAME=gemini-2.0-flash

# Temperature (0.0-2.0, controls randomness)
MODEL_TEMPERATURE=0.1

# Maximum tokens for response
MODEL_MAX_TOKENS=4000

# Top-p sampling (0.0-1.0)
MODEL_TOP_P=1
```

## Fallback Model Configuration

These variables control the fallback model used when the primary model fails:

```bash
# Fallback provider
FALLBACK_MODEL_PROVIDER=openai

# Fallback model name
FALLBACK_MODEL_NAME=gpt-4o-mini

# Fallback temperature
FALLBACK_MODEL_TEMPERATURE=0.1

# Fallback max tokens
FALLBACK_MODEL_MAX_TOKENS=4000

# Fallback top-p
FALLBACK_MODEL_TOP_P=1
```

## Predefined Configuration Overrides

You can customize the predefined configurations (fast, detailed, creative, economical) using these variables:

### Fast Mode (optimized for speed)

```bash
FAST_MODEL_PROVIDER=openai
FAST_MODEL_NAME=gpt-4o-mini
FAST_MODEL_TEMPERATURE=0.1
FAST_MODEL_MAX_TOKENS=2000
FAST_MODEL_TOP_P=1
```

### Detailed Mode (optimized for quality)

```bash
DETAILED_MODEL_PROVIDER=openai
DETAILED_MODEL_NAME=gpt-4o
DETAILED_MODEL_TEMPERATURE=0.1
DETAILED_MODEL_MAX_TOKENS=8000
DETAILED_MODEL_TOP_P=1
```

### Creative Mode (higher temperature for creativity)

```bash
CREATIVE_MODEL_PROVIDER=gemini
CREATIVE_MODEL_NAME=gemini-2.0-flash
CREATIVE_MODEL_TEMPERATURE=0.7
CREATIVE_MODEL_MAX_TOKENS=4000
CREATIVE_MODEL_TOP_P=1
```

### Economical Mode (cost-effective models)

```bash
ECONOMICAL_MODEL_PROVIDER=gemini
ECONOMICAL_MODEL_NAME=gemini-1.5-flash
ECONOMICAL_MODEL_TEMPERATURE=0.1
ECONOMICAL_MODEL_MAX_TOKENS=4000
ECONOMICAL_MODEL_TOP_P=1
```

## Usage Examples

### Using OpenAI as Primary with Gemini Fallback

```bash
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
FALLBACK_MODEL_PROVIDER=gemini
FALLBACK_MODEL_NAME=gemini-2.0-flash
```

### Using Gemini as Primary with OpenAI Fallback (default)

```bash
MODEL_PROVIDER=gemini
MODEL_NAME=gemini-2.0-flash
FALLBACK_MODEL_PROVIDER=openai
FALLBACK_MODEL_NAME=gpt-4o-mini
```

### High-Quality Setup

```bash
MODEL_PROVIDER=openai
MODEL_NAME=gpt-4o
MODEL_TEMPERATURE=0.05
MODEL_MAX_TOKENS=8000
```

### Cost-Optimized Setup

```bash
MODEL_PROVIDER=gemini
MODEL_NAME=gemini-1.5-flash
MODEL_TEMPERATURE=0.1
MODEL_MAX_TOKENS=2000
```

## Parameter Explanations

- **Provider**: The AI service provider (openai, gemini, anthropic)
- **Model Name**: Specific model version to use
- **Temperature**: Controls randomness (0.0 = deterministic, 2.0 = very creative)
- **Max Tokens**: Maximum length of the AI response
- **Top-p**: Nucleus sampling parameter (0.1 = conservative, 1.0 = full vocabulary)

## Important Notes

1. All environment variables are optional - the system will use sensible defaults
2. Invalid values will fallback to defaults with console warnings
3. Changes require application restart to take effect
4. Model availability depends on your API keys and quotas
5. The fallback system ensures resilience when the primary model fails

## Required API Keys

Make sure you have the appropriate API keys configured:

```bash
# For OpenAI models
OPENAI_API_KEY=your_openai_key

# For Gemini models
GEMINI_API_KEY=your_gemini_key

# For Anthropic models (if using)
ANTHROPIC_API_KEY=your_anthropic_key
```
