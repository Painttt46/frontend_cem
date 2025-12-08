/**
 * Format date to YYYY-MM-DD (local timezone)
 * @param {Date} date - Date object
 * @returns {string|null} Formatted date string
 */
export const formatDate = (date) => {
  if (!date) return null
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date to Thai format (DD/MM/YYYY)
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted date string
 */
export const formatDateThai = (date) => {
  if (!date) return ''
  const d = new Date(date)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}

/**
 * Format date and time to Thai format
 * @param {Date|string} date - Date object or string
 * @returns {string} Formatted datetime string
 */
export const formatDateTime = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleString('th-TH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

/**
 * Format time to HH:MM:SS
 * @param {Date} time - Time object
 * @returns {string|null} Formatted time string
 */
export const formatTime = (time) => {
  if (!time) return null
  return time.toTimeString().split(' ')[0]
}

/**
 * Check if date is today
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isToday = (date) => {
  if (!date) return false
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * Check if date is in the past
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isPast = (date) => {
  if (!date) return false
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

/**
 * Check if date is in the future
 * @param {Date|string} date - Date to check
 * @returns {boolean}
 */
export const isFuture = (date) => {
  if (!date) return false
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d > today
}

/**
 * Calculate hours between two times
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {number} Hours (with 1 decimal)
 */
export const calculateHours = (startTime, endTime) => {
  if (!startTime || !endTime) return 0
  const diff = endTime - startTime
  return parseFloat((diff / (1000 * 60 * 60)).toFixed(1))
}

/**
 * Add days to date
 * @param {Date} date - Base date
 * @param {number} days - Number of days to add
 * @returns {Date} New date
 */
export const addDays = (date, days) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Get date range (start and end of day)
 * @param {Date} date - Date
 * @returns {Object} { start, end }
 */
export const getDateRange = (date) => {
  const start = new Date(date)
  start.setHours(0, 0, 0, 0)
  
  const end = new Date(date)
  end.setHours(23, 59, 59, 999)
  
  return { start, end }
}

/**
 * Parse date string to local date
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {Date|null} Date object
 */
export const parseLocalDate = (dateStr) => {
  if (!dateStr) return null
  const datePart = dateStr.split('T')[0]
  return new Date(datePart + 'T00:00:00')
}
