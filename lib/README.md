# Aplycat AI Model Abstraction Layer

This directory contains the abstracted AI model layer that allows switching between different AI providers (currently OpenAI and Google Gemini) for resume-related operations.

## Files Structure

```
lib/
├── models.ts              # Main model abstraction layer
├── prompts/
│   └── resume-prompts.ts  # Centralized prompts for all resume operations
└── README.md             # This documentation
```

## How to Switch Model Providers

### Environment Variables

Add these environment variables to your `.env.local` file:

```env
# Model Configuration
MODEL_PROVIDER=openai          # or "gemini"

# OpenAI Configuration (required if using OpenAI)
OPENAI_API_KEY=your_openai_key

# Gemini Configuration (required if using Gemini)
GEMINI_API_KEY=your_gemini_key
```

### Switching Providers

1. **To use OpenAI (default):**

   ```env
   MODEL_PROVIDER=openai
   OPENAI_API_KEY=sk-your-key-here
   ```

2. **To use Google Gemini:**
   ```env
   MODEL_PROVIDER=gemini
   GEMINI_API_KEY=your-gemini-key-here
   ```

### Available Models

**OpenAI:**

- `gpt-4o-mini` (default)
- `gpt-4o`
- `gpt-4-turbo`

**Gemini:**

- `gemini-1.5-flash` (default)
- `gemini-1.5-pro`
- `gemini-pro`

## Usage Examples

### Basic Usage (using defaults)

```typescript
import { modelService } from "@/lib/models";

// The service automatically uses the configured provider
const response = await modelService.analyzeResume(
  systemPrompt,
  userPrompt,
  resumeFile
);
```

### Custom Configuration

```typescript
import { ModelService, ModelConfig } from "@/lib/models";

const customConfig: ModelConfig = {
  provider: "gemini",
  model: "gemini-1.5-pro",
  temperature: 0.2,
  maxTokens: 8000,
};

const customModelService = new ModelService(customConfig);
const response = await customModelService.analyzeResume(
  systemPrompt,
  userPrompt,
  resumeFile
);
```

## Supported Operations

All endpoints use the model service for the following operations:

1. **Resume Analysis** (`analyzeResume`)

   - Analyzes resume content and provides feedback
   - Supports file uploads (PDF)

2. **Resume Improvement** (`improveResume`)

   - Creates improved versions of resumes
   - Supports file uploads (PDF)

3. **Resume Tailoring** (`tailorResume`)

   - Tailors resumes for specific job descriptions
   - Text-only operation

4. **Job Info Extraction** (`extractJobInfo`)
   - Extracts job information from URLs
   - Uses web search tools

## Prompts Management

All prompts are centralized in `prompts/resume-prompts.ts`:

- `RESUME_ANALYSIS_SYSTEM_PROMPT`
- `RESUME_ANALYSIS_USER_PROMPT`
- `JOB_EXTRACTION_SYSTEM_PROMPT`
- `JOB_EXTRACTION_USER_PROMPT`
- `RESUME_IMPROVEMENT_SYSTEM_PROMPT`
- `RESUME_IMPROVEMENT_USER_PROMPT`
- `RESUME_TAILORING_SYSTEM_PROMPT`
- `RESUME_TAILORING_USER_PROMPT`

To update prompts, simply edit the corresponding constant in the prompts file. Changes will be reflected across all endpoints immediately.

## Error Handling

The model service includes robust error handling:

- Provider-specific error messages
- Fallback mechanisms for API failures
- Proper error logging and monitoring

## Performance Considerations

- **OpenAI**: Generally faster response times, better structured output
- **Gemini**: More cost-effective, good for high-volume operations
- **File Processing**: Both providers support PDF file analysis
- **Token Limits**: Automatically managed per provider specifications

## Troubleshooting

### Common Issues

1. **Missing API Keys**

   - Ensure the correct API key is set for your chosen provider
   - Check that `MODEL_PROVIDER` matches your available keys

2. **File Upload Issues**

   - Verify file is properly base64 encoded
   - Check file size limits (varies by provider)

3. **JSON Parsing Errors**
   - The system includes robust JSON parsing with fallback strategies
   - Check logs for specific parsing errors

### Debugging

Enable debug logging by checking the console output for detailed request/response information:

```typescript
console.log("[MODEL_SERVICE] Provider:", config.provider);
console.log("[MODEL_SERVICE] Model:", config.model);
```

## Future Enhancements

- Support for additional providers (Claude, PaLM, etc.)
- Dynamic provider selection based on operation type
- Automatic failover between providers
- Enhanced caching mechanisms
- Provider-specific optimization strategies
