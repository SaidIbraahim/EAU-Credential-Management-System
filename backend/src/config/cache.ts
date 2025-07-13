/**
 * High-Performance User Authentication Cache
 * Target: Reduce login time from 644ms to <100ms
 */

interface CachedUser {
  id: number;
  email: string;
  passwordHash: string | null;
  role: 'ADMIN' | 'SUPER_ADMIN';
  isActive: boolean;
  mustChangePassword: boolean;
  lastLogin: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CacheEntry {
  user: CachedUser;
  timestamp: number;
}

class UserAuthCache {
  private cache = new Map<string, CacheEntry>();
  private readonly TTL = 10 * 60 * 1000; // 10 minutes
  private readonly maxSize = 1000; // Max cached users

  /**
   * Get user from cache by email
   */
  get(email: string): CachedUser | null {
    const entry = this.cache.get(email.toLowerCase());
    
    if (!entry) {
      return null;
    }

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.TTL) {
      this.cache.delete(email.toLowerCase());
      return null;
    }

    return entry.user;
  }

  /**
   * Cache user data for fast authentication
   */
  set(email: string, user: CachedUser): void {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    this.cache.set(email.toLowerCase(), {
      user,
      timestamp: Date.now()
    });
  }

  /**
   * Remove user from cache (when user data changes)
   */
  invalidate(email: string): void {
    this.cache.delete(email.toLowerCase());
  }

  /**
   * Clear all cached users
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    const activeEntries = Array.from(this.cache.values()).filter(
      entry => now - entry.timestamp < this.TTL
    );

    return {
      totalEntries: this.cache.size,
      activeEntries: activeEntries.length,
      hitRate: this.cache.size > 0 ? (activeEntries.length / this.cache.size) * 100 : 0,
      memoryUsage: this.cache.size * 1024 // Rough estimate in bytes
    };
  }

  /**
   * Evict oldest entries when cache is full
   */
  private evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Cleanup expired entries (run periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const userAuthCache = new UserAuthCache();

// Setup periodic cleanup (every 5 minutes)
setInterval(() => {
  userAuthCache.cleanup();
}, 5 * 60 * 1000);

export default userAuthCache; 