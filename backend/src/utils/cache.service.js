import Redis from 'ioredis';

/**
 * Redis Cache Service (Task 11)
 * Provides caching wrapper for heavy database queries
 */
class CacheService {
  constructor() {
    this.redis = null;
    this.enabled = false;
    this.defaultTTL = 300; // 5 minutes default

    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL);
        this.enabled = true;

        this.redis.on('connect', () => {
          console.log('🔴 Redis connected');
        });

        this.redis.on('error', (err) => {
          console.error('Redis error:', err);
          this.enabled = false;
        });
      } catch (error) {
        console.warn('Redis initialization failed:', error.message);
        this.enabled = false;
      }
    }
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    if (!this.enabled) return null;

    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>}
   */
  async set(key, value, ttl = this.defaultTTL) {
    if (!this.enabled) return false;

    try {
      await this.redis.setex(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>}
   */
  async del(key) {
    if (!this.enabled) return false;

    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   * @param {string} pattern - Key pattern (e.g., 'users:*')
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    if (!this.enabled) return 0;

    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        return await this.redis.del(...keys);
      }
      return 0;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if cache is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Generate cache key
   * @param {string} prefix - Key prefix
   * @param {Object} params - Parameters to include in key
   * @returns {string}
   */
  generateKey(prefix, params = {}) {
    const paramString = Object.keys(params)
      .sort()
      .map(k => `${k}:${params[k]}`)
      .join(':');
    return paramString ? `${prefix}:${paramString}` : prefix;
  }
}

// Export singleton instance
export const cacheService = new CacheService();

/**
 * Cache wrapper for async functions
 * @param {Function} fn - Function to cache
 * @param {string} key - Cache key
 * @param {number} ttl - Time to live in seconds
 * @returns {Function}
 */
export const cacheWrapper = (fn, key, ttl = 300) => {
  return async (...args) => {
    if (!cacheService.isEnabled()) {
      return await fn(...args);
    }

    const cacheKey = `${key}:${JSON.stringify(args)}`;

    // Try to get from cache
    const cached = await cacheService.get(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // Execute function and cache result
    const result = await fn(...args);
    await cacheService.set(cacheKey, result, ttl);
    return result;
  };
};

export default CacheService;
