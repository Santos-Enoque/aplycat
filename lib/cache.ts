// Simple in-memory cache for dashboard data
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Maximum cache entries

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Clean up old entries if cache is getting too large
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // Delete all cache entries for a user (useful after data changes)
  invalidateUser(userId: string): void {
    const keysToDelete: string[] = [];
    for (const [key] of this.cache.entries()) {
      if (key.includes(`user:${userId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Get cache stats for monitoring
  getStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      total: this.cache.size,
      valid: validEntries,
      expired: expiredEntries,
    };
  }
}

// Global cache instance
export const dashboardCache = new SimpleCache();

// Cache key generators
export const cacheKeys = {
  userEssentials: (userId: string) => `user:${userId}:essentials`,
  dashboardStats: (userId: string) => `user:${userId}:stats`,
  recentActivity: (userId: string) => `user:${userId}:recent-activity`,
  userResumes: (userId: string) => `user:${userId}:resumes`,
  userAnalyses: (userId: string) => `user:${userId}:analyses`,
};

// Helper function to get or set cache data
export async function getCachedData<T>(
  key: string,
  fetchFunction: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  // Try to get from cache first
  const cached = dashboardCache.get<T>(key);
  if (cached) {
    return cached;
  }

  // If not in cache, fetch fresh data
  const freshData = await fetchFunction();
  
  // Store in cache
  dashboardCache.set(key, freshData, ttlSeconds);
  
  return freshData;
} 