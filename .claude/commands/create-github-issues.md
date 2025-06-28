# Create GitHub Issues

Creates comprehensive GitHub issues for new features following ApplyCat project standards and best practices.

## Usage

```
/create-github-issues [feature description]
```

## Examples

```
/create-github-issues Create a real-time notification system that alerts users when their resume analysis completes

/create-github-issues Implement a user dashboard analytics panel that shows usage statistics and credit consumption patterns

/create-github-issues Add multi-language resume analysis support for Spanish and French with UI translations
```

## What it does

When you run this command, I will:

1. **Analyze Current Codebase**: Examine existing implementation patterns, database schemas, and integration points in the ApplyCat project
2. **Plan Feature Architecture**: Break down the feature into logical components following the project's Next.js 15, TypeScript, and Prisma patterns
3. **Create Epic Issue**: Generate a comprehensive epic issue with:
   - Business impact and user value proposition
   - Technical architecture overview
   - Implementation phases and dependencies
   - Success criteria and acceptance requirements
4. **Generate Component Issues**: Create detailed individual issues for:
   - **Database/Storage**: Schema changes, migrations, data integrity
   - **Backend/API**: Route handlers, business logic, authentication
   - **Frontend/UI**: Components, pages, user interactions, responsive design
   - **Performance**: Optimization, caching, monitoring
   - **Security**: Authorization, data protection, input validation
   - **Analytics**: Tracking, metrics, user insights
5. **Apply Project Standards**: Ensure all issues follow:
   - TypeScript best practices from CLAUDE.md
   - Clerk authentication patterns
   - Stripe/MPesa payment integration approaches
   - Multi-language support (EN/PT) requirements
   - Existing component and API conventions
6. **Create Issues in GitHub**: Use the `gh` CLI to automatically create all issues with proper:
   - Labels and priorities
   - Epic linking and dependencies
   - Acceptance criteria and technical details
   - Code examples following project patterns

## Issue Quality Standards

Each created issue includes:
- **Clear Scope**: Single responsibility with testable acceptance criteria
- **Technical Depth**: Code examples, API specifications, database schemas
- **Project Integration**: Follows existing patterns from components/, lib/, and app/ directories
- **Security Considerations**: Authentication, authorization, data validation
- **Performance Requirements**: Load times, scalability, monitoring
- **Error Handling**: Comprehensive error scenarios and user feedback
- **Testing Strategy**: Unit, integration, and E2E testing requirements
- **Documentation**: Code comments, API docs, user-facing documentation

## Labels and Organization

Issues are automatically labeled with:
- **Priority**: `critical`, `high-priority`, `medium-priority`, `low-priority`
- **Component**: `frontend`, `backend`, `database`, `api`, `ui`, `security`, `performance`
- **Type**: `epic`, `enhancement`, `feature`, `refactor`, `migration`
- **Size**: `small`, `medium`, `large` (for sprint planning)

The epic issue links to all component issues, creating a clear implementation roadmap with proper dependency tracking.