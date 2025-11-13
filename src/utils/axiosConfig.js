import axios from 'axios'
import router from '@/router'

// Configure axios defaults
axios.defaults.baseURL = 'http://localhost:3001'
axios.defaults.withCredentials = true
axios.defaults.timeout = 30000 // 30 seconds

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now()
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - redirect to login
          localStorage.clear()
          router.push('/login')
          error.userMessage = 'กรุณาเข้าสู่ระบบใหม่อีกครั้ง'
          break
          
        case 403:
          // Forbidden
          error.userMessage = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
          break
          
        case 404:
          // Not found
          error.userMessage = 'ไม่พบข้อมูลที่ต้องการ'
          break
          
        case 422:
          // Validation error
          error.userMessage = data.error || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
          break
          
        case 429:
          // Too many requests
          error.userMessage = 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'
          break
          
        case 500:
        case 502:
        case 503:
        case 504:
          // Server error
          error.userMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
          break
          
        default:
          error.userMessage = data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      }
    } else if (error.request) {
      // Request was made but no response
      if (error.code === 'ECONNABORTED') {
        error.userMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง'
      } else if (error.code === 'ERR_NETWORK') {
        error.userMessage = 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต'
      } else {
        error.userMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      }
    } else {
      // Something else happened
      error.userMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    }
    
    // Log error for debugging
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      userMessage: error.userMessage
    })
    
    return Promise.reject(error)
  }
)

export default axios
