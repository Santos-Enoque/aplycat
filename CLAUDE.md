# CLAUDE.md - Project Guidelines and Standards

## Project Overview

**ApplyCat** is a Next.js 15 application for resume analysis and improvement using AI. The app features multi-language support, payment processing (Stripe/MPesa), real-time streaming, and comprehensive user management.

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Payments**: Stripe + MPesa integration
- **Styling**: Tailwind CSS + shadcn/ui components
- **Internationalization**: next-intl
- **State Management**: React hooks + Context
- **Deployment**: Vercel

---

## Code Style Guidelines

### TypeScript Standards

#### Type Safety

```typescript
// ✅ GOOD - Proper typing
interface CreateCheckoutParams {
  userId: string;
  packageType: CreditPackageType;
  userEmail: string;
  paymentMethod?: PaymentMethod;
}

// ❌ AVOID - Using 'any'
function processData(data: any) { ... }

// ✅ GOOD - Specific types
function processData(data: ResumeAnalysis) { ... }
```

#### Error Handling

```typescript
// ✅ GOOD - Proper error typing in catch blocks
try {
  await someOperation();
} catch (error) {
  if (error && typeof error === "object" && "code" in error) {
    // Handle specific error codes
  }
  console.error("Operation failed:", error);
}
```

#### Null Safety

```typescript
// ✅ GOOD - Use optional chaining and nullish coalescing
const userEmail = user?.email || "Unknown";
const credits = user?.credits ?? 0;

// ❌ AVOID - Direct property access without checks
const userEmail = user.email; // Potential null reference
```

### Component Patterns

#### React Components

```typescript
// ✅ GOOD - Functional component with proper props
interface ComponentProps {
  title: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

export function Component({ title, onAction, children }: ComponentProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
      {onAction && <Button onClick={onAction}>Action</Button>}
    </div>
  );
}
```

#### Custom Hooks

```typescript
// ✅ GOOD - Custom hook pattern
export function useStreamingAnalysis() {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = useCallback(async (resumeData: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Implementation
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { isLoading, data, error, startAnalysis };
}
```

### API Route Patterns

#### Route Structure

```typescript
// ✅ GOOD - Consistent API route pattern
export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // 2. Input validation
    const body = await request.json();
    const validatedData = schema.parse(body);

    // 3. Business logic
    const result = await processRequest(validatedData);

    // 4. Response
    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("[API_ROUTE] Error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Error Responses

```typescript
// ✅ GOOD - Consistent error response format
return NextResponse.json(
  {
    success: false,
    error: "Descriptive error message",
    code: "SPECIFIC_ERROR_CODE", // Optional for client handling
  },
  { status: 400 }
);
```

### Database Patterns

#### Prisma Queries

```typescript
// ✅ GOOD - Transaction pattern for related operations
const result = await db.$transaction(async (tx) => {
  const user = await tx.user.update({
    where: { id: userId },
    data: { credits: { increment: creditAmount } },
  });

  const transaction = await tx.creditTransaction.create({
    data: {
      userId,
      type: "PURCHASE",
      amount: creditAmount,
      description: `Purchased ${creditAmount} credits`,
    },
  });

  return { user, transaction };
});
```

#### Query Optimization

```typescript
// ✅ GOOD - Include only necessary relations
const user = await db.user.findUnique({
  where: { clerkId: userId },
  select: {
    id: true,
    credits: true,
    email: true,
  },
});

