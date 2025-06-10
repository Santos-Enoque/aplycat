/// <reference types="../../types/jest" />

import { POST } from '@/app/api/use-credits/route'
import {
  mockUser,
  mockDbUser,
  createMockRequest,
  cleanupMocks,
} from '../utils/test-helpers'

// Mock modules
jest.mock('@/lib/auth/user-sync')
jest.mock('@/lib/actions/user-actions')

describe('Use Credits API', () => {
  const { getCurrentUserFromDB } = require('@/lib/auth/user-sync')
  const { deductUserCredits, checkUserCredits } = require('@/lib/actions/user-actions')

  beforeEach(() => {
    cleanupMocks()
    
    // Default mocks
    getCurrentUserFromDB.mockResolvedValue(mockDbUser)
    checkUserCredits.mockResolvedValue(true)
    deductUserCredits.mockResolvedValue(true)
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      getCurrentUserFromDB.mockResolvedValue(null)

      const request = createMockRequest({
        creditsToUse: 2,
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('User not authenticated')
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when creditsToUse is missing', async () => {
      const request = createMockRequest({
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid credits amount')
    })

    it('should return 400 when creditsToUse is not a number', async () => {
      const request = createMockRequest({
        creditsToUse: 'two',
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid credits amount')
    })

    it('should return 400 when creditsToUse is zero', async () => {
      const request = createMockRequest({
        creditsToUse: 0,
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid credits amount')
    })

    it('should return 400 when creditsToUse is negative', async () => {
      const request = createMockRequest({
        creditsToUse: -5,
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid credits amount')
    })

    it('should return 400 when action is missing', async () => {
      const request = createMockRequest({
        creditsToUse: 2,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Action description is required')
    })

    it('should return 400 when action is not a string', async () => {
      const request = createMockRequest({
        creditsToUse: 2,
        action: 123,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Action description is required')
    })

    it('should accept valid input', async () => {
      const request = createMockRequest({
        creditsToUse: 2,
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Credit Checking', () => {
    it('should return 400 when user has insufficient credits', async () => {
      checkUserCredits.mockResolvedValue(false)

      const request = createMockRequest({
        creditsToUse: 10,
        action: 'Premium feature',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Insufficient credits')
      expect(checkUserCredits).toHaveBeenCalledWith(10)
    })

    it('should proceed when user has sufficient credits', async () => {
      checkUserCredits.mockResolvedValue(true)

      const request = createMockRequest({
        creditsToUse: 3,
        action: 'LinkedIn analysis',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(checkUserCredits).toHaveBeenCalledWith(3)
    })
  })

  describe('Credit Deduction', () => {
    it('should successfully deduct credits', async () => {
      const request = createMockRequest({
        creditsToUse: 2,
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.creditsUsed).toBe(2)
      expect(data.description).toBe('Resume improvement')
      
      expect(deductUserCredits).toHaveBeenCalledWith(
        2,
        'Resume improvement',
        'IMPROVEMENT_USE'
      )
    })

    it('should return 500 when credit deduction fails', async () => {
      deductUserCredits.mockResolvedValue(false)

      const request = createMockRequest({
        creditsToUse: 1,
        action: 'Resume analysis',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to deduct credits')
    })

    it('should handle deduction service errors', async () => {
      deductUserCredits.mockRejectedValue(new Error('Database error'))

      const request = createMockRequest({
        creditsToUse: 1,
        action: 'Resume analysis',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('Different Credit Amounts', () => {
    it('should handle single credit deduction', async () => {
      const request = createMockRequest({
        creditsToUse: 1,
        action: 'Resume analysis',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creditsUsed).toBe(1)
      expect(checkUserCredits).toHaveBeenCalledWith(1)
      expect(deductUserCredits).toHaveBeenCalledWith(1, 'Resume analysis', 'IMPROVEMENT_USE')
    })

    it('should handle multiple credit deduction', async () => {
      const request = createMockRequest({
        creditsToUse: 4,
        action: 'Resume tailoring with cover letter',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creditsUsed).toBe(4)
      expect(checkUserCredits).toHaveBeenCalledWith(4)
      expect(deductUserCredits).toHaveBeenCalledWith(4, 'Resume tailoring with cover letter', 'IMPROVEMENT_USE')
    })

    it('should handle large credit amounts', async () => {
      const request = createMockRequest({
        creditsToUse: 50,
        action: 'Bulk resume processing',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.creditsUsed).toBe(50)
    })
  })

  describe('Action Descriptions', () => {
    it('should handle various action descriptions', async () => {
      const testCases = [
        'Resume analysis',
        'Resume improvement',
        'LinkedIn profile analysis',
        'Resume tailoring',
        'Cover letter generation',
        'Job URL processing',
      ]

      for (const action of testCases) {
        const request = createMockRequest({
          creditsToUse: 1,
          action,
        })
        const response = await POST(request)
        const data = await response.json()

        expect(response.status).toBe(200)
        expect(data.description).toBe(action)
      }
    })

    it('should handle long action descriptions', async () => {
      const longAction = 'Resume analysis and improvement with detailed feedback for software engineering position at major technology company'
      
      const request = createMockRequest({
        creditsToUse: 2,
        action: longAction,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.description).toBe(longAction)
    })

    it('should handle special characters in action descriptions', async () => {
      const specialAction = 'Resume improvement: React/Node.js & TypeScript (2024)'
      
      const request = createMockRequest({
        creditsToUse: 2,
        action: specialAction,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.description).toBe(specialAction)
    })
  })

  describe('Edge Cases', () => {
    it('should handle credit checking service errors gracefully', async () => {
      checkUserCredits.mockRejectedValue(new Error('Credit check failed'))

      const request = createMockRequest({
        creditsToUse: 2,
        action: 'Resume improvement',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })

    it('should handle malformed request body', async () => {
      const request = new Request('http://localhost:3000/api/use-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json',
      })

      try {
        await POST(request as any)
      } catch (error) {
        // Expected to throw due to malformed JSON
        expect(error).toBeDefined()
      }
    })

    it('should handle empty request body', async () => {
      const request = new Request('http://localhost:3000/api/use-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      })

      const response = await POST(request as any)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid credits amount')
    })
  })

  describe('Response Format', () => {
    it('should return correct success response format', async () => {
      const request = createMockRequest({
        creditsToUse: 3,
        action: 'LinkedIn analysis',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('creditsUsed', 3)
      expect(data).toHaveProperty('description', 'LinkedIn analysis')
      expect(data).not.toHaveProperty('error')
    })

    it('should return correct error response format', async () => {
      checkUserCredits.mockResolvedValue(false)

      const request = createMockRequest({
        creditsToUse: 10,
        action: 'Premium feature',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('error', 'Insufficient credits')
      expect(data).not.toHaveProperty('success')
      expect(data).not.toHaveProperty('creditsUsed')
      expect(data).not.toHaveProperty('description')
    })
  })

  describe('Integration Tests', () => {
    it('should handle typical resume analysis workflow', async () => {
      // Simulate analyzing a resume that costs 1 credit
      const request = createMockRequest({
        creditsToUse: 1,
        action: 'Resume analysis: software-engineer-resume.pdf',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.creditsUsed).toBe(1)
      
      // Verify the correct flow was followed
      expect(checkUserCredits).toHaveBeenCalledWith(1)
      expect(deductUserCredits).toHaveBeenCalledWith(
        1,
        'Resume analysis: software-engineer-resume.pdf',
        'IMPROVEMENT_USE'
      )
    })

    it('should handle typical resume improvement workflow', async () => {
      // Simulate improving a resume that costs 2 credits
      const request = createMockRequest({
        creditsToUse: 2,
        action: 'Resume improvement for Software Engineer role in Technology industry',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.creditsUsed).toBe(2)
    })

    it('should handle typical resume tailoring workflow', async () => {
      // Simulate tailoring a resume with cover letter that costs 4 credits
      const request = createMockRequest({
        creditsToUse: 4,
        action: 'Resume tailoring with cover letter for Senior Engineer at Tech Corp',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.creditsUsed).toBe(4)
    })
  })

  describe('Transaction Category', () => {
    it('should always use IMPROVEMENT_USE category', async () => {
      const testActions = [
        { credits: 1, action: 'Resume analysis' },
        { credits: 2, action: 'Resume improvement' },
        { credits: 3, action: 'LinkedIn analysis' },
        { credits: 4, action: 'Resume tailoring' },
      ]

      for (const testCase of testActions) {
        const request = createMockRequest({
          creditsToUse: testCase.credits,
          action: testCase.action,
        })
        await POST(request)

        expect(deductUserCredits).toHaveBeenCalledWith(
          testCase.credits,
          testCase.action,
          'IMPROVEMENT_USE'
        )
      }
    })
  })
})