interface CacheEntry {
  value: any;
  expiry: number;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private timers = new Map<string, NodeJS.Timeout>();

  async get(key: string): Promise<any> {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    if (Date.now() > entry.expiry) {
      this.delete(key);
      return null;
    }
    
    return entry.value;
  }

  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    const expiry = Date.now() + (ttlSeconds * 1000);
    
    // Clear existing timer if any
    const existingTimer = this.timers.get(key);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Set cache entry
    this.cache.set(key, { value, expiry });
    
    // Set auto-cleanup timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlSeconds * 1000);
    
    this.timers.set(key, timer);
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key);
    
    const timer = this.timers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  async clear(): Promise<void> {
    // Clear all timers
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    
    this.cache.clear();
    this.timers.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export const cache = new MemoryCache(); 