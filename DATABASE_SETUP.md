# 🗄️ Database Setup Guide - Aplycat

This guide will help you set up the production-ready database for the Aplycat AI resume analysis platform.

## 🏗️ Database Architecture Overview

Our Prisma schema includes:

- **User Management** with Clerk integration
- **Credit System** for freemium monetization
- **Resume & File Management** with UploadThing URLs
- **Analysis Results** storage with JSON flexibility
- **Resume Improvements** with AI optimization tracking
- **Subscription & Billing** with Stripe integration
- **Usage Analytics** for business insights
- **System Configuration** for runtime settings

## 📋 Prerequisites

- Node.js 18+ installed
- PostgreSQL database (local or cloud)
- npm or yarn package manager

## ⚙️ Environment Setup

1. **Copy environment variables:**

```bash
cp .env.example .env
```

2. **Configure your database URL in `.env`:**

```bash
DATABASE_URL="postgresql://username:password@localhost:5432/aplycat_db"
```

3. **Add other required environment variables:**

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here

# OpenAI API
OPENAI_API_KEY=sk-your_openai_api_key_here

# UploadThing File Upload
UPLOADTHING_SECRET=sk_live_your_uploadthing_secret_here
UPLOADTHING_APP_ID=your_uploadthing_app_id_here

# Stripe (for billing)
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_key_here
```

## 🚀 Database Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Generate Prisma client:**

```bash
npm run db:generate
```

3. **Push schema to database (for development):**

```bash
npm run db:push
```

**OR** for production with migrations:

3. **Create and run migration:**

```bash
npm run db:migrate
```

4. **Seed the database with initial data:**

```bash
npm run db:seed
```

## 📊 Database Management Commands

```bash
# Generate Prisma client
npm run db:generate

# Push schema changes (development)
npm run db:push

# Create new migration
npm run db:migrate

# Deploy migrations (production)
npm run db:migrate:deploy

# Reset database (⚠️ destructive)
npm run db:reset

# Seed database with initial data
npm run db:seed

# Open Prisma Studio (database GUI)
npm run db:studio
```

## 🏗️ Schema Highlights

### 👤 User Management

- Clerk integration with `clerkId`
- Credit balance and usage tracking
- Premium status and subscription management

### 💳 Credit System

- Flexible credit transaction system
- Support for multiple credit sources (signup, purchase, subscription)
- Detailed transaction history

### 📄 Resume Management

- File storage via UploadThing URLs
- Version control and metadata
- User-defined titles and descriptions

### 🤖 AI Analysis & Improvements

- JSON storage for flexible analysis data
- Credit cost tracking per operation
- Processing time monitoring
- Industry and role targeting for improvements

### 💰 Billing & Subscriptions

- Stripe integration ready
- Multiple pricing plans
- Subscription status tracking
- Billing cycle management

## 💡 Key Features

### 🎯 Credit System

```typescript
// Check user credits
const hasCredits = await creditHelpers.hasEnoughCredits(userId, 2);

// Deduct credits for analysis
await creditHelpers.deductCredits(
  userId,
  1,
  "ANALYSIS_USE",
  "Resume analysis for John_Resume.pdf",
  analysisId
);

// Add credits (purchase/subscription)
await creditHelpers.addCredits(
  userId,
  50,
  "PURCHASE",
  "Monthly Pro subscription credits"
);
```

### 📈 Analytics Tracking

```typescript
// Track user events
await analyticsHelpers.trackEvent(
  "RESUME_UPLOAD",
  userId,
  { fileName: "resume.pdf", fileSize: 1024000 },
  request
);

// Get user analytics
const analytics = await analyticsHelpers.getUserAnalytics(userId, 30);
```

### ⚙️ System Configuration

```typescript
// Get configuration
const maxFileSize = await configHelpers.getConfig("max_file_size", "10485760");

// Update configuration
await configHelpers.setConfig(
  "maintenance_mode",
  "true",
  "Enable maintenance mode for system updates"
);
```

## 🛡️ Security Features

- **Cascade Deletions**: User data is properly cleaned up
- **Soft Deletes**: Important records can be marked inactive
- **Data Validation**: Prisma enforces schema constraints
- **Transaction Safety**: Credit operations use database transactions

## 📊 Pricing Plans (Seeded Data)

| Plan             | Credits      | Price | Features                                      |
| ---------------- | ------------ | ----- | --------------------------------------------- |
| **Free Trial**   | 10           | $0    | Complete transformation experience (one-time) |
| **Starter Pack** | 25           | $9    | Perfect for polishing one resume              |
| **Professional** | 70 (60+10)   | $19   | Job search essentials + 16% bonus             |
| **Power User**   | 165 (140+25) | $39   | Career advancement + 22% bonus                |

### Credit Costs per Feature:

- **Resume Analysis**: 2 credits (detailed section-by-section analysis)
- **Resume Improvement**: 3 credits (full resume regeneration)
- **Job Tailoring**: 4 credits (role-specific optimization + cover letter)
- **Cover Letter**: 2 credits (professional cover letter generation)
- **Custom Update**: 1 credit (targeted modifications)

## 🔧 Production Deployment

1. **Set up PostgreSQL database** (AWS RDS, Supabase, Railway, etc.)

2. **Configure production environment variables**

3. **Run migrations:**

```bash
npm run db:migrate:deploy
```

4. **Seed production data:**

```bash
npm run db:seed
```

5. **Verify deployment:**

```bash
npm run db:studio
```

## 🐛 Troubleshooting

### Common Issues:

**Database connection failed:**

- Check DATABASE_URL format
- Verify database server is running
- Ensure firewall allows connections

**Migration errors:**

- Check for schema conflicts
- Verify database permissions
- Use `npm run db:reset` for development (⚠️ destructive)

**Prisma client issues:**

- Run `npm run db:generate` after schema changes
- Restart your development server
- Clear node_modules and reinstall if needed

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
- [Clerk Authentication](https://clerk.com/docs)
- [UploadThing File Upload](https://docs.uploadthing.com)
- [Stripe Billing](https://stripe.com/docs)

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Prisma logs for detailed error messages
3. Ensure all environment variables are correctly set
4. Verify database permissions and connectivity

---

**Database Version:** PostgreSQL 13+  
**Prisma Version:** 6.1.0+  
**Last Updated:** December 2024
