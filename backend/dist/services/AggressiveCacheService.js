"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggressiveCache = void 0;
class AggressiveCacheService {
    constructor() {
        this.caches = new Map();
        this.configs = new Map();
        this.refreshQueue = new Set();
        this.setupDefaultCaches();
        this.startBackgroundRefresh();
    }
    setupDefaultCaches() {
        this.createCache('users', {
            ttl: 15 * 60 * 1000,
            maxSize: 1000,
            staleWhileRevalidate: 5 * 60 * 1000
        });
        this.createCache('students', {
            ttl: 10 * 60 * 1000,
            maxSize: 100,
            staleWhileRevalidate: 3 * 60 * 1000
        });
        this.createCache('dashboard', {
            ttl: 30 * 60 * 1000,
            maxSize: 50,
            staleWhileRevalidate: 10 * 60 * 1000
        });
        this.createCache('audit', {
            ttl: 20 * 60 * 1000,
            maxSize: 100,
            staleWhileRevalidate: 5 * 60 * 1000
        });
        this.createCache('academic', {
            ttl: 60 * 60 * 1000,
            maxSize: 50,
            staleWhileRevalidate: 30 * 60 * 1000
        });
    }
    createCache(name, config) {
        this.caches.set(name, new Map());
        this.configs.set(name, config);
    }
    async get(cacheName, key, fetchFunction) {
        const cache = this.caches.get(cacheName);
        const config = this.configs.get(cacheName);
        if (!cache || !config) {
            throw new Error(`Cache '${cacheName}' not found`);
        }
        const entry = cache.get(key);
        const now = Date.now();
        if (entry && now < entry.expiresAt) {
            entry.hits++;
            console.log(`⚡ Cache HIT: ${cacheName}:${key} (${entry.hits} hits)`);
            return entry.data;
        }
        if (entry && now < entry.expiresAt + config.staleWhileRevalidate) {
            entry.hits++;
            console.log(`🔄 Cache STALE: ${cacheName}:${key} (serving stale, refreshing)`);
            this.refreshInBackground(cacheName, key, fetchFunction);
            return entry.data;
        }
        console.log(`❌ Cache MISS: ${cacheName}:${key} (fetching fresh)`);
        const freshData = await fetchFunction();
        this.set(cacheName, key, freshData);
        return freshData;
    }
    set(cacheName, key, data) {
        const cache = this.caches.get(cacheName);
        const config = this.configs.get(cacheName);
        if (!cache || !config) {
            throw new Error(`Cache '${cacheName}' not found`);
        }
        if (cache.size >= config.maxSize) {
            this.evictOldest(cacheName);
        }
        const now = Date.now();
        cache.set(key, {
            data,
            timestamp: now,
            hits: 0,
            expiresAt: now + config.ttl
        });
        console.log(`💾 Cache SET: ${cacheName}:${key}`);
    }
    async refreshInBackground(cacheName, key, fetchFunction) {
        const refreshKey = `${cacheName}:${key}`;
        if (this.refreshQueue.has(refreshKey)) {
            return;
        }
        this.refreshQueue.add(refreshKey);
        try {
            const freshData = await fetchFunction();
            this.set(cacheName, key, freshData);
            console.log(`🔄 Background refresh completed: ${refreshKey}`);
        }
        catch (error) {
            console.warn(`⚠️ Background refresh failed: ${refreshKey}`, error);
        }
        finally {
            this.refreshQueue.delete(refreshKey);
        }
    }
    invalidate(cacheName, key) {
        const cache = this.caches.get(cacheName);
        if (cache) {
            cache.delete(key);
            console.log(`🗑️ Cache invalidated: ${cacheName}:${key}`);
        }
    }
    invalidateCache(cacheName) {
        const cache = this.caches.get(cacheName);
        if (cache) {
            cache.clear();
            console.log(`🗑️ Cache cleared: ${cacheName}`);
        }
    }
    async preloadCriticalData() {
        console.log('🔥 Preloading critical data...');
        try {
            const { prisma } = require('../lib/prisma');
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    email: true,
                    passwordHash: true,
                    role: true,
                    isActive: true,
                    mustChangePassword: true,
                    lastLogin: true,
                    createdAt: true,
                    updatedAt: true
                },
                take: 50
            });
            users.forEach((user) => {
                this.set('users', user.email.toLowerCase(), user);
            });
            const [totalStudents, totalUsers] = await Promise.all([
                prisma.student.count(),
                prisma.user.count()
            ]);
            this.set('dashboard', 'basic_stats', {
                totalStudents,
                totalUsers,
                lastUpdated: new Date()
            });
            const [departments, faculties] = await Promise.all([
                prisma.department.findMany({
                    select: { id: true, name: true, code: true, facultyId: true }
                }),
                prisma.faculty.findMany({
                    select: { id: true, name: true, code: true }
                })
            ]);
            this.set('academic', 'departments', departments);
            this.set('academic', 'faculties', faculties);
            console.log('✅ Critical data preloaded successfully');
        }
        catch (error) {
            console.error('❌ Failed to preload critical data:', error);
        }
    }
    evictOldest(cacheName) {
        const cache = this.caches.get(cacheName);
        if (!cache)
            return;
        let oldestKey = '';
        let oldestTime = Date.now();
        for (const [key, entry] of cache.entries()) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldestKey = key;
            }
        }
        if (oldestKey) {
            cache.delete(oldestKey);
            console.log(`🗑️ Evicted oldest cache entry: ${cacheName}:${oldestKey}`);
        }
    }
    startBackgroundRefresh() {
        setInterval(() => {
            this.cleanupExpiredEntries();
        }, 5 * 60 * 1000);
        setInterval(() => {
            this.preloadCriticalData();
        }, 30 * 60 * 1000);
    }
    cleanupExpiredEntries() {
        const now = Date.now();
        let totalCleaned = 0;
        for (const [cacheName, cache] of this.caches.entries()) {
            const config = this.configs.get(cacheName);
            if (!config)
                continue;
            const keysToDelete = [];
            for (const [key, entry] of cache.entries()) {
                if (now > entry.expiresAt + config.staleWhileRevalidate) {
                    keysToDelete.push(key);
                }
            }
            keysToDelete.forEach(key => cache.delete(key));
            totalCleaned += keysToDelete.length;
        }
        if (totalCleaned > 0) {
            console.log(`🧹 Cleaned up ${totalCleaned} expired cache entries`);
        }
    }
    getStats() {
        const stats = {};
        for (const [cacheName, cache] of this.caches.entries()) {
            const config = this.configs.get(cacheName);
            if (!config)
                continue;
            const entries = Array.from(cache.values());
            const now = Date.now();
            stats[cacheName] = {
                entries: cache.size,
                maxSize: config.maxSize,
                utilization: Math.round((cache.size / config.maxSize) * 100),
                totalHits: entries.reduce((sum, entry) => sum + entry.hits, 0),
                expired: entries.filter(entry => now > entry.expiresAt).length,
                stale: entries.filter(entry => now > entry.expiresAt && now <= entry.expiresAt + config.staleWhileRevalidate).length
            };
        }
        return {
            caches: stats,
            refreshQueue: this.refreshQueue.size,
            totalCacheSize: Array.from(this.caches.values())
                .reduce((sum, cache) => sum + cache.size, 0)
        };
    }
}
exports.aggressiveCache = new AggressiveCacheService();
exports.aggressiveCache.preloadCriticalData();
exports.default = exports.aggressiveCache;
//# sourceMappingURL=AggressiveCacheService.js.map