/**
 * Simple in-memory cache with TTL (Time To Live)
 */
class Cache {
  constructor() {
    this.store = new Map()
  }

  /**
   * Set cache with TTL
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, value, ttl = 5 * 60 * 1000) {
    const expiry = Date.now() + ttl
    this.store.set(key, { value, expiry })
  }

  /**
   * Get cached value
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    const item = this.store.get(key)
    
    if (!item) {
      return null
    }

    // Check if expired
    if (Date.now() > item.expiry) {
      this.store.delete(key)
      return null
    }

    return item.value
  }

  /**
   * Check if cache exists and is valid
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null
  }

  /**
   * Delete cache
   * @param {string} key - Cache key
   */
  delete(key) {
    this.store.delete(key)
  }

  /**
   * Clear all cache
   */
  clear() {
    this.store.clear()
  }

  /**
   * Get or set cache
   * @param {string} key - Cache key
   * @param {Function} fetcher - Async function to fetch data if not cached
   * @param {number} ttl - Time to live in milliseconds
   * @returns {Promise<any>}
   */
  async getOrSet(key, fetcher, ttl = 5 * 60 * 1000) {
    const cached = this.get(key)
    
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    this.set(key, value, ttl)
    return value
  }
}

// Export singleton instance
export default new Cache()
