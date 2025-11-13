import axios from '@/utils/axiosConfig'
import cache from '@/utils/cache'

class UserService {
  /**
   * Get all users (with cache)
   * @param {boolean} useCache - Use cache or force refresh
   * @returns {Promise<Array>}
   */
  async getUsers(useCache = true) {
    const cacheKey = 'users:all'
    
    if (useCache) {
      return cache.getOrSet(
        cacheKey,
        async () => {
          const response = await axios.get('/api/users')
          return response.data
        },
        5 * 60 * 1000 // 5 minutes
      )
    }

    // Force refresh
    const response = await axios.get('/api/users')
    cache.set(cacheKey, response.data)
    return response.data
  }

  /**
   * Get active users only
   * @returns {Promise<Array>}
   */
  async getActiveUsers() {
    const users = await this.getUsers()
    return users.filter(u => u.is_active)
  }

  /**
   * Get user by ID
   * @param {number} id - User ID
   * @returns {Promise<Object>}
   */
  async getUserById(id) {
    const cacheKey = `user:${id}`
    
    return cache.getOrSet(
      cacheKey,
      async () => {
        const response = await axios.get(`/api/users/${id}`)
        return response.data
      },
      10 * 60 * 1000 // 10 minutes
    )
  }

  /**
   * Update user
   * @param {number} id - User ID
   * @param {Object} data - User data
   * @returns {Promise<Object>}
   */
  async updateUser(id, data) {
    const response = await axios.put(`/api/users/${id}`, data)
    
    // Invalidate cache
    cache.delete('users:all')
    cache.delete(`user:${id}`)
    
    return response.data
  }

  /**
   * Create user
   * @param {Object} data - User data
   * @returns {Promise<Object>}
   */
  async createUser(data) {
    const response = await axios.post('/api/users', data)
    
    // Invalidate cache
    cache.delete('users:all')
    
    return response.data
  }

  /**
   * Delete user
   * @param {number} id - User ID
   * @returns {Promise<void>}
   */
  async deleteUser(id) {
    await axios.delete(`/api/users/${id}`)
    
    // Invalidate cache
    cache.delete('users:all')
    cache.delete(`user:${id}`)
  }

  /**
   * Clear all user cache
   */
  clearCache() {
    cache.delete('users:all')
  }
}

export default new UserService()
