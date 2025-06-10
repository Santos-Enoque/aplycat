/// <reference types="../../types/jest" />

import { POST } from '@/app/api/tailor-resume/route'
import {
  mockUser,
  mockDbUser,
  mockJobDescription,
  createMockRequest,
  cleanupMocks,
} from '../utils/test-helpers'

// Mock modules
jest.mock('@clerk/nextjs/server')
jest.mock('@/lib/auth/user-sync')
jest.mock('@/lib/models-streaming')

describe('Tailor Resume API', () => {
  const { currentUser } = require('@clerk/nextjs/server')
  const { getCurrentUserFromDB, decrementUserCredits } = require('@/lib/auth/user-sync')
  const { streamingModelService } = require('@/lib/models-streaming')

  const mockCurrentResume = {
    contact: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '555-0123',
      location: 'San Francisco, CA',
    },
    summary: 'Software developer with experience in web development',
    experience: [
      {
        title: 'Software Developer',
        company: 'Tech Corp',
        duration: '2020-2023',
        responsibilities: [
          'Developed web applications',
          'Worked with React and Node.js',
          'Collaborated with team members',
        ],
      },
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'HTML', 'CSS'],
    education: [
      {
        degree: 'Bachelor of Science in Computer Science',
        school: 'University of Technology',
        year: '2020',
      },
    ],
  }

  const mockTailoredResult = {
    tailoredResume: {
      contact: mockCurrentResume.contact,
      summary: 'Results-driven software engineer with 3+ years developing scalable web applications using React, Node.js, and cloud technologies. Proven track record of delivering high-performance solutions in fast-paced technology environments.',
      experience: [
        {
          title: 'Software Developer',
          company: 'Tech Corp',
          duration: '2020-2023',
          responsibilities: [
            'Architected and developed 5+ responsive web applications using React.js and TypeScript, serving 50K+ daily users',
            'Built scalable backend APIs with Node.js and Express, improving system performance by 40%',
            'Led cross-functional collaboration with design and product teams to deliver features ahead of schedule',
          ],
        },
      ],
      skills: ['JavaScript/TypeScript', 'React.js', 'Node.js', 'AWS', 'Docker', 'Microservices', 'Agile Development'],
      education: mockCurrentResume.education,
    },
    coverLetter: {
      opening: 'Dear Hiring Manager,',
      introduction: 'I am writing to express my strong interest in the Senior Software Engineer position at Tech Corp. With over 3 years of experience developing scalable web applications and a proven track record in React and Node.js development, I am excited to contribute to your innovative team.',
      body: [
        'In my current role as Software Developer, I have successfully architected and delivered multiple high-traffic web applications that serve thousands of users daily. My experience with React.js, TypeScript, and Node.js directly aligns with your requirements for building modern, scalable applications.',
        'I am particularly drawn to Tech Corp\'s commitment to innovation and would love to bring my experience with AWS cloud services and microservices architecture to help scale your platform.',
      ],
      closing: 'I would welcome the opportunity to discuss how my technical skills and passion for building exceptional user experiences can contribute to Tech Corp\'s continued success.',
      signature: 'Sincerely,\nJohn Doe',
    },
    tailoringAnalysis: {
      keywords_matched: ['JavaScript', 'React', 'Node.js', 'AWS', 'microservices'],
      keywords_added: ['TypeScript', 'Docker', 'Agile'],
      sections_modified: ['summary', 'experience', 'skills'],
      improvements_made: [
        'Enhanced summary with quantified experience and relevant technologies',
        'Added specific metrics and achievements to experience descriptions',
        'Expanded skills section with job-relevant technologies',
        'Structured content to highlight cloud and scalability experience',
      ],
      match_score: 87,
    },
  }

  beforeEach(() => {
    cleanupMocks()
    
    // Default mocks
    currentUser.mockResolvedValue(mockUser)
    getCurrentUserFromDB.mockResolvedValue(mockDbUser)
    decrementUserCredits.mockResolvedValue(true)
    streamingModelService.tailorResume.mockResolvedValue({
      content: JSON.stringify(mockTailoredResult),
    })
  })

  afterEach(() => {
    cleanupMocks()
  })

  describe('Authentication and Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      currentUser.mockResolvedValue(null)

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
      const text = await response.text()
      expect(text).toBe('Unauthorized')
    })

    it('should return 402 when user has insufficient credits', async () => {
      getCurrentUserFromDB.mockResolvedValue({
        ...mockDbUser,
        credits: 3, // Less than required 4 credits
      })

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits. This service costs 4 credits.')
    })

    it('should return 402 when database user is not found', async () => {
      getCurrentUserFromDB.mockResolvedValue(null)

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(402)
      expect(data.error).toBe('Insufficient credits. This service costs 4 credits.')
    })
  })

  describe('Input Validation', () => {
    it('should return 400 when currentResume is missing', async () => {
      const request = createMockRequest({
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Current resume and job description are required')
    })

    it('should return 400 when jobDescription is missing', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Current resume and job description are required')
    })

    it('should accept valid input with all required parameters', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })

  describe('Resume Tailoring Flow', () => {
    it('should successfully tailor a resume', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.tailoredResume).toEqual(mockTailoredResult.tailoredResume)
      expect(data.tailoringAnalysis).toEqual(mockTailoredResult.tailoringAnalysis)
      expect(data.jobTitle).toBe('Senior Software Engineer')
      expect(data.companyName).toBe('Tech Corp')
      expect(data.processingTimeMs).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    it('should handle cover letter generation when requested', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
        includeCoverLetter: true,
        jobTitle: 'Senior Software Engineer',
        companyName: 'Tech Corp',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.coverLetter).toEqual(mockTailoredResult.coverLetter)
      expect(data.includedCoverLetter).toBe(true)
    })

    it('should not include cover letter when not requested', async () => {
      const tailoredResultWithoutCover = {
        ...mockTailoredResult,
        coverLetter: null,
      }
      streamingModelService.tailorResume.mockResolvedValue({
        content: JSON.stringify(tailoredResultWithoutCover),
      })

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
        includeCoverLetter: false,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.coverLetter).toBeNull()
      expect(data.includedCoverLetter).toBe(false)
    })

    it('should handle default values for optional parameters', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.jobTitle).toBe('Target Position')
      expect(data.companyName).toBe('')
      expect(data.includedCoverLetter).toBe(false)
    })
  })

  describe('Credit System Integration', () => {
    it('should deduct 4 credits after successful tailoring', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      await POST(request)

      expect(decrementUserCredits).toHaveBeenCalledWith(mockUser.id, 4)
    })

    it('should not deduct credits if tailoring fails', async () => {
      streamingModelService.tailorResume.mockRejectedValue(new Error('Model error'))

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
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
      const jobTitle = 'Senior Frontend Developer'
      const companyName = 'Innovation Labs'
      const includeCoverLetter = true

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
        jobTitle,
        companyName,
        includeCoverLetter,
      })
      await POST(request)

      expect(streamingModelService.tailorResume).toHaveBeenCalledWith(
        mockCurrentResume,
        mockJobDescription,
        includeCoverLetter,
        companyName,
        jobTitle
      )
    })

    it('should parse JSON response from model service', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.tailoredResume).toEqual(mockTailoredResult.tailoredResume)
      expect(data.tailoringAnalysis).toEqual(mockTailoredResult.tailoringAnalysis)
    })
  })

  describe('Error Handling', () => {
    it('should handle model service errors', async () => {
      streamingModelService.tailorResume.mockRejectedValue(new Error('OpenAI API error'))

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('OpenAI API error')
      expect(data.processingTimeMs).toBeDefined()
      expect(data.timestamp).toBeDefined()
    })

    it('should handle JSON parsing errors', async () => {
      streamingModelService.tailorResume.mockResolvedValue({
        content: 'invalid json response',
      })

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toContain('Unexpected token')
    })

    it('should handle unknown errors gracefully', async () => {
      streamingModelService.tailorResume.mockRejectedValue('String error')

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.success).toBe(false)
      expect(data.error).toBe('Failed to tailor resume')
    })
  })

  describe('Performance Monitoring', () => {
    it('should track processing time', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data.processingTimeMs).toBeGreaterThan(0)
      expect(typeof data.processingTimeMs).toBe('number')
    })

    it('should include timestamp in response', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data.timestamp).toBeDefined()
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date')
    })

    it('should complete tailoring within reasonable time', async () => {
      const startTime = Date.now()
      
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      await POST(request)
      
      const endTime = Date.now()
      const processingTime = endTime - startTime
      
      // Should complete within 5 seconds (generous for testing)
      expect(processingTime).toBeLessThan(5000)
    })
  })

  describe('Response Format', () => {
    it('should include all required response fields', async () => {
      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
        jobTitle: 'Software Engineer',
        companyName: 'Tech Corp',
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', true)
      expect(data).toHaveProperty('tailoredResume')
      expect(data).toHaveProperty('tailoringAnalysis')
      expect(data).toHaveProperty('jobTitle', 'Software Engineer')
      expect(data).toHaveProperty('companyName', 'Tech Corp')
      expect(data).toHaveProperty('processingTimeMs')
      expect(data).toHaveProperty('timestamp')
      expect(data).toHaveProperty('includedCoverLetter')
      expect(typeof data.processingTimeMs).toBe('number')
      expect(new Date(data.timestamp).toString()).not.toBe('Invalid Date')
    })

    it('should handle error responses correctly', async () => {
      streamingModelService.tailorResume.mockRejectedValue(new Error('Test error'))

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: mockJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('success', false)
      expect(data).toHaveProperty('error', 'Test error')
      expect(data).toHaveProperty('processingTimeMs')
      expect(data).toHaveProperty('timestamp')
    })
  })

  describe('Integration Scenarios', () => {
    it('should handle complex job descriptions', async () => {
      const complexJobDescription = `
        Senior Full Stack Engineer - Remote
        
        About the role:
        We're looking for an experienced full-stack engineer to join our platform team.
        
        Requirements:
        - 5+ years of experience with React, Node.js, and TypeScript
        - Experience with AWS, Docker, and Kubernetes
        - Strong background in microservices architecture
        - Experience with CI/CD pipelines and automated testing
        - Bachelor's degree in Computer Science or equivalent
        
        Nice to have:
        - Experience with GraphQL and Apollo
        - Knowledge of serverless architectures
        - Previous startup experience
        
        Responsibilities:
        - Design and implement scalable web applications
        - Collaborate with product and design teams
        - Mentor junior developers
        - Contribute to technical architecture decisions
      `

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: complexJobDescription,
        jobTitle: 'Senior Full Stack Engineer',
        companyName: 'StartupCorp',
        includeCoverLetter: true,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(streamingModelService.tailorResume).toHaveBeenCalledWith(
        mockCurrentResume,
        complexJobDescription,
        true,
        'StartupCorp',
        'Senior Full Stack Engineer'
      )
    })

    it('should handle minimal job descriptions', async () => {
      const minimalJobDescription = 'Software engineer position. JavaScript and React required.'

      const request = createMockRequest({
        currentResume: mockCurrentResume,
        jobDescription: minimalJobDescription,
      })
      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })
  })
})