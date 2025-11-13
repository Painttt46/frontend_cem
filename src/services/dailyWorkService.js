import axios from '@/utils/axiosConfig'
import cache from '@/utils/cache'

class DailyWorkService {
  /**
   * Get all daily work records
   * @param {boolean} useCache - Use cache or force refresh
   * @returns {Promise<Array>}
   */
  async getDailyWork(useCache = true) {
    const cacheKey = 'daily-work:all'
    
    if (useCache) {
      return cache.getOrSet(
        cacheKey,
        async () => {
          const response = await axios.get('/api/daily-work')
          return response.data
        },
        2 * 60 * 1000 // 2 minutes (shorter TTL for frequently updated data)
      )
    }

    const response = await axios.get('/api/daily-work')
    cache.set(cacheKey, response.data)
    return response.data
  }

  /**
   * Create daily work record
   * @param {Object} data - Work data
   * @returns {Promise<Object>}
   */
  async createDailyWork(data) {
    const response = await axios.post('/api/daily-work', data)
    
    // Invalidate cache
    cache.delete('daily-work:all')
    
    return response.data
  }

  /**
   * Update daily work record
   * @param {number} id - Record ID
   * @param {Object} data - Work data
   * @returns {Promise<Object>}
   */
  async updateDailyWork(id, data) {
    const response = await axios.put(`/api/daily-work/${id}`, data)
    
    // Invalidate cache
    cache.delete('daily-work:all')
    
    return response.data
  }

  /**
   * Delete daily work record
   * @param {number} id - Record ID
   * @returns {Promise<void>}
   */
  async deleteDailyWork(id) {
    await axios.delete(`/api/daily-work/${id}`)
    
    // Invalidate cache
    cache.delete('daily-work:all')
  }

  /**
   * Clear cache
   */
  clearCache() {
    cache.delete('daily-work:all')
  }
}

export default new DailyWorkService()
