import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'

export function useErrorHandler() {
  const toast = useToast()
  const error = ref(null)
  const isError = ref(false)

  /**
   * Handle API errors and show toast notification
   * @param {Error} err - Error object from axios
   * @param {Object} options - Options for error handling
   * @param {boolean} options.showToast - Show toast notification (default: true)
   * @param {string} options.customMessage - Custom error message
   * @param {number} options.life - Toast life in ms (default: 5000)
   */
  const handleError = (err, options = {}) => {
    const {
      showToast = true,
      customMessage = null,
      life = 5000
    } = options

    // Set error state
    error.value = err
    isError.value = true

    // Get user-friendly message
    const message = customMessage || err.userMessage || err.message || 'เกิดข้อผิดพลาด'

    // Show toast notification
    if (showToast) {
      toast.add({
        severity: 'error',
        summary: 'เกิดข้อผิดพลาด',
        detail: message,
        life
      })
    }

    return message
  }

  /**
   * Clear error state
   */
  const clearError = () => {
    error.value = null
    isError.value = false
  }

  /**
   * Wrap async function with error handling
   * @param {Function} fn - Async function to wrap
   * @param {Object} options - Error handling options
   */
  const withErrorHandling = async (fn, options = {}) => {
    try {
      clearError()
      return await fn()
    } catch (err) {
      handleError(err, options)
      throw err
    }
  }

  return {
    error,
    isError,
    handleError,
    clearError,
    withErrorHandling
  }
}
