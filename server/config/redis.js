/**
 * Redis Cache Configuration
 *
 * Provides caching layer for frequently accessed data to reduce database load
 * and improve API response times.
 *
 * Features:
 * - Automatic fallback to no-cache mode if Redis is unavailable
 * - Connection retry logic
 * - Configurable TTL (Time To Live) defaults
 * - Helper functions for common cache operations
 * - Support for both local Redis and Railway Redis
 *
 * Uses ioredis for reliable cross-platform support (Windows/WSL/Linux).
 */

// Load correct .env file based on NODE_ENV (won't override vars already set by server.js)
const path = require('path');
const envFile =
  process.env.NODE_ENV === 'test'
    ? '.env.test'
    : process.env.NODE_ENV === 'production'
      ? '.env.production'
      : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '..', envFile) });
const Redis = require('ioredis');

// Default TTL values (in seconds)
const TTL = {
  SHORT: 60, // 1 minute - for rapidly changing data
  MEDIUM: 300, // 5 minutes - for search results, offers, demands
  LONG: 3600, // 1 hour - for user ratings, stats
  VERY_LONG: 86400, // 24 hours - for static data like cities
  WEEK: 604800, // 7 days - for rarely changing reference data
};

// Cache key prefixes for organization
const KEY_PREFIX = {
  OFFER: 'offer:',
  DEMAND: 'demand:',
  BOOKING: 'booking:',
  USER: 'user:',
  RATING: 'rating:',
  STATS: 'stats:',
  CITY: 'city:',
  SEARCH: 'search:',
  LIST: 'list:',
};

class RedisCache {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.isEnabled = process.env.REDIS_ENABLED !== 'false'; // Enabled by default
  }

  /**
   * Initialize Redis connection
   */
  async connect() {
    if (!this.isEnabled) {
      console.log('ℹ️  Redis: Caching is disabled via REDIS_ENABLED=false environment variable');
      console.log('ℹ️  Redis: Application will run without caching (direct database queries)');
      return;
    }

    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔌 Redis: Attempting to connect to', redisUrl);
      }

      this.client = new Redis(redisUrl, {
        connectTimeout: 10000,
        family: 4, // Force IPv4 — required for WSL2 mirrored networking on Windows
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 10) {
            console.error('Redis: Max reconnection attempts reached. Running without cache.');
            return null; // Stop reconnecting
          }
          return Math.min(times * 100, 3000);
        },
        lazyConnect: true,
      });

      // Event handlers
      this.client.on('connect', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔗 Redis: Connection established');
        }
      });

      this.client.on('ready', () => {
        this.isConnected = true;
        console.log('✅ Redis: Client is ready and connected');
      });

      this.client.on('error', (err) => {
        if (!err.message.includes('ECONNREFUSED')) {
          console.error('❌ Redis: Error:', err.message);
        }
        this.isConnected = false;
      });

      this.client.on('end', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔌 Redis: Connection closed');
        }
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Redis: Attempting to reconnect...');
        }
      });

      // Connect with timeout
      const connectPromise = this.client.connect();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout after 5s')), 5000)
      );

      await Promise.race([connectPromise, timeoutPromise]);

      // Test connection
      await this.client.ping();
      console.log('✅ Redis: Successfully connected and tested');
    } catch (error) {
      console.log('⚠️  Redis: Unable to connect -', error.message);
      console.log('ℹ️  Redis: Running without cache. Performance may be slower.');
      console.log('ℹ️  Redis: To disable this warning, set REDIS_ENABLED=false in .env');
      console.log(
        'ℹ️  Redis: To enable caching, install Redis: https://redis.io/docs/getting-started/'
      );

      this.isConnected = false;

      if (this.client) {
        try {
          this.client.disconnect();
        } catch (disconnectError) {
          // Ignore disconnect errors
        }
        this.client = null;
      }
    }
  }

  /**
   * Check if cache is available and connected
   */
  isAvailable() {
    return this.isEnabled && this.isConnected && this.client !== null;
  }

  /**
   * Get value from cache
   */
  async get(key) {
    if (!this.isAvailable()) return null;

    try {
      const value = await this.client.get(key);
      if (value === null) return null;

      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Redis: Error getting key "${key}":`, error.message);
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(key, value, ttl = TTL.MEDIUM) {
    if (!this.isAvailable()) return false;

    try {
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);

      if (ttl) {
        await this.client.setex(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }

      return true;
    } catch (error) {
      console.error(`Redis: Error setting key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Delete key(s) from cache
   */
  async del(keys) {
    if (!this.isAvailable()) return false;

    try {
      const keyArray = Array.isArray(keys) ? keys : [keys];
      await this.client.del(...keyArray);
      return true;
    } catch (error) {
      console.error(`Redis: Error deleting keys:`, error.message);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   */
  async deletePattern(pattern) {
    if (!this.isAvailable()) return 0;

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) return 0;

      await this.client.del(...keys);
      return keys.length;
    } catch (error) {
      console.error(`Redis: Error deleting pattern "${pattern}":`, error.message);
      return 0;
    }
  }

  /**
   * Flush entire cache (use with caution!)
   */
  async flush() {
    if (!this.isAvailable()) return false;

    try {
      await this.client.flushdb();
      console.log('Redis: Cache flushed');
      return true;
    } catch (error) {
      console.error('Redis: Error flushing cache:', error.message);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key) {
    if (!this.isAvailable()) return false;

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error(`Redis: Error checking key "${key}":`, error.message);
      return false;
    }
  }

  /**
   * Get remaining TTL for a key
   */
  async ttl(key) {
    if (!this.isAvailable()) return -2;

    try {
      return await this.client.ttl(key);
    } catch (error) {
      console.error(`Redis: Error getting TTL for "${key}":`, error.message);
      return -2;
    }
  }

  /**
   * Increment a counter
   */
  async incr(key) {
    if (!this.isAvailable()) return 0;

    try {
      return await this.client.incr(key);
    } catch (error) {
      console.error(`Redis: Error incrementing "${key}":`, error.message);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isAvailable()) {
      return {
        connected: false,
        enabled: this.isEnabled,
      };
    }

    try {
      const info = await this.client.info('stats');
      const dbSize = await this.client.dbsize();

      return {
        connected: true,
        enabled: this.isEnabled,
        keys: dbSize,
        info: info,
      };
    } catch (error) {
      console.error('Redis: Error getting stats:', error.message);
      return {
        connected: false,
        enabled: this.isEnabled,
        error: error.message,
      };
    }
  }

  /**
   * Gracefully close connection
   */
  async disconnect() {
    if (this.client) {
      try {
        await this.client.quit();
        console.log('Redis: Connection closed gracefully');
      } catch (error) {
        console.error('Redis: Error closing connection:', error.message);
      }
    }
  }
}

// Create singleton instance
const cache = new RedisCache();

// Export cache instance and utilities
module.exports = {
  cache,
  TTL,
  KEY_PREFIX,

  // Convenience functions
  get: (key) => cache.get(key),
  set: (key, value, ttl) => cache.set(key, value, ttl),
  del: (keys) => cache.del(keys),
  deletePattern: (pattern) => cache.deletePattern(pattern),
  flush: () => cache.flush(),
  exists: (key) => cache.exists(key),
  ttl: (key) => cache.ttl(key),
  incr: (key) => cache.incr(key),
  isAvailable: () => cache.isAvailable(),
  getStats: () => cache.getStats(),

  // Initialize connection (call this in server.js)
  connect: () => cache.connect(),
  disconnect: () => cache.disconnect(),
};
