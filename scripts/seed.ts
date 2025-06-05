import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create pricing plans
  const welcomeBonusPlan = await prisma.pricingPlan.upsert({
    where: { name: 'Welcome Bonus' },
    update: {},
    create: {
      name: 'Welcome Bonus',
      description: 'Experience the complete Aplycat journey',
      monthlyCredits: 7,
      analysisCredits: 1,
      improvementCredits: 2,
      price: 0,
      currency: 'USD',
      features: [
        '1× Resume Analysis (1 credit)',
        '1× Resume Improvement (2 credits)',
        '1× Job-Tailored Resume + Cover Letter (3 credits)',
        '1 bonus credit for flexibility',
        'Complete transformation included'
      ],
      isActive: true,
      isPopular: false
    }
  })

  const starterPack = await prisma.pricingPlan.upsert({
    where: { name: 'Starter Pack' },
    update: {},
    create: {
      name: 'Starter Pack',
      description: 'Perfect for getting started',
      monthlyCredits: 3,
      analysisCredits: 1,
      improvementCredits: 2,
      price: 4.99,
      currency: 'USD',
      features: [
        '1 Resume Analysis',
        '1 Resume Improvement',
        '1 Resume Template selection'
      ],
      isActive: true,
      isPopular: false
    }
  })

  const proPlan = await prisma.pricingPlan.upsert({
    where: { name: 'Professional Pack' },
    update: {},
    create: {
      name: 'Professional Pack',
      description: 'Everything you need for your job search',
      monthlyCredits: 15,
      analysisCredits: 1,
      improvementCredits: 2,
      price: 12.49,
      currency: 'USD',
      features: [
        '6 Resume Analyses',
        '5 Resume Improvements',
        '4 Job-Tailored Resume + Cover Letter combos',
        'Priority Support'
      ],
      isActive: true,
      isPopular: true
    }
  })

  const powerUserPlan = await prisma.pricingPlan.upsert({
    where: { name: 'Power User Pack' },
    update: {},
    create: {
      name: 'Power User Pack',
      description: 'Best value for power users',
      monthlyCredits: 40,
      analysisCredits: 1,
      improvementCredits: 2,
      price: 24.99,
      currency: 'USD',
      features: [
        '15 Resume Analyses',
        '13 Resume Improvements',
        '12 Job-Tailored Resume + Cover Letter combos',
        'Premium Support',
        'Career change optimization'
      ],
      isActive: true,
      isPopular: false
    }
  })

  console.log('✅ Created pricing plans:', { 
    welcomeBonusPlan: welcomeBonusPlan.name, 
    starterPack: starterPack.name,
    proPlan: proPlan.name, 
    powerUserPlan: powerUserPlan.name 
  })

  // Create system configurations
  const configs = [
    {
      key: 'max_file_size',
      value: '10485760', // 10MB in bytes
      description: 'Maximum file size allowed for resume uploads',
      category: 'file_upload'
    },
    {
      key: 'allowed_file_types',
      value: 'pdf,doc,docx',
      description: 'Comma-separated list of allowed file extensions',
      category: 'file_upload'
    },
    {
      key: 'free_signup_credits',
      value: '7',
      description: 'Number of free credits new users receive on signup',
      category: 'credits'
    },
    {
      key: 'analysis_cost',
      value: '1',
      description: 'Number of credits required for resume analysis',
      category: 'credits'
    },
    {
      key: 'improvement_cost',
      value: '2',
      description: 'Number of credits required for resume improvement',
      category: 'credits'
    },
    {
      key: 'job_tailoring_cost',
      value: '3',
      description: 'Number of credits required for job-specific tailoring with cover letter',
      category: 'credits'
    },
    {
      key: 'cover_letter_cost',
      value: '2',
      description: 'Number of credits required for cover letter generation',
      category: 'credits'
    },
    {
      key: 'custom_update_cost',
      value: '1',
      description: 'Number of credits required for custom updates',
      category: 'credits'
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode to disable new uploads',
      category: 'system'
    },
    {
      key: 'max_analyses_per_hour',
      value: '10',
      description: 'Maximum number of analyses a user can perform per hour',
      category: 'rate_limiting'
    },
    {
      key: 'max_improvements_per_hour',
      value: '5',
      description: 'Maximum number of improvements a user can perform per hour',
      category: 'rate_limiting'
    },
    {
      key: 'openai_model',
      value: 'gpt-4o-mini',
      description: 'OpenAI model to use for analysis and improvements',
      category: 'ai'
    },
    {
      key: 'openai_max_tokens',
      value: '4000',
      description: 'Maximum tokens for OpenAI requests',
      category: 'ai'
    },
    {
      key: 'email_notifications',
      value: 'true',
      description: 'Enable email notifications for users',
      category: 'notifications'
    },
    {
      key: 'analytics_enabled',
      value: 'true',
      description: 'Enable usage analytics tracking',
      category: 'analytics'
    }
  ]

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {
        value: config.value,
        description: config.description,
        category: config.category
      },
      create: config
    })
  }

  console.log('✅ Created system configurations')

  // Create sample waitlist entry (optional)
  await prisma.waitlistEntry.upsert({
    where: { email: 'admin@aplycat.com' },
    update: {},
    create: {
      email: 'admin@aplycat.com',
      firstName: 'Admin',
      lastName: 'User',
      company: 'Aplycat',
      role: 'System Administrator',
      source: 'internal',
      isNotified: true,
      notifiedAt: new Date()
    }
  })

  console.log('✅ Created sample waitlist entry')

  console.log('🎉 Database seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 