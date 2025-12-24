import axios from 'axios'
import router from '@/router'
import store from '@/store'

// Configure axios defaults
axios.defaults.baseURL = ''
axios.defaults.withCredentials = true
axios.defaults.timeout = 30000 // 30 seconds

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // ไม่ส่ง request ถ้าอยู่หน้า login (ยกเว้น auth API)
    if (router.currentRoute.value.path === '/login' && !config.url?.includes('/auth/')) {
      const error = new Error('Request cancelled - on login page')
      error.silent = true
      return Promise.reject(error)
    }
    
    // Show loading only if not silent
    if (!config.silent) {
      store.dispatch('setLoading', true)
    }
    
    // Add token to Authorization header
    const token = localStorage.getItem('soc_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    store.dispatch('setLoading', false)
    return Promise.reject(error)
  }
)

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    // Hide loading only if not silent
    if (!response.config.silent) {
      store.dispatch('setLoading', false)
    }
    return response
  },
  (error) => {
    // Hide loading only if not silent request
    if (!error.config?.silent) {
      store.dispatch('setLoading', false)
    }
    
    // Handle different error types
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear all auth data and redirect to login
          localStorage.clear()
          sessionStorage.clear()
          // Clear all cookies
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
          })
          
          // Redirect to login
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
          error.silent = true
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
    } else if (error.silent) {
      // Silent error - don't log
      return Promise.reject(error)
    } else {
      // Something else happened
      error.userMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    }
    
    return Promise.reject(error)
  }
)

export default axios
