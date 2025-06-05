import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Optimize for production
  ...(process.env.NODE_ENV === 'production' && {
    transactionOptions: {
      timeout: 5000, // 5 second timeout
      maxWait: 2000, // 2 second wait time
    },
  }),
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Helper function to handle database connections gracefully
export async function connectToDatabase() {
  try {
    await db.$connect()
    console.log('✅ Connected to database')
  } catch (error) {
    console.error('❌ Failed to connect to database:', error)
    throw error
  }
}

// Helper function to disconnect from database
export async function disconnectFromDatabase() {
  try {
    await db.$disconnect()
    console.log('✅ Disconnected from database')
  } catch (error) {
    console.error('❌ Failed to disconnect from database:', error)
  }
}

// Credit management helpers
export const creditHelpers = {
  // Check if user has enough credits
  async hasEnoughCredits(userId: string, requiredCredits: number): Promise<boolean> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })
    return user ? user.credits >= requiredCredits : false
  },

  // Deduct credits and create transaction
  async deductCredits(
    userId: string, 
    amount: number, 
    type: 'ANALYSIS_USE' | 'IMPROVEMENT_USE',
    description: string,
    relatedId?: string
  ) {
    return await db.$transaction(async (tx) => {
      // Update user credits
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { decrement: amount },
          totalCreditsUsed: { increment: amount }
        }
      })

      // Create credit transaction
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type,
          amount: -amount, // Negative for deduction
          description,
          relatedAnalysisId: type === 'ANALYSIS_USE' ? relatedId : undefined,
          relatedImprovementId: type === 'IMPROVEMENT_USE' ? relatedId : undefined,
        }
      })

      return { user, transaction }
    })
  },

  // Add credits and create transaction
  async addCredits(
    userId: string,
    amount: number,
    type: 'BONUS_CREDIT' | 'PURCHASE' | 'SUBSCRIPTION_CREDIT' | 'REFUND',
    description: string
  ) {
    return await db.$transaction(async (tx) => {
      // Update user credits
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: amount }
        }
      })

      // Create credit transaction
      const transaction = await tx.creditTransaction.create({
        data: {
          userId,
          type,
          amount, // Positive for addition
          description,
        }
      })

      return { user, transaction }
    })
  },

  // Get user's credit balance
  async getUserCredits(userId: string): Promise<number> {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    })
    return user?.credits ?? 0
  }
}

// User management helpers
export const userHelpers = {
  // Create or update user from Clerk data
  async syncUserFromClerk(clerkUser: {
    id: string
    emailAddresses: Array<{ emailAddress: string }>
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string
  }) {
    const email = clerkUser.emailAddresses[0]?.emailAddress
    if (!email) {
      throw new Error('No email found for user')
    }

    return await db.user.upsert({
      where: { clerkId: clerkUser.id },
      update: {
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        lastActiveAt: new Date()
      },
      create: {
        clerkId: clerkUser.id,
        email,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        imageUrl: clerkUser.imageUrl,
        credits: 10, // Default free trial bonus
      }
    })
  },

  // Get user with all related data
  async getUserWithRelations(userId: string) {
    return await db.user.findUnique({
      where: { id: userId },
      include: {
        resumes: {
          include: {
            analyses: true,
            improvements: true
          },
          orderBy: { createdAt: 'desc' }
        },
        creditTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 10 // Last 10 transactions
        },
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })
  }
}

// Analytics helpers
export const analyticsHelpers = {
  // Track usage event
  async trackEvent(
    eventType: 'SIGNUP' | 'LOGIN' | 'RESUME_UPLOAD' | 'ANALYSIS_START' | 'ANALYSIS_COMPLETE' | 'IMPROVEMENT_START' | 'IMPROVEMENT_COMPLETE' | 'CREDIT_PURCHASE' | 'SUBSCRIPTION_START' | 'SUBSCRIPTION_CANCEL' | 'FILE_DOWNLOAD',
    userId?: string,
    metadata?: any,
    request?: Request
  ) {
    const ipAddress = request?.headers.get('x-forwarded-for') || 
                     request?.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request?.headers.get('user-agent')

    return await db.usageEvent.create({
      data: {
        eventType,
        userId,
        metadata,
        ipAddress,
        userAgent,
        description: `User ${eventType.toLowerCase().replace('_', ' ')}`
      }
    })
  },

  // Get user analytics
  async getUserAnalytics(userId: string, days = 30) {
    const since = new Date()
    since.setDate(since.getDate() - days)

    const events = await db.usageEvent.findMany({
      where: {
        userId,
        createdAt: { gte: since }
      },
      orderBy: { createdAt: 'desc' }
    })

    const analyses = await db.analysis.count({
      where: {
        userId,
        createdAt: { gte: since }
      }
    })

    const improvements = await db.improvement.count({
      where: {
        userId,
        createdAt: { gte: since }
      }
    })

    return {
      events,
      totalAnalyses: analyses,
      totalImprovements: improvements,
      period: days
    }
  }
}

// System configuration helpers
export const configHelpers = {
  // Get system configuration value
  async getConfig(key: string, defaultValue?: string): Promise<string | null> {
    const config = await db.systemConfig.findUnique({
      where: { key }
    })
    return config?.value ?? defaultValue ?? null
  },

  // Set system configuration value
  async setConfig(key: string, value: string, description?: string, category?: string) {
    return await db.systemConfig.upsert({
      where: { key },
      update: { value, description, category },
      create: { key, value, description, category }
    })
  },

  // Get all configurations by category
  async getConfigsByCategory(category: string) {
    return await db.systemConfig.findMany({
      where: { category },
      orderBy: { key: 'asc' }
    })
  }
} 