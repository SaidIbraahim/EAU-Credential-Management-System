"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cache = void 0;
class MemoryCache {
    constructor() {
        this.cache = new Map();
        this.timers = new Map();
    }
    async get(key) {
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
    async set(key, value, ttlSeconds = 300) {
        const expiry = Date.now() + (ttlSeconds * 1000);
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }
        this.cache.set(key, { value, expiry });
        const timer = setTimeout(() => {
            this.delete(key);
        }, ttlSeconds * 1000);
        this.timers.set(key, timer);
    }
    async delete(key) {
        this.cache.delete(key);
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }
    }
    async clear() {
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
exports.cache = new MemoryCache();
//# sourceMappingURL=cache.js.map