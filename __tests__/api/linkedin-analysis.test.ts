/// <reference types="../../types/jest" />

import { POST } from '@/app/api/linkedin-analysis/route'
import {
  mockUser,
  mockDbUser,
  createMockRequest,
  createMockCreditTransaction,
  cleanupMocks,
} from '../utils/test-helpers'

// Mock modules
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/auth/user-sync')
jest.mock('openai')

describe('LinkedIn Analysis API', () => {
  const { currentUser } = require('@clerk/nextjs/server')
  const { getCurrentUserFromDB, decrementUserCredits } = require('@/lib/auth/user-sync')
  const { OpenAI } = require('openai')

  const mockLinkedInAnalysis = {
    profile_strength: 85,
    headline_score: 78,
    summary_score: 82,
    experience_score: 88,
    skills_score: 75,
    recommendations: [
      'Add more industry-specific keywords to your headline',
      'Include quantified achievements in your experience section',
      'Request more recommendations from colleagues',
    ],
    optimization_tips: [
      'Update your profile photo to look more professional',
      'Add recent certifications to showcase continuous learning',
      'Join relevant industry groups',
    ],
  }

  const mockStreamResponse = {
    on: jest.fn((event: string, callback: Function) => {
      if (event === 'response.output_text.delta') {
        // Simulate streaming response
        setTimeout(() => callback({ delta: 'LinkedIn ' }), 10)
        setTimeout(() => callback({ delta: 'analysis ' }), 20)
        setTimeout(() => callback({ delta: 'complete.' }), 30)
      } else if (event === 'response.output_text.done') {
        setTimeout(callback, 40)
      }
    }),
  }

  beforeEach(() => {
    cleanupMocks()
    
    // Default mocks
    currentUser.mockResolvedValue(mockUser)
    getCurrentUserFromDB.mockResolvedValue(mockDbUser)
    decrementUserCredits.mockResolvedValue(true)

    // Mock OpenAI streaming response
    const mockOpenAI = {
      responses: {
        stream: jest.fn().mockReturnValue(mockStreamResponse),
      },
    }
    OpenAI.mockImplementation(() => mockOpenAI)
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      currentUser.mockResolvedValue(null)

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const text = await response.text()
      expect(text).toBe('Unauthorized')
    })

    it('should return 402 when user has insufficient credits', async () => {
      getCurrentUserFromDB.mockResolvedValue({
        ...mockDbUser,
        credits: 2, // Less than required 3 credits
      })

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(402)
      const text = await response.text()
      expect(text).toBe('Insufficient credits. This service costs 3 credits.')
    })

    it('should return 402 when database user is not found', async () => {
      getCurrentUserFromDB.mockResolvedValue(null)

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(402)
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when profileUrl is missing', async () => {
      const request = createMockRequest({})
      const response = await POST(request)

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe('Missing profile URL')
    })

    it('should return 400 when profileUrl is empty', async () => {
      const request = createMockRequest({ profileUrl: '' })
      const response = await POST(request)

      expect(response.status).toBe(400)
      const text = await response.text()
      expect(text).toBe('Missing profile URL')
    })
  })

  describe('LinkedIn Analysis Flow', () => {
    it('should successfully analyze LinkedIn profile', async () => {
      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(response.headers.get('Content-Type')).toContain('application/json')
      
      // Verify OpenAI was called with correct parameters
      expect(OpenAI).toHaveBeenCalled()
      const mockInstance = OpenAI.mock.results[0].value
      expect(mockInstance.responses.stream).toHaveBeenCalledWith({
        model: 'gpt-4o-mini',
        input: expect.arrayContaining([
          expect.objectContaining({
            role: 'system',
            content: expect.any(String),
          }),
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('https://linkedin.com/in/testuser'),
          }),
        ]),
        text: { format: { type: 'text' } },
        reasoning: {},
        tools: expect.arrayContaining([
          expect.objectContaining({
            type: 'web_search_preview',
          }),
        ]),
        temperature: 1,
        max_output_tokens: 2048,
        top_p: 1,
        store: true,
      })
    })

    it('should handle streaming response correctly', async () => {
      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
      
      // Verify stream event handlers are set up
      expect(mockStreamResponse.on).toHaveBeenCalledWith(
        'response.output_text.delta',
        expect.any(Function)
      )
      expect(mockStreamResponse.on).toHaveBeenCalledWith(
        'response.refusal.delta',
        expect.any(Function)
      )
      expect(mockStreamResponse.on).toHaveBeenCalledWith(
        'error',
        expect.any(Function)
      )
      expect(mockStreamResponse.on).toHaveBeenCalledWith(
        'response.output_text.done',
        expect.any(Function)
      )
    })
  })

  describe('Credit System Integration', () => {
    it('should deduct 3 credits after successful analysis', async () => {
      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      
      // Start the response
      await POST(request)

      // Simulate completion by calling the done handler
      const doneHandler = mockStreamResponse.on.mock.calls.find(
        (call: any[]) => call[0] === 'response.output_text.done'
      )?.[1]
      
      if (doneHandler) {
        await doneHandler()
      }

      expect(decrementUserCredits).toHaveBeenCalledWith(mockUser.id, 3)
    })

    it('should not fail the request if credit deduction fails', async () => {
      decrementUserCredits.mockRejectedValue(new Error('Credit deduction failed'))

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  describe('Error Handling', () => {
    it('should handle OpenAI API errors', async () => {
      const mockInstance = {
        responses: {
          stream: jest.fn().mockImplementation(() => {
            throw new Error('OpenAI API error')
          }),
        },
      }
      OpenAI.mockImplementation(() => mockInstance)

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toContain('Error: OpenAI API error')
    })

    it('should handle stream refusal events', async () => {
      const refusalStreamResponse = {
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'response.refusal.delta') {
            setTimeout(() => callback({ delta: 'Request refused' }), 10)
          }
        }),
      }

      const mockInstance = {
        responses: {
          stream: jest.fn().mockReturnValue(refusalStreamResponse),
        },
      }
      OpenAI.mockImplementation(() => mockInstance)

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle stream errors', async () => {
      const errorStreamResponse = {
        on: jest.fn((event: string, callback: Function) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Stream error')), 10)
          }
        }),
      }

      const mockInstance = {
        responses: {
          stream: jest.fn().mockReturnValue(errorStreamResponse),
        },
      }
      OpenAI.mockImplementation(() => mockInstance)

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('should handle general errors with fallback message', async () => {
      currentUser.mockRejectedValue(new Error('Unexpected error'))

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toBe('Error: Unexpected error')
    })

    it('should handle unknown errors', async () => {
      currentUser.mockRejectedValue('String error')

      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      const response = await POST(request)

      expect(response.status).toBe(500)
      const text = await response.text()
      expect(text).toBe('Error: Unknown error')
    })
  })

  describe('OpenAI Configuration', () => {
    it('should use correct model and parameters', async () => {
      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      await POST(request)

      const mockInstance = OpenAI.mock.results[0].value
      const streamCall = mockInstance.responses.stream.mock.calls[0][0]

      expect(streamCall.model).toBe('gpt-4o-mini')
      expect(streamCall.temperature).toBe(1)
      expect(streamCall.max_output_tokens).toBe(2048)
      expect(streamCall.top_p).toBe(1)
      expect(streamCall.store).toBe(true)
    })

    it('should include web search tool', async () => {
      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      await POST(request)

      const mockInstance = OpenAI.mock.results[0].value
      const streamCall = mockInstance.responses.stream.mock.calls[0][0]

      expect(streamCall.tools).toEqual([
        {
          type: 'web_search_preview',
          user_location: {
            type: 'approximate',
          },
          search_context_size: 'medium',
        },
      ])
    })

    it('should use LinkedIn analysis system prompt', async () => {
      const request = createMockRequest({ 
        profileUrl: 'https://linkedin.com/in/testuser' 
      })
      await POST(request)

      const mockInstance = OpenAI.mock.results[0].value
      const streamCall = mockInstance.responses.stream.mock.calls[0][0]
      const systemMessage = streamCall.input.find((msg: any) => msg.role === 'system')

      expect(systemMessage).toBeDefined()
      expect(systemMessage.content).toEqual(expect.any(String))
    })
  })
})