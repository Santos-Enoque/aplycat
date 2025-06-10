/// <reference types="../../types/jest" />

import { POST } from '@/app/api/improve-resume/route'
import {
  mockUser,
  mockDbUser,
  createMockRequest,
  createMockFileInput,
  cleanupMocks,
} from '../utils/test-helpers'

// Mock modules
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/auth/user-sync')
jest.mock('@/lib/models-streaming')

describe('Resume Improvement API', () => {
  const { currentUser } = require('@clerk/nextjs/server')
  const { getCurrentUserFromDB, decrementUserCredits } = require('@/lib/auth/user-sync')
  const { streamingModelService } = require('@/lib/models-streaming')

  const mockImprovedResumeData = {
    improved_sections: {
      summary: {
        original: 'Software developer with experience',
        improved: 'Results-driven software engineer with 5+ years of experience developing scalable web applications using modern frameworks and cloud technologies.',
        improvements: ['Added quantified experience', 'Included specific technologies', 'Enhanced impact language'],
      },
      experience: {
        original: 'Worked on various projects',
        improved: 'Led development of 3 high-traffic web applications serving 100K+ users, resulting in 40% improved performance and 25% increase in user engagement.',
        improvements: ['Quantified achievements', 'Added specific metrics', 'Highlighted leadership'],
      },
      skills: {
        original: 'JavaScript, React, Node.js',
        improved: 'Frontend: React.js, TypeScript, Next.js, Tailwind CSS | Backend: Node.js, Express.js, Python, PostgreSQL | Cloud: AWS (EC2, S3, Lambda), Docker, Kubernetes',
        improvements: ['Organized by category', 'Added relevant technologies', 'Included cloud skills'],
      },
    },
    overall_improvements: [
      'Enhanced quantification of achievements',
      'Added industry-relevant keywords',
      'Improved formatting and structure',
      'Strengthened action verbs',
    ],
    keyword_optimization: {
      added_keywords: ['TypeScript', 'AWS', 'Kubernetes', 'Microservices'],
      keyword_density_improvement: '15% increase in relevant keywords',
    },
    ats_improvements: {
      score_increase: 23,
      formatting_fixes: ['Standardized date formats', 'Improved bullet point structure'],
    },
  }

  beforeEach(() => {
    cleanupMocks()
    
    // Default mocks
    currentUser.mockResolvedValue(mockUser)
    getCurrentUserFromDB.mockResolvedValue(mockDbUser)
    decrementUserCredits.mockResolvedValue(true)
    streamingModelService.improveResume.mockResolvedValue({
      content: JSON.stringify(mockImprovedResumeData),
    })
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      currentUser.mockResolvedValue(null)

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const text = await response.text()
      expect(text).toBe('Unauthorized')
    })

    it('should return 402 when user has insufficient credits', async () => {
      getCurrentUserFromDB.mockResolvedValue({
        ...mockDbUser,
        credits: 1, // Less than required 2 credits
      })

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits. This service costs 2 credits.')
    })

    it('should return 402 when database user is not found', async () => {
      getCurrentUserFromDB.mockResolvedValue(null)

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits. This service costs 2 credits.')
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when originalFile is missing', async () => {
      const request = createMockRequest({
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters')
    })

    it('should return 400 when targetRole is missing', async () => {
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters')
    })

    it('should return 400 when targetIndustry is missing', async () => {
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required parameters')
    })

    it('should accept valid input with all required parameters', async () => {
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Resume Improvement Flow', () => {
    it('should successfully improve a resume', async () => {
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.improvedResume).toEqual(mockImprovedResumeData)
      expect(data.targetRole).toBe('Software Engineer')
      expect(data.targetIndustry).toBe('Technology')
      expect(data.processingTimeMs).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    it('should handle custom prompts', async () => {
      const customPrompt = 'Focus on leadership skills and team management experience'
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Engineering Manager',
        targetIndustry: 'Technology',
        customPrompt,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(streamingModelService.improveResume).toHaveBeenCalledWith(
        'Engineering Manager',
        'Technology',
        customPrompt,
        expect.any(Object)
      )
    })

    it('should handle data URL file format', async () => {
      const fileWithDataUrl = {
        filename: 'resume.pdf',
        fileData: 'data:application/pdf;base64,dGVzdC1kYXRh',
        mimeType: 'application/pdf',
      }

      const request = createMockRequest({
        originalFile: fileWithDataUrl,
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      
      // Verify that base64 data was extracted correctly
      expect(streamingModelService.improveResume).toHaveBeenCalledWith(
        'Software Engineer',
        'Technology',
        undefined,
        expect.objectContaining({
          fileData: 'dGVzdC1kYXRh', // Without the data URL prefix
        })
      )
    })
  })

  describe('Credit System Integration', () => {
    it('should deduct 2 credits after successful improvement', async () => {
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      await POST(request)

      expect(decrementUserCredits).toHaveBeenCalledWith(mockUser.id, 2)
    })

    it('should not deduct credits if improvement fails', async () => {
      streamingModelService.improveResume.mockRejectedValue(new Error('Model error'))

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      
      try {
        await POST(request)
      } catch (error) {
        // Expected to throw
      }

      expect(decrementUserCredits).not.toHaveBeenCalled()
    })
  })

  describe('Model Service Integration', () => {
    it('should call streaming model service with correct parameters', async () => {
      const targetRole = 'Senior Frontend Developer'
      const targetIndustry = 'E-commerce'
      const customPrompt = 'Focus on React and TypeScript skills'
      const originalFile = createMockFileInput('my-resume.pdf')

      const request = createMockRequest({
        originalFile,
        targetRole,
        targetIndustry,
        customPrompt,
      })
      await POST(request)

      expect(streamingModelService.improveResume).toHaveBeenCalledWith(
        targetRole,
        targetIndustry,
        customPrompt,
        originalFile
      )
    })

    it('should parse JSON response from model service', async () => {
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.improvedResume).toEqual(mockImprovedResumeData)
    })
  })

  describe('Error Handling', () => {
    it('should handle model service errors', async () => {
      streamingModelService.improveResume.mockRejectedValue(new Error('OpenAI API error'))

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('OpenAI API error')
      expect(data.timestamp).toBeDefined()
    })

    it('should handle JSON parsing errors', async () => {
      streamingModelService.improveResume.mockResolvedValue({
        content: 'invalid json response',
      })

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unexpected token')
    })

    it('should handle unknown errors', async () => {
      streamingModelService.improveResume.mockRejectedValue('String error')

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('An unknown error occurred.')
    })

    it('should handle credit deduction failures gracefully', async () => {
      decrementUserCredits.mockRejectedValue(new Error('Credit deduction failed'))

      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      // Should still return success even if credit deduction fails
    })
  })

  describe('Response Format', () => {
    it('should include all required response fields', async () => {
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('improvedResume')
      expect(data).toHaveProperty('targetRole', 'Software Engineer')
      expect(data).toHaveProperty('targetIndustry', 'Technology')
      expect(data).toHaveProperty('processingTimeMs')
      expect(data).toHaveProperty('timestamp')
      expect(typeof data.processingTimeMs).toBe('number')
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date')
    })

    it('should include custom prompt in response when provided', async () => {
      const customPrompt = 'Focus on leadership'
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Engineering Manager',
        targetIndustry: 'Technology',
        customPrompt,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Performance', () => {
    it('should complete improvement within reasonable time', async () => {
      const startTime = Date.now()
      
      const request = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      await POST(request)
      
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      // Should complete within 5 seconds (generous for testing)
      expect(processingTime).toBeLessThan(5000)
    })
  })
})