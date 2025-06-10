import { NextRequest } from 'next/server'
import { POST } from '@/app/api/analyze-resume/route'
import {
  mockUser,
  mockDbUser,
  mockResumeData,
  mockAnalysisResponse,
  createMockRequest,
  createMockAnalysis,
  createMockCreditTransaction,
  cleanupMocks,
} from '../utils/test-helpers'

// Mock modules
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/auth/user-sync')
jest.mock('@/lib/models-updated')
jest.mock('@/lib/resume-storage')
jest.mock('@/lib/db')
jest.mock('@/lib/json-parser')
jest.mock('@/lib/redis-cache')

describe('Resume Analysis API', () => {
  const { currentUser } = require('@clerk/nextjs/server')
  const { getCurrentUserFromDB } = require('@/lib/auth/user-sync')
  const { modelService } = require('@/lib/models-updated')
  const { getResumeData } = require('@/lib/resume-storage')
  const { parseOpenAIResponse } = require('@/lib/json-parser')
  const { db } = require('@/lib/db')
  const { dashboardCache } = require('@/lib/redis-cache')

  beforeEach(() => {
    cleanupMocks()
    
    // Default mocks
    currentUser.mockResolvedValue(mockUser)
    getCurrentUserFromDB.mockResolvedValue(mockDbUser)
    getResumeData.mockResolvedValue(mockResumeData)
    parseOpenAIResponse.mockReturnValue({
      success: true,
      data: mockAnalysisResponse,
      strategy: 'direct',
    })
    modelService.analyzeResume.mockResolvedValue({
      content: JSON.stringify(mockAnalysisResponse),
    })
    dashboardCache.invalidateAnalysis.mockResolvedValue(true)

    // Mock database operations
    db.analysis.findFirst.mockResolvedValue(null)
    db.analysis.create.mockResolvedValue(createMockAnalysis())
    db.creditTransaction.create.mockResolvedValue(createMockCreditTransaction())
    db.user.update.mockResolvedValue(mockDbUser)
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      currentUser.mockResolvedValue(null)

      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('Authentication required')
    })

    it('should return 404 when database user is not found', async () => {
      getCurrentUserFromDB.mockResolvedValue(null)

      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('User not found in database')
    })
  })

  describe('Resume Analysis Flow', () => {
    it('should successfully analyze a resume with resumeId', async () => {
      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analysis).toEqual(mockAnalysisResponse)
      expect(data.fileName).toBe(mockResumeData.fileName)
      expect(data.resumeId).toBe(mockResumeData.resumeId)
      expect(data.cached).toBe(false)
      expect(data.parseStrategy).toBe('direct')
    })

    it('should return cached analysis when exists and not forcing reanalysis', async () => {
      const existingAnalysis = createMockAnalysis()
      db.analysis.findFirst.mockResolvedValue(existingAnalysis)

      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analysis).toEqual(existingAnalysis.analysisData)
      expect(data.cached).toBe(true)
      expect(data.message).toBe('Retrieved existing analysis')
    })

    it('should force reanalysis when forceReanalysis is true', async () => {
      const existingAnalysis = createMockAnalysis()
      db.analysis.findFirst.mockResolvedValue(existingAnalysis)

      const request = createMockRequest({
        resumeId: 'resume_123',
        forceReanalysis: true,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.cached).toBe(false)
      expect(modelService.analyzeResume).toHaveBeenCalled()
    })

    it('should handle legacy upload with fileData', async () => {
      const request = createMockRequest({
        fileName: 'legacy-resume.pdf',
        fileData: 'base64-data-here',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.resumeId).toBe('legacy-upload')
      expect(data.fileName).toBe('legacy-resume.pdf')
    })

    it('should return 404 when resume is not found', async () => {
      getResumeData.mockResolvedValue(null)

      const request = createMockRequest({ resumeId: 'nonexistent_resume' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Resume not found or you do not have access to it.')
    })

    it('should return 400 when neither resumeId nor fileData is provided', async () => {
      const request = createMockRequest({})
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Either resumeId or fileData with fileName is required')
    })
  })

  describe('Credit System Integration', () => {
    it('should create credit transaction after successful analysis', async () => {
      const request = createMockRequest({ resumeId: 'resume_123' })
      await POST(request)

      expect(db.creditTransaction.create).toHaveBeenCalledWith({
        data: {
          userId: mockDbUser.id,
          type: 'ANALYSIS_USE',
          amount: -1,
          description: `Resume analysis: ${mockResumeData.fileName}`,
          relatedAnalysisId: 'analysis_123',
        },
      })
    })

    it('should update user credits after successful analysis', async () => {
      const request = createMockRequest({ resumeId: 'resume_123' })
      await POST(request)

      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: mockDbUser.id },
        data: {
          credits: { decrement: 1 },
          totalCreditsUsed: { increment: 1 },
        },
      })
    })

    it('should not deduct credits for legacy uploads', async () => {
      const request = createMockRequest({
        fileName: 'legacy-resume.pdf',
        fileData: 'base64-data-here',
      })
      await POST(request)

      expect(db.creditTransaction.create).not.toHaveBeenCalled()
      expect(db.user.update).not.toHaveBeenCalled()
    })
  })

  describe('Database Persistence', () => {
    it('should save analysis to database', async () => {
      const request = createMockRequest({ resumeId: 'resume_123' })
      await POST(request)

      expect(db.analysis.create).toHaveBeenCalledWith({
        data: {
          userId: mockDbUser.id,
          resumeId: mockResumeData.resumeId,
          fileName: mockResumeData.fileName,
          processingTimeMs: expect.any(Number),
          overallScore: mockAnalysisResponse.overall_score,
          atsScore: mockAnalysisResponse.ats_score,
          scoreCategory: mockAnalysisResponse.score_category,
          mainRoast: mockAnalysisResponse.main_roast,
          analysisData: mockAnalysisResponse,
          creditsUsed: 1,
          isCompleted: true,
        },
      })
    })

    it('should invalidate cache after successful analysis', async () => {
      const request = createMockRequest({ resumeId: 'resume_123' })
      await POST(request)

      expect(dashboardCache.invalidateAnalysis).toHaveBeenCalledWith(
        'analysis_123',
        mockDbUser.id
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle model service errors gracefully', async () => {
      modelService.analyzeResume.mockRejectedValue(new Error('OpenAI API error'))

      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Analysis failed')
      expect(data.details).toBe('OpenAI API error')
    })

    it('should handle JSON parsing errors with fallback', async () => {
      parseOpenAIResponse.mockReturnValue({
        success: false,
        error: 'Invalid JSON format',
        data: mockAnalysisResponse, // Fallback data
        rawResponse: 'invalid json response',
      })

      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.parseStrategy).toBe('fallback')
      expect(data.warning).toBe('Analysis completed with technical recovery')
    })

    it('should continue even if database save fails', async () => {
      db.analysis.create.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.analysisId).toBeNull()
    })

    it('should return production-friendly error in production mode', async () => {
      const originalEnv = process.env.NODE_ENV
      process.env.NODE_ENV = 'production'

      modelService.analyzeResume.mockRejectedValue(new Error('Internal error'))

      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Resume analysis temporarily unavailable')
      expect(data.fallbackAnalysis).toBeDefined()

      process.env.NODE_ENV = originalEnv
    })
  })

  describe('Performance Monitoring', () => {
    it('should track processing time', async () => {
      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(data.processingTimeMs).toBeGreaterThan(0)
      expect(typeof data.processingTimeMs).toBe('number')
    })

    it('should include timestamp in response', async () => {
      const request = createMockRequest({ resumeId: 'resume_123' })
      const response = await POST(request)
      const data = await response.json()

      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date')
    })
  })
})