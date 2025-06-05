import { Redis } from '@upstash/redis';

// Initialize Redis client - fallback to null if not configured
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache key generators
export const cacheKeys = {
  userEssentials: (userId: string) => `user:essentials:${userId}`,
  dashboardStats: (userId: string) => `user:stats:${userId}`,
  recentActivity: (userId: string) => `user:activity:${userId}`,
  userAnalyses: (userId: string, limit: number, offset: number) => 
    `user:analyses:${userId}:${limit}:${offset}`,
  userResumes: (userId: string, limit: number, offset: number) => 
    `user:resumes:${userId}:${limit}:${offset}`,
  userImprovements: (userId: string, limit: number, offset: number) => 
    `user:improvements:${userId}:${limit}:${offset}`,
  analysisById: (analysisId: string) => `analysis:${analysisId}`,
  userProfile: (userId: string) => `user:profile:${userId}`,
  userCredits: (userId: string) => `user:credits:${userId}`,
  userTransactions: (userId: string, limit: number, offset: number) => 
    `user:transactions:${userId}:${limit}:${offset}`,
};

// Cache TTL settings (in seconds)
export const cacheTTL = {
  userEssentials: 60, // 1 minute
  dashboardStats: 300, // 5 minutes
  recentActivity: 180, // 3 minutes
  userAnalyses: 600, // 10 minutes
  userResumes: 600, // 10 minutes
  userImprovements: 600, // 10 minutes
  analysisById: 1800, // 30 minutes
  userProfile: 300, // 5 minutes
  userCredits: 60, // 1 minute
  userTransactions: 600, // 10 minutes
};

/**
 * Generic caching function with Redis
 */
export async function getCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // If Redis is not configured, always fetch fresh data
  if (!redis) {
    console.log(`[REDIS_CACHE] Redis not configured, fetching fresh data for: ${key}`);
    return await fetcher();
  }

  try {
    // Try to get from cache first
    const cached = await redis.get(key);
    
    if (cached !== null) {
      console.log(`[REDIS_CACHE] Cache HIT for key: ${key}`);
      return cached as T;
    }

    console.log(`[REDIS_CACHE] Cache MISS for key: ${key}`);
    
    // Fetch fresh data
    const data = await fetcher();
    
    // Store in cache with TTL
    if (data !== null && data !== undefined) {
      await redis.setex(key, ttlSeconds, JSON.stringify(data));
      console.log(`[REDIS_CACHE] Cached data for key: ${key} (TTL: ${ttlSeconds}s)`);
    }
    
    return data;
  } catch (error) {
    console.error(`[REDIS_CACHE] Error with key ${key}:`, error);
    // Fallback to direct fetch if Redis fails
    return await fetcher();
  }
}

/**
 * Set data in cache
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  if (!redis) {
    console.log(`[REDIS_CACHE] Redis not configured, skipping cache set for: ${key}`);
    return;
  }

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    console.log(`[REDIS_CACHE] Set cache for key: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (error) {
    console.error(`[REDIS_CACHE] Error setting cache for key ${key}:`, error);
  }
}

/**
 * Delete specific cache key
 */
export async function deleteCachedData(key: string): Promise<void> {
  if (!redis) {
    console.log(`[REDIS_CACHE] Redis not configured, skipping cache delete for: ${key}`);
    return;
  }

  try {
    await redis.del(key);
    console.log(`[REDIS_CACHE] Deleted cache for key: ${key}`);
  } catch (error) {
    console.error(`[REDIS_CACHE] Error deleting cache for key ${key}:`, error);
  }
}

/**
 * Delete multiple cache keys
 */
export async function deleteCachedDataBatch(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  
  if (!redis) {
    console.log(`[REDIS_CACHE] Redis not configured, skipping batch delete for ${keys.length} keys`);
    return;
  }
  
  try {
    await redis.del(...keys);
    console.log(`[REDIS_CACHE] Deleted ${keys.length} cache keys`);
  } catch (error) {
    console.error(`[REDIS_CACHE] Error deleting cache keys:`, error);
  }
}

/**
 * Delete all cache keys matching a pattern
 */
