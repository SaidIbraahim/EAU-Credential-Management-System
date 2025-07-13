"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAuthCache = void 0;
class UserAuthCache {
    constructor() {
        this.cache = new Map();
        this.TTL = 10 * 60 * 1000;
        this.maxSize = 1000;
    }
    get(email) {
        const entry = this.cache.get(email.toLowerCase());
        if (!entry) {
            return null;
        }
        if (Date.now() - entry.timestamp > this.TTL) {
            this.cache.delete(email.toLowerCase());
            return null;
        }
        return entry.user;
    }
    set(email, user) {
        if (this.cache.size >= this.maxSize) {
            this.evictOldest();
        }
        this.cache.set(email.toLowerCase(), {
            user,
            timestamp: Date.now()
        });
    }
    invalidate(email) {
        this.cache.delete(email.toLowerCase());
    }
    clear() {
        this.cache.clear();
    }
    getStats() {
        const now = Date.now();
        const activeEntries = Array.from(this.cache.values()).filter(entry => now - entry.timestamp < this.TTL);
        return {
            totalEntries: this.cache.size,
            activeEntries: activeEntries.length,
            hitRate: this.cache.size > 0 ? (activeEntries.length / this.cache.size) * 100 : 0,
            memoryUsage: this.cache.size * 1024
        };
    }
    evictOldest() {
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
    cleanup() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.TTL) {
                this.cache.delete(key);
            }
        }
    }
}
exports.userAuthCache = new UserAuthCache();
setInterval(() => {
    exports.userAuthCache.cleanup();
}, 5 * 60 * 1000);
exports.default = exports.userAuthCache;
//# sourceMappingURL=cache.js.map