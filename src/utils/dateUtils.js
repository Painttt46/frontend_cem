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

// YYYY-MM-DD ตามเวลาท้องถิ่น (คืน null เมื่อไม่มีค่า) — ใช้ส่งวันที่ให้ backend
// เดิมเขียนซ้ำในหน้าเพิ่ม/แก้โครงการ, ฟอร์มลงงาน, WorkflowBuilder
export const toDateKey = (date) => {
  if (!date) return null
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// วัน + เดือนย่อภาษาไทย เช่น "5 ต.ค." (คืน '' เมื่อไม่มีค่า) — เดิมเขียนซ้ำในหน้าลงงานและขั้นตอนโครงการ
export const formatDayMonthTH = (date) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })
}

// จำนวนวันลาสำหรับแสดงผล — ตัดศูนย์ท้าย สูงสุด 4 ตำแหน่ง (DB ส่ง numeric มาเป็นสตริง เช่น "0.6250" → "0.625", "1.0000" → "1")
export const formatLeaveDays = (days) => String(parseFloat((Number(days) || 0).toFixed(4)))

// ชั่วโมงลาสำหรับแสดงผล — สูงสุด 2 ตำแหน่ง (5 → "5", 2.5 → "2.5")
export const formatLeaveHours = (hours) => String(parseFloat((Number(hours) || 0).toFixed(2)))

// ชั่วโมงทำงานต่อวันจากเวลาทำงาน { start_time, end_time, lunch_start, lunch_end } ('HH:MM') — ตั้งค่าผิดจนได้ ≤ 0 ใช้ 8
export const workHoursPerDay = (wh) => {
  const toMin = (t) => { const [h, m = 0] = String(t || '0:0').split(':').map(Number); return h * 60 + m }
  const perDay = ((toMin(wh?.lunch_start) - toMin(wh?.start_time)) + (toMin(wh?.end_time) - toMin(wh?.lunch_end))) / 60
  return perDay > 0 ? perDay : 8
}
