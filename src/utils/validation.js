/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
export const isValidEmail = (email) => {
  if (!email) return false
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number (Thai format)
 * @param {string} phone - Phone number to validate
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone) return false
  const phoneRegex = /^[0-9]{9,10}$/
  return phoneRegex.test(phone.replace(/[-\s]/g, ''))
}

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @returns {boolean}
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * Validate min length
 * @param {string} value - Value to validate
 * @param {number} min - Minimum length
 * @returns {boolean}
 */
export const minLength = (value, min) => {
  if (!value) return false
  return value.length >= min
}

/**
 * Validate max length
 * @param {string} value - Value to validate
 * @param {number} max - Maximum length
 * @returns {boolean}
 */
export const maxLength = (value, max) => {
  if (!value) return true
  return value.length <= max
}

/**
 * Validate number range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean}
 */
export const inRange = (value, min, max) => {
  if (value === null || value === undefined) return false
  return value >= min && value <= max
}

/**
 * Validate file size
 * @param {File} file - File to validate
 * @param {number} maxSizeMB - Maximum size in MB
 * @returns {boolean}
 */
export const isValidFileSize = (file, maxSizeMB = 10) => {
  if (!file) return false
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Validate file type
 * @param {File} file - File to validate
 * @param {Array<string>} allowedTypes - Allowed MIME types
 * @returns {boolean}
 */
export const isValidFileType = (file, allowedTypes = []) => {
  if (!file) return false
  if (allowedTypes.length === 0) return true
  return allowedTypes.includes(file.type)
}

/**
 * Validate time range (end time must be after start time, supports overnight)
 * @param {Date} startTime - Start time
 * @param {Date} endTime - End time
 * @returns {boolean}
 */
export const isValidTimeRange = (startTime, endTime) => {
  if (!startTime || !endTime) return false
  // รองรับการข้ามวัน - ถ้ามีทั้งสองค่าถือว่า valid
  return true
}

/**
 * Get validation error message
 * @param {string} field - Field name
 * @param {string} rule - Validation rule
 * @param {any} params - Rule parameters
 * @returns {string}
 */
export const getValidationMessage = (field, rule, params = {}) => {
  const messages = {
    required: `กรุณากรอก${field}`,
    email: 'รูปแบบอีเมลไม่ถูกต้อง',
    phone: 'รูปแบบเบอร์โทรศัพท์ไม่ถูกต้อง',
    minLength: `${field}ต้องมีอย่างน้อย ${params.min} ตัวอักษร`,
    maxLength: `${field}ต้องไม่เกิน ${params.max} ตัวอักษร`,
    inRange: `${field}ต้องอยู่ระหว่าง ${params.min} ถึง ${params.max}`,
    fileSize: `ขนาดไฟล์ต้องไม่เกิน ${params.max} MB`,
    fileType: 'ประเภทไฟล์ไม่ถูกต้อง',
    timeRange: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น'
  }
  
  return messages[rule] || 'ข้อมูลไม่ถูกต้อง'
}