export async function deleteCachePattern(pattern: string): Promise<void> {
  if (!redis) {
    console.log(`[REDIS_CACHE] Redis not configured, skipping pattern delete for: ${pattern}`);
    return;
  }

  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[REDIS_CACHE] Deleted ${keys.length} cache keys matching pattern: ${pattern}`);
    }
  } catch (error) {
    console.error(`[REDIS_CACHE] Error deleting cache pattern ${pattern}:`, error);
  }
}

/**
 * Dashboard cache management
 */
export const dashboardCache = {
  /**
   * Invalidate all user-related caches
   */
  async invalidateUser(userId: string): Promise<void> {
    if (!redis) {
      console.log(`[REDIS_CACHE] Redis not configured, skipping user cache invalidation for: ${userId}`);
      return;
    }

    try {
      const userCacheKeys = [
        cacheKeys.userEssentials(userId),
        cacheKeys.dashboardStats(userId),
        cacheKeys.recentActivity(userId),
        cacheKeys.userProfile(userId),
        cacheKeys.userCredits(userId),
      ];

      // Also delete pattern-based caches for this user
      await Promise.all([
        deleteCachedDataBatch(userCacheKeys),
        deleteCachePattern(`user:analyses:${userId}:*`),
        deleteCachePattern(`user:resumes:${userId}:*`),
        deleteCachePattern(`user:improvements:${userId}:*`),
        deleteCachePattern(`user:transactions:${userId}:*`),
      ]);

      console.log(`[REDIS_CACHE] Invalidated all caches for user: ${userId}`);
    } catch (error) {
      console.error(`[REDIS_CACHE] Error invalidating user cache for ${userId}:`, error);
    }
  },

  /**
   * Invalidate analysis-related caches
   */
  async invalidateAnalysis(analysisId: string, userId: string): Promise<void> {
    try {
      const keys = [
        cacheKeys.analysisById(analysisId),
        cacheKeys.dashboardStats(userId),
        cacheKeys.recentActivity(userId),
      ];

      await Promise.all([
        deleteCachedDataBatch(keys),
        deleteCachePattern(`user:analyses:${userId}:*`),
      ]);

      console.log(`[REDIS_CACHE] Invalidated analysis caches for: ${analysisId}`);
    } catch (error) {
      console.error(`[REDIS_CACHE] Error invalidating analysis cache:`, error);
    }
  },

  /**
   * Invalidate resume-related caches
   */
  async invalidateResume(userId: string): Promise<void> {
    try {
      const keys = [
        cacheKeys.dashboardStats(userId),
        cacheKeys.recentActivity(userId),
      ];

      await Promise.all([
        deleteCachedDataBatch(keys),
        deleteCachePattern(`user:resumes:${userId}:*`),
      ]);

      console.log(`[REDIS_CACHE] Invalidated resume caches for user: ${userId}`);
    } catch (error) {
      console.error(`[REDIS_CACHE] Error invalidating resume cache:`, error);
    }
  },

  /**
   * Invalidate improvement-related caches
   */
  async invalidateImprovement(userId: string): Promise<void> {
    try {
      const keys = [
        cacheKeys.dashboardStats(userId),
        cacheKeys.recentActivity(userId),
      ];

      await Promise.all([
        deleteCachedDataBatch(keys),
        deleteCachePattern(`user:improvements:${userId}:*`),
      ]);

      console.log(`[REDIS_CACHE] Invalidated improvement caches for user: ${userId}`);
    } catch (error) {
      console.error(`[REDIS_CACHE] Error invalidating improvement cache:`, error);
    }
  },

  /**
   * Clear all cache (use with caution)
   */
  async clearAll(): Promise<void> {
    if (!redis) {
      console.log(`[REDIS_CACHE] Redis not configured, skipping clear all operation`);
      return;
    }

    try {
      await redis.flushall();
      console.log(`[REDIS_CACHE] Cleared all cache data`);
    } catch (error) {
      console.error(`[REDIS_CACHE] Error clearing all cache:`, error);
    }
  },
};

/**
 * Get cache stats for monitoring
 */
export async function getCacheStats(): Promise<{
  totalKeys: number;
  memory: string;
  hits: number;
  misses: number;
}> {
  if (!redis) {
    return {
      totalKeys: 0,
      memory: 'Redis not configured',
      hits: 0,
      misses: 0,
    };
  }

  try {
    const keys = await redis.dbsize();
    
    return {
      totalKeys: keys,
      memory: 'N/A', // Upstash REST API doesn't expose memory info
      hits: 0, // Would need Redis Enterprise for detailed stats
      misses: 0,
    };
  } catch (error) {
    console.error(`[REDIS_CACHE] Error getting cache stats:`, error);
    return {
      totalKeys: 0,
      memory: 'N/A',
      hits: 0,
      misses: 0,
    };
  }
}

export { redis }; 