# Redis Caching with Upstash

This document outlines the Redis-based caching implementation using Upstash Redis for the ApplyCat application.

## Overview

The application now uses Upstash Redis for robust, persistent caching of database operations, significantly improving performance and reducing database load.

## Configuration

### Environment Variables

Add these to your `.env.local` file:

```bash
# Upstash Redis Cache
UPSTASH_REDIS_REST_URL="https://xxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_redis_token_here"
```

### Fallback Behavior

The system gracefully handles cases where Redis is not configured:

- All cache operations fall back to direct database queries
- No errors are thrown when Redis credentials are missing
- Logs indicate when Redis is not configured

## Cache Implementation

### Cache Keys Structure

```typescript
// User-specific caches
user:essentials:{userId}
user:stats:{userId}
user:activity:{userId}
user:profile:{userId}
user:credits:{userId}

// Paginated data caches
user:analyses:{userId}:{limit}:{offset}
user:resumes:{userId}:{limit}:{offset}
user:transactions:{userId}:{limit}:{offset}

// Individual resource caches
analysis:{analysisId}
```

### Cache TTL Settings

- **User Essentials**: 60 seconds (frequently updated)
- **Dashboard Stats**: 300 seconds (5 minutes)
- **Recent Activity**: 180 seconds (3 minutes)
- **User Analyses**: 600 seconds (10 minutes)
- **User Resumes**: 600 seconds (10 minutes)
- **Individual Analysis**: 1800 seconds (30 minutes)
- **User Profile**: 300 seconds (5 minutes)
- **User Credits**: 60 seconds (frequently updated)
- **Credit Transactions**: 600 seconds (10 minutes)

## Server Actions with Caching

### Dashboard Actions (`lib/actions/dashboard-actions.ts`)

- `getUserEssentials()` - User's basic info with short TTL
- `getDashboardStats()` - Count statistics with medium TTL
- `getRecentActivity()` - Recent analyses and improvements
- `invalidateDashboardCache()` - Clear user-specific caches

### Resume Actions (`lib/actions/resume-actions.ts`)

- `getUserResumes()` - Paginated resume list
- `getUserAnalyses()` - Paginated analysis history
- `getAnalysisById()` - Individual analysis details
- Cache invalidation on resume/analysis changes

### User Actions (`lib/actions/user-actions.ts`)

- `getUserProfile()` - User profile information
- `getUserCreditTransactions()` - Credit transaction history
- Cache invalidation on profile/credit changes

## Cache Management

### Automatic Invalidation

The system automatically invalidates relevant caches when:

1. **New Analysis Created**: Invalidates dashboard stats, recent activity, and user analyses
2. **Resume Added/Updated**: Invalidates resume lists and dashboard stats
3. **User Profile Updated**: Invalidates user profile and essentials
4. **Credits Changed**: Invalidates user essentials and credit-related caches

### Manual Cache Operations

```typescript
import { dashboardCache } from "@/lib/redis-cache";

// Invalidate all user caches
await dashboardCache.invalidateUser(userId);

// Invalidate specific analysis
await dashboardCache.invalidateAnalysis(analysisId, userId);

// Invalidate resume-related caches
await dashboardCache.invalidateResume(userId);

// Clear all cache (development only)
await dashboardCache.clearAll();
```

## Cache Monitoring

### API Endpoint: `/api/monitoring/cache`

**GET** - Get cache statistics:

```json
{
  "success": true,
  "cache": {
    "provider": "Upstash Redis",
    "stats": {
      "totalKeys": 42,
      "memory": "N/A",
      "hits": 0,
      "misses": 0
    },
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

**DELETE** - Clear cache:

```bash
# Clear specific user cache
DELETE /api/monitoring/cache?userId=user123

# Clear all cache (development only)
DELETE /api/monitoring/cache?action=clear-all
```

## Performance Benefits

### Database Load Reduction

- **Dashboard loads**: Reduced from ~8 queries to 0-3 queries (depending on cache hits)
- **Pagination**: Cached results for common page sizes
- **User data**: Frequently accessed user info cached efficiently

### Response Time Improvements

- **Cache hits**: Sub-10ms response times
- **Progressive loading**: Each section can load independently from cache
- **Reduced database connections**: Lower connection pool usage

### Scalability

- **Multi-instance**: Cache shared across multiple app instances
- **Persistent**: Cache survives application restarts
- **Global**: Upstash Redis provides global edge caching

## Best Practices

### Cache Key Design

- Use consistent naming patterns
- Include relevant identifiers (userId, pagination params)
- Avoid key collisions with namespacing

### TTL Strategy

- Short TTL for frequently changing data (credits, user stats)
- Medium TTL for moderately stable data (analyses, resumes)
- Long TTL for rarely changing data (individual analysis results)

### Invalidation Strategy

- Invalidate proactively on data changes
- Use pattern-based invalidation for related data
- Batch invalidation operations when possible

### Error Handling

- Always provide fallback to direct database queries
- Log cache errors for monitoring
- Don't let cache failures break the application

## Monitoring and Debugging

### Log Messages

The system provides detailed logging:

```
[REDIS_CACHE] Cache HIT for key: user:essentials:user123
[REDIS_CACHE] Cache MISS for key: user:stats:user123
[REDIS_CACHE] Cached data for key: user:stats:user123 (TTL: 300s)
[REDIS_CACHE] Invalidated all caches for user: user123
```

### Development Mode

In development, you can:

1. Monitor cache operations through logs
2. Use the monitoring API to check cache stats
3. Clear cache manually for testing
4. Run without Redis for comparison

## Migration Notes

### From Previous Implementation

The previous Redis implementation has been replaced with:

- ✅ Upstash Redis (more reliable, managed service)
- ✅ Type-safe cache operations
- ✅ Resilient fallback behavior
- ✅ Comprehensive invalidation strategies
- ✅ Built-in monitoring capabilities

### Database Queries

All direct database calls in components have been moved to server actions with caching:

- `app/dashboard/page.tsx` - Now uses cached server actions
- API routes - Use cache invalidation instead of direct cache calls
- Components - Receive pre-cached data from server actions

## Future Enhancements

### Planned Improvements

1. **Cache warming**: Pre-populate frequently accessed data
2. **Cache analytics**: Track hit/miss ratios
3. **Distributed invalidation**: Handle multi-region deployments
4. **Cache compression**: Reduce memory usage for large datasets
5. **Background refresh**: Update cache before expiration

### Monitoring Enhancements

1. **Alerts**: Set up monitoring for cache performance
2. **Dashboards**: Visualize cache metrics
3. **Health checks**: Include cache status in health endpoints
4. **Performance tracking**: Measure impact on response times
