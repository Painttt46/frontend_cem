import axios from 'axios'
import router from '@/router'
import store from '@/store'

// Configure axios defaults
axios.defaults.baseURL = ''
axios.defaults.withCredentials = true
axios.defaults.timeout = 60000 // 60 seconds

// Track pending requests for loading state
let pendingRequests = 0

function updateLoading(increment) {
  pendingRequests = Math.max(0, pendingRequests + increment)
  store.dispatch('setLoading', pendingRequests > 0)
}

// Request interceptor
axios.interceptors.request.use(
  (config) => {
    // ไม่ส่ง request ถ้าอยู่หน้า login (ยกเว้น auth API และ role-permissions)
    if (router.currentRoute.value.path === '/login' && 
        !config.url?.includes('/auth/') && 
        !config.url?.includes('/role-permissions')) {
      const error = new Error('Request cancelled - on login page')
      error.silent = true
      return Promise.reject(error)
    }
    
    // Track loading
    if (!config.silent) {
      updateLoading(1)
    }
    
    // Add token to Authorization header
    const token = localStorage.getItem('soc_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    if (!error.config?.silent) {
      updateLoading(-1)
    }
    return Promise.reject(error)
  }
)

// Response interceptor
axios.interceptors.response.use(
  (response) => {
    if (!response.config.silent) {
      updateLoading(-1)
    }
    return response
  },
  (error) => {
    // Always decrement loading for non-silent requests
    if (!error.config?.silent && error.config) {
      updateLoading(-1)
    }
    
    // Handle different error types
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          // Unauthorized - clear all auth data and redirect to login
          localStorage.clear()
          sessionStorage.clear()
          document.cookie.split(";").forEach((c) => {
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
          })
          
          if (router.currentRoute.value.path !== '/login') {
            router.push('/login')
          }
          error.silent = true
          break
          
        case 403:
          error.userMessage = 'คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้'
          break
          
        case 404:
          error.userMessage = 'ไม่พบข้อมูลที่ต้องการ'
          break
          
        case 422:
          error.userMessage = data.error || 'ข้อมูลไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง'
          break
          
        case 429:
          error.userMessage = 'คำขอมากเกินไป กรุณารอสักครู่แล้วลองใหม่'
          break
          
        case 500:
        case 502:
        case 503:
        case 504:
          error.userMessage = 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง'
          break
          
        default:
          error.userMessage = data.error || 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
      }
    } else if (error.request) {
      if (error.code === 'ECONNABORTED') {
        error.userMessage = 'การเชื่อมต่อหมดเวลา กรุณาลองใหม่อีกครั้ง'
      } else if (error.code === 'ERR_NETWORK') {
        error.userMessage = 'ไม่สามารถเชื่อมต่อได้ กรุณาตรวจสอบอินเทอร์เน็ต'
      } else {
        error.userMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้'
      }
    } else if (error.silent) {
      return Promise.reject(error)
    } else {
      error.userMessage = 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
    }
    
    return Promise.reject(error)
  }
)

// Reset loading state (can be called manually if needed)
export function resetLoading() {
  pendingRequests = 0
  store.dispatch('setLoading', false)
}

export default axios
