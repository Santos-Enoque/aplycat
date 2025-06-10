/// <reference types="../../types/jest" />

import { POST as analyzeResume } from '@/app/api/analyze-resume/route'
import { POST as improveResume } from '@/app/api/improve-resume/route'
import { POST as tailorResume } from '@/app/api/tailor-resume/route'
import { POST as linkedinAnalysis } from '@/app/api/linkedin-analysis/route'
import { POST as useCredits } from '@/app/api/use-credits/route'
import {
  mockUser,
  mockDbUser,
  mockResumeData,
  mockAnalysisResponse,
  mockJobDescription,
  createMockRequest,
  createMockFileInput,
  createMockAnalysis,
  createMockCreditTransaction,
  cleanupMocks,
} from '../utils/test-helpers'

// Mock all modules
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/auth/user-sync')
jest.mock('@/lib/models-updated')
jest.mock('@/lib/models-streaming')
jest.mock('@/lib/resume-storage')
jest.mock('@/lib/db')
jest.mock('@/lib/json-parser')
jest.mock('@/lib/redis-cache')
jest.mock('@/lib/actions/user-actions')
jest.mock('openai')

describe('Resume Workflow Integration Tests', () => {
  // Mock modules
  const { currentUser } = require('@clerk/nextjs/server')
  const { getCurrentUserFromDB, decrementUserCredits } = require('@/lib/auth/user-sync')
  const { modelService } = require('@/lib/models-updated')
  const { streamingModelService } = require('@/lib/models-streaming')
  const { getResumeData } = require('@/lib/resume-storage')
  const { parseOpenAIResponse } = require('@/lib/json-parser')
  const { db } = require('@/lib/db')
  const { dashboardCache } = require('@/lib/redis-cache')
  const { checkUserCredits, deductUserCredits } = require('@/lib/actions/user-actions')
  const { OpenAI } = require('openai')

  // Shared test data
  const resumeId = 'resume_workflow_test'
  const userId = 'user_workflow_test'
  const dbUserId = 'db_user_workflow_test'

  const userWithCredits = {
    ...mockDbUser,
    id: dbUserId,
    clerkId: userId,
    credits: 100, // Plenty of credits for testing
  }

  const workflowResumeData = {
    ...mockResumeData,
    resumeId,
    userId,
  }

  beforeEach(() => {
    cleanupMocks()
    
    // Setup common mocks
    currentUser.mockResolvedValue({ ...mockUser, id: userId })
    getCurrentUserFromDB.mockResolvedValue(userWithCredits)
    getResumeData.mockResolvedValue(workflowResumeData)
    
    // Model service mocks
    modelService.analyzeResume.mockResolvedValue({
      content: JSON.stringify(mockAnalysisResponse),
    })
    
    streamingModelService.improveResume.mockResolvedValue({
      content: JSON.stringify({
        improved_sections: {
          summary: {
            original: 'Software developer',
            improved: 'Experienced software engineer with 5+ years developing scalable applications',
            improvements: ['Added quantified experience', 'Enhanced impact language'],
          },
        },
      }),
    })
    
    streamingModelService.tailorResume.mockResolvedValue({
      content: JSON.stringify({
        tailoredResume: {
          summary: 'Senior software engineer specialized in React and Node.js development',
          experience: ['Enhanced experience for job match'],
        },
        tailoringAnalysis: {
          match_score: 92,
          keywords_matched: ['React', 'Node.js', 'JavaScript'],
        },
      }),
    })
    
    // JSON parser mock
    parseOpenAIResponse.mockReturnValue({
      success: true,
      data: mockAnalysisResponse,
      strategy: 'direct',
    })
    
    // Database mocks
    db.analysis.findFirst.mockResolvedValue(null)
    db.analysis.create.mockResolvedValue(createMockAnalysis({ userId: dbUserId }))
    db.creditTransaction.create.mockResolvedValue(createMockCreditTransaction({ userId: dbUserId }))
    db.user.update.mockResolvedValue(userWithCredits)
    
    // Credit system mocks
    checkUserCredits.mockResolvedValue(true)
    deductUserCredits.mockResolvedValue(true)
    decrementUserCredits.mockResolvedValue(true)
    
    // Cache mock
    dashboardCache.invalidateAnalysis.mockResolvedValue(true)
    
    // OpenAI mock for LinkedIn analysis
    const mockOpenAI = {
      responses: {
        stream: jest.fn().mockReturnValue({
          on: jest.fn((event: string, callback: Function) => {
            if (event === 'response.output_text.done') {
              setTimeout(callback, 10)
            }
          }),
        }),
      },
    }
    OpenAI.mockImplementation(() => mockOpenAI)
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Complete Resume Analysis to Improvement Workflow', () => {
    it('should successfully complete the entire workflow from analysis to improvement', async () => {
      // Step 1: Analyze the resume
      const analysisRequest = createMockRequest({ resumeId })
      const analysisResponse = await analyzeResume(analysisRequest)
      const analysisData = await analysisResponse.json()

      expect(analysisResponse.status).toBe(200)
      expect(analysisData.success).toBe(true)
      expect(analysisData.analysis).toEqual(mockAnalysisResponse)
      expect(analysisData.cached).toBe(false)

      // Verify credit deduction for analysis
      expect(db.creditTransaction.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'ANALYSIS_USE',
          amount: -1,
        }),
      })

      // Step 2: Improve the resume based on analysis
      const improvementRequest = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Senior Software Engineer',
        targetIndustry: 'Technology',
      })
      const improvementResponse = await improveResume(improvementRequest)
      const improvementData = await improvementResponse.json()

      expect(improvementResponse.status).toBe(200)
      expect(improvementData.success).toBe(true)
      expect(improvementData.improvedResume).toBeDefined()
      expect(improvementData.targetRole).toBe('Senior Software Engineer')

      // Verify credit deduction for improvement
      expect(decrementUserCredits).toHaveBeenCalledWith(userId, 2)
    })

    it('should handle the workflow when user has insufficient credits for improvement', async () => {
      // First, successful analysis
      const analysisRequest = createMockRequest({ resumeId })
      const analysisResponse = await analyzeResume(analysisRequest)
      expect(analysisResponse.status).toBe(200)

      // Then, improvement fails due to insufficient credits
      getCurrentUserFromDB.mockResolvedValue({
        ...userWithCredits,
        credits: 1, // Only 1 credit left, but improvement needs 2
      })

      const improvementRequest = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Senior Software Engineer',
        targetIndustry: 'Technology',
      })
      const improvementResponse = await improveResume(improvementRequest)
      const improvementData = await improvementResponse.json()

      expect(improvementResponse.status).toBe(402)
      expect(improvementData.error).toBe('Insufficient credits. This service costs 2 credits.')
    })
  })

  describe('Complete Resume Tailoring Workflow', () => {
    it('should successfully tailor a resume for a specific job', async () => {
      // Start with analysis to understand the resume
      const analysisRequest = createMockRequest({ resumeId })
      const analysisResponse = await analyzeResume(analysisRequest)
      expect(analysisResponse.status).toBe(200)

      // Then tailor the resume for a specific job
      const tailoringRequest = createMockRequest({
        currentResume: {
          summary: 'Software developer with experience',
          experience: ['Developed web applications'],
          skills: ['JavaScript', 'React'],
        },
        jobDescription: mockJobDescription,
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Innovation Corp',
        includeCoverLetter: true,
      })
      const tailoringResponse = await tailorResume(tailoringRequest)
      const tailoringData = await tailoringResponse.json()

      expect(tailoringResponse.status).toBe(200)
      expect(tailoringData.success).toBe(true)
      expect(tailoringData.tailoredResume).toBeDefined()
      expect(tailoringData.tailoringAnalysis).toBeDefined()
      expect(tailoringData.jobTitle).toBe('Senior Software Engineer')
      expect(tailoringData.companyName).toBe('Tech Innovation Corp')

      // Verify credit deduction for tailoring (4 credits)
      expect(decrementUserCredits).toHaveBeenCalledWith(userId, 4)
    })
  })

  describe('LinkedIn Analysis Integration', () => {
    it('should successfully analyze LinkedIn profile', async () => {
      const linkedinRequest = createMockRequest({
        profileUrl: 'https://linkedin.com/in/johndoe',
      })
      const linkedinResponse = await linkedinAnalysis(linkedinRequest)

      expect(linkedinResponse.status).toBe(200)
      expect(OpenAI).toHaveBeenCalled()
      
      // Verify OpenAI was called with correct parameters
      const mockInstance = OpenAI.mock.results[0].value
      expect(mockInstance.responses.stream).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o-mini',
          input: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining('https://linkedin.com/in/johndoe'),
            }),
          ]),
        })
      )
    })
  })

  describe('Credit System Integration', () => {
    it('should properly track credits across multiple operations', async () => {
      const initialCredits = userWithCredits.credits

      // Perform analysis (1 credit)
      const analysisRequest = createMockRequest({ resumeId })
      await analyzeResume(analysisRequest)

      // Perform improvement (2 credits)
      const improvementRequest = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      await improveResume(improvementRequest)

      // Perform tailoring (4 credits)
      const tailoringRequest = createMockRequest({
        currentResume: { summary: 'Test resume' },
        jobDescription: mockJobDescription,
      })
      await tailorResume(tailoringRequest)

      // Verify credit transactions were created
      expect(db.creditTransaction.create).toHaveBeenCalledTimes(1) // Only for analysis
      expect(decrementUserCredits).toHaveBeenCalledTimes(2) // For improvement and tailoring
      expect(decrementUserCredits).toHaveBeenCalledWith(userId, 2) // Improvement
      expect(decrementUserCredits).toHaveBeenCalledWith(userId, 4) // Tailoring
    })

    it('should use the dedicated credit API endpoint', async () => {
      const creditRequest = createMockRequest({
        creditsToUse: 3,
        action: 'LinkedIn profile analysis',
      })
      const creditResponse = await useCredits(creditRequest)
      const creditData = await creditResponse.json()

      expect(creditResponse.status).toBe(200)
      expect(creditData.success).toBe(true)
      expect(creditData.creditsUsed).toBe(3)
      expect(creditData.description).toBe('LinkedIn profile analysis')

      expect(checkUserCredits).toHaveBeenCalledWith(3)
      expect(deductUserCredits).toHaveBeenCalledWith(
        3,
        'LinkedIn profile analysis',
        'IMPROVEMENT_USE'
      )
    })
  })

  describe('Error Handling Across Workflow', () => {
    it('should handle model service failures gracefully', async () => {
      // Simulate model service failure
      modelService.analyzeResume.mockRejectedValue(new Error('OpenAI API error'))

      const analysisRequest = createMockRequest({ resumeId })
      const analysisResponse = await analyzeResume(analysisRequest)
      const analysisData = await analysisResponse.json()

      expect(analysisResponse.status).toBe(500)
      expect(analysisData.success).toBe(false)
      expect(analysisData.error).toBe('Analysis failed')
      expect(analysisData.details).toBe('OpenAI API error')

      // Verify no credits were deducted for failed operation
      expect(db.creditTransaction.create).not.toHaveBeenCalled()
      expect(db.user.update).not.toHaveBeenCalled()
    })

    it('should handle database failures gracefully', async () => {
      // Simulate database failure
      db.analysis.create.mockRejectedValue(new Error('Database connection failed'))

      const analysisRequest = createMockRequest({ resumeId })
      const analysisResponse = await analyzeResume(analysisRequest)
      const analysisData = await analysisResponse.json()

      // Should still return success even if database save fails
      expect(analysisResponse.status).toBe(200)
      expect(analysisData.success).toBe(true)
      expect(analysisData.analysisId).toBeNull()
    })

    it('should handle credit deduction failures', async () => {
      // Simulate credit deduction failure
      decrementUserCredits.mockRejectedValue(new Error('Credit deduction failed'))

      const improvementRequest = createMockRequest({
        originalFile: createMockFileInput(),
        targetRole: 'Software Engineer',
        targetIndustry: 'Technology',
      })
      const improvementResponse = await improveResume(improvementRequest)
      const improvementData = await improvementResponse.json()

      // Should still return success
      expect(improvementResponse.status).toBe(200)
      expect(improvementData.success).toBe(true)
    })
  })

  describe('Performance and Monitoring', () => {
    it('should track processing times across operations', async () => {
      const operations = [
        { name: 'analysis', request: createMockRequest({ resumeId }), handler: analyzeResume },
        { 
          name: 'improvement', 
          request: createMockRequest({
            originalFile: createMockFileInput(),
            targetRole: 'Software Engineer',
            targetIndustry: 'Technology',
          }), 
          handler: improveResume 
        },
        { 
          name: 'tailoring', 
          request: createMockRequest({
            currentResume: { summary: 'Test' },
            jobDescription: mockJobDescription,
          }), 
          handler: tailorResume 
        },
      ]

      for (const operation of operations) {
        const startTime = Date.now()
        const response = await operation.handler(operation.request)
        const data = await response.json()
        const endTime = Date.now()

        expect(response.status).toBe(200)
        expect(data.processingTimeMs).toBeDefined()
        expect(data.timestamp).toBeDefined()
        expect(typeof data.processingTimeMs).toBe('number')
        expect(data.processingTimeMs).toBeGreaterThan(0)
        expect(endTime - startTime).toBeGreaterThanOrEqual(data.processingTimeMs)
      }
    })
  })

  describe('Caching Behavior', () => {
    it('should return cached analysis on subsequent requests', async () => {
      // First request - should create new analysis
      const firstRequest = createMockRequest({ resumeId })
      const firstResponse = await analyzeResume(firstRequest)
      const firstData = await firstResponse.json()

      expect(firstResponse.status).toBe(200)
      expect(firstData.cached).toBe(false)

      // Mock existing analysis for second request
      db.analysis.findFirst.mockResolvedValue(createMockAnalysis({
        userId: dbUserId,
        resumeId,
        analysisData: mockAnalysisResponse,
      }))

      // Second request - should return cached analysis
      const secondRequest = createMockRequest({ resumeId })
      const secondResponse = await analyzeResume(secondRequest)
      const secondData = await secondResponse.json()

      expect(secondResponse.status).toBe(200)
      expect(secondData.cached).toBe(true)
      expect(secondData.message).toBe('Retrieved existing analysis')

      // Verify model service was only called once
      expect(modelService.analyzeResume).toHaveBeenCalledTimes(1)
    })

    it('should bypass cache when forceReanalysis is true', async () => {
      // Mock existing analysis
      db.analysis.findFirst.mockResolvedValue(createMockAnalysis({
        userId: dbUserId,
        resumeId,
      }))

      const request = createMockRequest({
        resumeId,
        forceReanalysis: true,
      })
      const response = await analyzeResume(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cached).toBe(false)
      expect(modelService.analyzeResume).toHaveBeenCalled()
    })
  })
})