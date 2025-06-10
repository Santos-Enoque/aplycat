import { NextRequest } from 'next/server'

// Mock user data for testing
export const mockUser = {
  id: 'user_test123',
  emailAddresses: [{ emailAddress: 'test@example.com' }],
  firstName: 'Test',
  lastName: 'User',
}

export const mockDbUser = {
  id: 'db_user_123',
  clerkId: 'user_test123',
  email: 'test@example.com',
  credits: 100,
  totalCreditsUsed: 50,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

// Sample resume data for testing
export const mockResumeData = {
  resumeId: 'resume_123',
  fileName: 'test-resume.pdf',
  fileData: 'base64-encoded-pdf-data',
  userId: 'user_test123',
}

// Sample analysis response
export const mockAnalysisResponse = {
  overall_score: 85,
  ats_score: 78,
  score_category: 'Good',
  main_roast: 'Your resume is solid with room for improvement.',
  detailed_feedback: {
    strengths: ['Good formatting', 'Relevant experience'],
    weaknesses: ['Missing keywords', 'Too long'],
    suggestions: ['Add more quantified achievements', 'Reduce length to 1-2 pages']
  },
  keyword_analysis: {
    found_keywords: ['JavaScript', 'React', 'Node.js'],
    missing_keywords: ['TypeScript', 'AWS', 'Docker'],
    keyword_density: 0.15
  }
}

// Sample job description for testing
export const mockJobDescription = `
Senior Software Engineer
Company: Tech Corp
Location: San Francisco, CA

We are looking for a senior software engineer with experience in:
- JavaScript/TypeScript
- React and Node.js
- AWS cloud services
- Docker and Kubernetes
- Agile development methodologies

Requirements:
- 5+ years of software development experience
- Bachelor's degree in Computer Science or related field
- Experience with microservices architecture
- Strong problem-solving skills
`

// Mock API request helper
export function createMockRequest(body: any, method: string = 'POST'): NextRequest {
  const url = 'http://localhost:3000/api/test'
  const request = new Request(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })

  return new NextRequest(request)
}

// Mock database operations
export const mockDb = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
    create: jest.fn(),
  },
  resume: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  analysis: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
  },
  creditTransaction: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
}

// Mock model service responses
export const mockModelService = {
  analyzeResume: jest.fn(),
  improveResume: jest.fn(),
  tailorResume: jest.fn(),
  extractJobInfo: jest.fn(),
  generateResponse: jest.fn(),
}

// Mock streaming model service
export const mockStreamingModelService = {
  improveResume: jest.fn(),
  tailorResume: jest.fn(),
  analyzeResumeStream: jest.fn(),
}

// Helper to create mock file input
export function createMockFileInput(filename: string = 'test.pdf', data: string = 'test-data') {
  return {
    filename,
    fileData: Buffer.from(data).toString('base64'),
    mimeType: 'application/pdf',
  }
}

// Helper to create mock analysis result
export function createMockAnalysis(overrides: any = {}) {
  return {
    id: 'analysis_123',
    userId: 'db_user_123',
    resumeId: 'resume_123',
    fileName: 'test-resume.pdf',
    processingTimeMs: 1500,
    overallScore: 85,
    atsScore: 78,
    scoreCategory: 'Good',
    mainRoast: 'Your resume is solid with room for improvement.',
    analysisData: mockAnalysisResponse,
    creditsUsed: 1,
    isCompleted: true,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides,
  }
}

// Helper to create mock credit transaction
export function createMockCreditTransaction(overrides: any = {}) {
  return {
    id: 'transaction_123',
    userId: 'db_user_123',
    type: 'ANALYSIS_USE',
    amount: -1,
    description: 'Resume analysis: test-resume.pdf',
    relatedAnalysisId: 'analysis_123',
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }
}

// Mock OpenAI response
export const mockOpenAIResponse = {
  choices: [
    {
      message: {
        content: JSON.stringify(mockAnalysisResponse),
      },
    },
  ],
  usage: {
    prompt_tokens: 1000,
    completion_tokens: 500,
    total_tokens: 1500,
  },
}

// Mock Clerk user authentication
export function mockClerkAuth(user = mockUser) {
  jest.doMock('@clerk/nextjs/server', () => ({
    currentUser: jest.fn().mockResolvedValue(user),
  }))
}

// Mock database module
export function mockDatabase(dbMock = mockDb) {
  jest.doMock('@/lib/db', () => ({
    db: dbMock,
  }))
}

// Clean up function for tests
export function cleanupMocks() {
  if (typeof jest !== 'undefined') {
    jest.clearAllMocks()
    jest.resetModules()
  }
}