// ✅ GOOD - Pagination for large datasets
const transactions = await db.usageEvent.findMany({
  where: { userId },
  orderBy: { createdAt: "desc" },
  skip: (page - 1) * limit,
  take: limit,
});
```

---

## Project-Specific Rules

### Payment Processing

- Always use transactions for credit operations
- Log all payment events in `usageEvent` table
- Support both Stripe and MPesa payment methods
- Include proper error handling and status tracking

### Resume Analysis

- Use streaming responses for long-running AI operations
- Cache analysis results when possible
- Implement proper credit deduction checks
- Support multiple languages (EN/PT)

### Security

- Always validate user authentication before API operations
- Sanitize and validate all user inputs
- Use proper CORS settings for API routes
- Implement rate limiting for expensive operations

### Internationalization

- Use next-intl for all user-facing text
- Support English (en) and Portuguese (pt) locales
- Include locale in all route parameters
- Provide fallback text for missing translations

---

## Component Conventions

### File Organization

```
components/
├── ui/           # Base UI components (shadcn/ui)
├── dashboard/    # Dashboard-specific components
├── providers/    # Context providers
└── [feature]/    # Feature-specific components
```

### Naming Conventions

- Components: `PascalCase` (e.g., `DashboardContent`)
- Files: `kebab-case` (e.g., `dashboard-content.tsx`)
- Hooks: `camelCase` starting with `use` (e.g., `useStreamingAnalysis`)
- Constants: `UPPER_SNAKE_CASE` (e.g., `STRIPE_CONFIG`)

### CSS Classes

```typescript
// ✅ GOOD - Use Tailwind utility classes
<div className="flex items-center space-x-2 rounded-lg border p-4">

// ✅ GOOD - Use cn() utility for conditional classes
<Button
  className={cn(
    "w-full",
    isLoading && "opacity-50 cursor-not-allowed"
  )}
>
```

---

## Performance Guidelines

### Client-Side

- Use React.memo() for expensive components
- Implement proper loading states
- Lazy load heavy components with dynamic imports
- Optimize images with Next.js Image component

### Server-Side

- Use database indexes for frequently queried fields
- Implement Redis caching for expensive operations
- Use streaming for large responses
- Optimize bundle size with proper imports

### Monitoring

- Log performance metrics using the performance monitoring system
- Track user interactions with PostHog
- Monitor API response times
- Alert on error rates

---

## Testing Standards

### Unit Tests

- Test pure functions and utilities
- Mock external dependencies
- Use descriptive test names
- Cover edge cases and error scenarios

### Integration Tests

- Test API routes with real database
- Test payment flows end-to-end
- Validate internationalization
- Test authentication flows

---

## Documentation Requirements

### Code Comments

```typescript
/**
 * Processes a payment and updates user credits
 * @param params - Payment processing parameters
 * @returns Promise resolving to updated user and transaction
 * @throws Error if payment processing fails
 */
export async function processPayment(params: ProcessPaymentParams) {
  // Implementation
}
```

### API Documentation

- Document all route parameters and responses
- Include example requests and responses
- Document authentication requirements
- Specify rate limits and error codes

### Component Documentation

- Use JSDoc for complex component props
- Include usage examples for reusable components
- Document accessibility considerations
- Specify browser support requirements

---

## Review Criteria

### Code Quality Checklist

- [ ] TypeScript types are properly defined
- [ ] Error handling is comprehensive
- [ ] Security best practices are followed
- [ ] Performance optimizations are applied
- [ ] Internationalization is implemented
- [ ] Tests cover critical functionality
- [ ] Documentation is complete and accurate

### Architecture Compliance

- [ ] Follows established patterns
- [ ] Maintains separation of concerns
- [ ] Uses appropriate abstractions
- [ ] Implements proper error boundaries
- [ ] Follows Next.js best practices

### Business Logic Validation

- [ ] Credit system works correctly
- [ ] Payment flows are secure
- [ ] User permissions are enforced
- [ ] Data consistency is maintained
- [ ] Feature flags are properly implemented

---

## Migration and Deployment

### Database Migrations

- Always test migrations in development first
- Use transactions for complex migrations
- Provide rollback procedures
- Document schema changes

### Feature Deployment

- Use feature flags for gradual rollouts
- Monitor error rates after deployment
- Have rollback procedures ready
- Test payment systems thoroughly

### Environment Management

- Keep environment variables secure
- Use different configurations per environment
- Document required environment variables
- Validate configuration on startup

---

This document serves as the authoritative guide for development standards in the ApplyCat project. All code should adhere to these guidelines to ensure consistency, maintainability, and quality.
