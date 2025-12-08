// รายการสถานะที่ถือว่า "เสร็จสมบูรณ์"
const COMPLETED_STATUSES = ['completed', 'done', 'finished', 'เสร็จสมบูรณ์']

/**
 * ตรวจสอบว่าสถานะเป็น "เสร็จสมบูรณ์" หรือไม่
 * @param {string} status - สถานะที่ต้องการตรวจสอบ
 * @returns {boolean}
 */
export const isCompleted = (status) => {
  if (!status) return false
  return COMPLETED_STATUSES.includes(status)
}

/**
 * ตรวจสอบว่าสถานะยัง "ไม่เสร็จ" (กำลังดำเนินการ)
 * @param {string} status - สถานะที่ต้องการตรวจสอบ
 * @returns {boolean}
 */
export const isActive = (status) => {
  return !isCompleted(status)
}

/**
 * เพิ่มสถานะใหม่เข้าไปในรายการ "เสร็จสมบูรณ์"
 * @param {string} status - สถานะที่ต้องการเพิ่ม
 */
export const addCompletedStatus = (status) => {
  if (!COMPLETED_STATUSES.includes(status)) {
    COMPLETED_STATUSES.push(status)
  }
}

/**
 * ดึงรายการสถานะที่ถือว่า "เสร็จสมบูรณ์" ทั้งหมด
 * @returns {string[]}
 */
export const getCompletedStatuses = () => {
  return [...COMPLETED_STATUSES]
}
